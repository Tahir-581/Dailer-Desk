
import { NextRequest, NextResponse } from "next/server";
import { db, kb, kbChunks } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateEmbedding, generateChunkEmbeddings } from "@/lib/kb/embeddings";
import { fetchWebPage, batchScrapeUrls, discoverSitemap } from "@/lib/kb/web-scraper";
import { uploadFilesToS3 } from "@/lib/s3-upload";
import crypto from "node:crypto";

function sanitizeText(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");

    const allKb = orgId
      ? await db.select().from(kb).where(eq(kb.orgId, orgId))
      : await db.select().from(kb);
    return NextResponse.json(allKb);
  } catch (error) {
    console.error("Error fetching KB:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action");
    if (action === "discover-sitemap") {
      const body = await request.json();
      const { baseUrl } = body;

      if (!baseUrl || typeof baseUrl !== "string") {
        return NextResponse.json(
          { error: "baseUrl is required and must be a string" },
          { status: 400 }
        );
      }

      try { new URL(baseUrl) }
      catch (error) {
        return NextResponse.json(
          { error: "Invalid URL format. URL must start with http:// or https://" },
          { status: 400 }
        )
      }

      const urls = await discoverSitemap(baseUrl);

      if (urls.length === 0) {
        return NextResponse.json(
          { error: "No pages found. Please check the URL and try again." },
          { status: 404 }
        )
      }

      return NextResponse.json({
        urls: urls.map((item) => ({ url: item.url, title: item.title, lastmod: item.lastmod })),
        count: urls.length
      })
    }

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { orgId, name, description, createdBy, sourceType, sourceUrls, baseUrl, autoRefresh, refreshInterval, textContent } = body;

      if (!orgId || !name || !createdBy) {
        return NextResponse.json(
          { error: "orgId, name, and createdBy are required" },
          { status: 400 }
        )
      }

      if (!sourceType || !["web", "text"].includes(sourceType)) {
        return NextResponse.json(
          { error: "sourceType must be 'web' or 'text' for JSON requests" },
          { status: 400 }
        )
      }

      let extractedContent = "";
      let metadata: Record<string, unknown> = { sourceType, org_id: orgId }

      if (sourceType === "web") {
        if (!sourceUrls || !Array.isArray(sourceUrls) || sourceUrls.length === 0) {
          return NextResponse.json(
            { error: "sourceUrls is required and must be a non-empty array" },
            { status: 400 }
          )
        }

        for (const url of sourceUrls) {
          try { new URL(url) }
          catch { return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 }) }
        }

        const { success, failed } = await batchScrapeUrls(sourceUrls, { maxConcurrent: 5, delay: 500, timeout: 10000 });

        if (success.length === 0) {
          return NextResponse.json({ error: "Failed to scrape any pages. Please check the URLs and try again." }, { status: 400 })
        }

        extractedContent = success.map((page) => { const cleanText = sanitizeText(page.content) || ""; return `=== ${page.title} (${page.url}) ===\n\n${cleanText}\n\n` }).join("\n");

        metadata.sourceUrls = sourceUrls;
        metadata.pageCount = success.length;
        if (baseUrl) { metadata.baseUrl = baseUrl }

        if (autoRefresh !== undefined) {
          metadata.autoRefresh = Boolean(autoRefresh);
          metadata.refreshInterval = refreshInterval || 24;
          metadata.lastRefreshed = new Date().toISOString();
        }

        if (failed.length > 0) { metadata.failedUrls = failed }
      }

      if (sourceType === "text") {
        if (!textContent || typeof textContent !== "string") {
          return NextResponse.json({ error: "textContent is required and must be a string" }, { status: 400 })
        }

        const textLength = textContent.length;
        const maxLength = 100000;

        if (textLength < 10) {
          return NextResponse.json({ error: "Text content must be at least 10 characters" }, { status: 400 })
        }

        if (textLength > maxLength) {
          return NextResponse.json({ error: `Text content exceeds maximum length of ${maxLength} characters` }, { status: 400 })
        }

        extractedContent = textContent;
        metadata.characterCount = textLength;
      }

      const sanitizedName = sanitizeText(name) || name;
      const sanitizedDescription = sanitizeText(description) || "";
      const sanitizedContent = sanitizeText(extractedContent) || "";

      metadata.name = sanitizedName;

      const embeddingText = [sanitizedName, sanitizedDescription, sanitizedContent].filter((text) => text && text.trim().length > 0).join("\n\n").trim();

      let chunks: { text: string; embedding: number[] }[] = [];
      let averageEmbedding: number[] | null = null;
      if (embeddingText.length > 0 && process.env.GEMINI_API_KEY) {
        try {
          chunks = await generateChunkEmbeddings(embeddingText);
          if (chunks.length > 0) {
            const sum = chunks[0].embedding.map(() => 0);
            for (const chunk of chunks) {
              for (let i = 0; i < chunk.embedding.length; i++) {
                sum[i] += chunk.embedding[i];
              }
            }
            averageEmbedding = sum.map(v => v / chunks.length);
          }
        } catch (error) {
          console.error("Error generating embeddings:", error);
        }
      }

      const insertValues: {
        orgId: string;
        name: string;
        description: string | null;
        text: string | null;
        embedding?: number[] | null;
        metadata: Record<string, unknown>;
        createdBy: string
      } = {
        orgId,
        name: sanitizedName,
        description: sanitizedDescription,
        text: sanitizedContent || null,
        metadata,
        createdBy: sanitizeText(createdBy) || createdBy
      };

      if (averageEmbedding) {
        insertValues.embedding = averageEmbedding;
      }

      const [newKb] = await db.insert(kb).values(insertValues).returning();

      if (chunks.length > 0) {
        await db.insert(kbChunks).values(
          chunks.map((chunk) => {
            const nodeMetadata = { ...metadata, org_id: orgId };
            return {
              kbId: newKb.id,
              orgId,
              nodeId: crypto.randomUUID(),
              text: chunk.text,
              embedding: chunk.embedding,
              metadata: nodeMetadata,
            };
          })
        );
      }

      return NextResponse.json({
        success: true,
        kb: newKb,
        chunkCount: chunks.length
      }, { status: 201 })
    }

    const formData = await request.formData();

    const orgId = formData.get("orgId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const createdBy = formData.get("createdBy") as string;
    const metadataStr = formData.get("metadata") as string | null;

    if (!orgId || !name || !createdBy) {
      return NextResponse.json(
        { error: "orgId, name, and createdBy are required" },
        { status: 400 }
      );
    }

    const files: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
      }
    }

    let extractedContent = "";

    if (files.length > 0) {
      const { PDFParse } = require("pdf-parse");

      if (!PDFParse || typeof PDFParse !== "function") {
        throw new Error("PDFParse class not found in pdf-parse module");
      }

      const contentPromises = files.map(async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfParser = new PDFParse({ data: buffer });
          const data = await pdfParser.getText();
          await pdfParser.destroy();

          return {
            fileName: file.name,
            text: data.text,
            pages: data.total,
          };
        } catch (error) {
          console.error(`Error parsing PDF ${file.name}:`, error);
          return {
            fileName: file.name,
            text: `[Error extracting content from ${file.name}]`,
            pages: 0,
          };
        }
      });

      const results = await Promise.all(contentPromises);

      extractedContent = results
        .map((result) => {
          const cleanText = sanitizeText(result.text) || '';
          return `=== ${result.fileName} (${result.pages} pages) ===\n\n${cleanText}\n\n`;
        })
        .join("\n");
    }

    const sanitizedName = sanitizeText(name) || name;
    const sanitizedDescription = sanitizeText(description) || "";
    const sanitizedContent = sanitizeText(extractedContent) || "";

    let metadata: Record<string, unknown> = { org_id: orgId, name: sanitizedName };
    if (metadataStr) {
      try {
        const parsedMetadata = JSON.parse(metadataStr);
        metadata = { ...metadata, ...parsedMetadata };
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }
    }

    if (files.length > 0) {
      metadata.files = files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
    }

    let embeddingText = [
      sanitizedName,
      sanitizedDescription,
      sanitizedContent,
    ]
      .filter((text) => text && text.trim().length > 0)
      .join("\n\n")
      .trim();

    let chunks: { text: string; embedding: number[] }[] = [];
    let averageEmbedding: number[] | null = null;
    if (embeddingText.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        chunks = await generateChunkEmbeddings(embeddingText);
        if (chunks.length > 0) {
          const dims = chunks[0].embedding.length;
          const sum = new Array(dims).fill(0);
          for (const chunk of chunks) {
            for (let i = 0; i < dims; i++) {
              sum[i] += chunk.embedding[i];
            }
          }
          averageEmbedding = sum.map(v => v / chunks.length);
        }
      } catch (error) {
        console.error("Error generating embedding:", error);
        averageEmbedding = null;
      }
    }

    const insertValues: {
      orgId: string;
      name: string;
      description: string | null;
      text: string | null;
      embedding?: number[] | null;
      metadata: Record<string, unknown>;
      createdBy: string;
    } = {
      orgId,
      name: sanitizedName,
      description: sanitizedDescription,
      text: sanitizedContent || null,
      metadata,
      createdBy: sanitizeText(createdBy) || createdBy,
    };

    if (averageEmbedding) {
      insertValues.embedding = averageEmbedding;
    }

    const [newKb] = await db.insert(kb).values(insertValues).returning();
    let finalKb = newKb;

    if (files.length > 0) {
      const { results: uploadResults, urls } = await uploadFilesToS3(files, orgId, newKb.id);

      metadata.files = files.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: urls[index] || null,
      }));

      const [updatedKb] = await db
        .update(kb)
        .set({
          fileUrl: urls.length > 0 ? urls[0] : null,
          metadata,
        })
        .where(eq(kb.id, newKb.id))
        .returning();

      if (updatedKb) {
        finalKb = updatedKb;
      }
    }

    if (chunks.length > 0) {
      await db.insert(kbChunks).values(
        chunks.map((chunk) => {
          const nodeMetadata = { ...metadata, org_id: orgId };
          return {
            kbId: newKb.id,
            orgId,
            nodeId: crypto.randomUUID(),
            text: chunk.text,
            embedding: chunk.embedding,
            metadata: nodeMetadata,
          };
        })
      );
    }

    return NextResponse.json(finalKb, { status: 201 });
  } catch (error) {
    console.error("Error creating KB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create knowledge base item" },
      { status: 500 }
    );
  }
}
