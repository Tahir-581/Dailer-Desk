import { NextRequest, NextResponse } from "next/server";
import { db, kb } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/kb/embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RAGResult {
    id: string;
    name: string;
    description: string | null;
    content: string | null;
    similarity: number;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
        return 0;
    }

    return dotProduct / denominator;
}

async function getRAGContext(question: string, orgId: string, limit: number = 10, minSimilarity: number = 0.5): Promise<string> {
    const queryVector = await generateEmbedding(question);




    try {
        const vectorString = `[${queryVector.join(",")}]`;
        const queryResult = await db.execute(
            sql.raw(`
                SELECT 
                    id,
                    name,
                    description,
                    content,
                    1 - (embedding <=> '${vectorString}'::vector) AS similarity
                FROM kb
                WHERE embedding IS NOT NULL
                    AND org_id = '${orgId}'::uuid
                    AND 1 - (embedding <=> '${vectorString}'::vector) > ${minSimilarity}
                ORDER BY similarity DESC
                LIMIT ${limit}
            `)
        );

        const results = Array.isArray(queryResult)
            ? (queryResult as unknown as RAGResult[])
            : ((queryResult as any).rows as unknown as RAGResult[]);

        let context = "";
        for (const doc of results) {
            context += `source: ${doc.name}\n`;
            if (doc.description) {
                context += `description: ${doc.description}\n`;
            }
            if (doc.content) {
                context += `content: ${doc.content}\n`;
            }
            context += `\n`;
        }

        return context;
    } catch (error) {
        const kbItemsResult = await db.execute(
            sql.raw(`
                SELECT 
                    id,
                    name,
                    description,
                    content,
                    embedding::jsonb AS embedding
                FROM kb
                WHERE embedding IS NOT NULL
                    AND org_id = '${orgId}'::uuid
            `)
        );

        interface KbItemRaw {
            id: string;
            name: string;
            description: string | null;
            content: string | null;
            embedding: number[] | string;
        }

        const kbItemsRaw = Array.isArray(kbItemsResult)
            ? (kbItemsResult as unknown as KbItemRaw[])
            : ((kbItemsResult as any).rows as unknown as KbItemRaw[] || []);

        const kbItems = kbItemsRaw.map((item: KbItemRaw) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            content: item.content,
            embedding: Array.isArray(item.embedding)
                ? item.embedding
                : (typeof item.embedding === 'string' ? JSON.parse(item.embedding) : item.embedding) as number[],
        }));

        interface ResultWithSimilarity {
            id: string;
            name: string;
            description: string | null;
            content: string | null;
            similarity: number;
        }

        const resultsWithSimilarity: ResultWithSimilarity[] = kbItems
            .filter((item) => item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0)
            .map((item) => {
                const similarity = cosineSimilarity(queryVector, item.embedding!);
                return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    content: item.content,
                    similarity,
                };
            })
            .filter((item) => item.similarity >= minSimilarity)
            .sort((a: ResultWithSimilarity, b: ResultWithSimilarity) => b.similarity - a.similarity)
            .slice(0, limit);

        let context = "";
        for (const doc of resultsWithSimilarity) {
            context += `source: ${doc.name}\n`;
            if (doc.description) {
                context += `description: ${doc.description}\n`;
            }
            if (doc.content) {
                context += `content: ${doc.content}\n`;
            }
            context += `\n`;
        }

        return context;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, orgId, limit = 10, minSimilarity = 0.5 } = body;

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json(
                { error: "Question is required and must be a non-empty string", question, orgId },
                { status: 400 }
            );
        }

        if (!orgId) {
            return NextResponse.json(
                { error: "orgId is required" },
                { status: 400 }
            );
        }



        const context = await getRAGContext(question, orgId, limit, minSimilarity);

        if (!context || context.trim().length === 0) {
            return NextResponse.json({
                answer: "I'm sorry but I don't know the answer to that question. Please try again.",
                context: null,
            });
        }



        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
You are a AI code assistant who answers questions about the codebase. Your target audience is a technical intern who has questions and is looking to understand the codebase.

AI assistant is a brand new, powerful, human-like artificial intelligence.

The traits of AI include expert knowledge, helpfulness, cleverness and articulateness.

AI is a well-behaved and well-mannered individual.

AI is always friendly, kind and inspiring, and he is eager to provide vivid and thoughtful responses to the user.

AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in the conversation.

If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including code suggestions, snippets, and changes.

START OF CONTEXT BLOCK

${context}

END OF CONTEXT BLOCK

START QUESTION

${question}

END OF QUESTION

AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.

If the context does not provide the answer to question, the AI assistant will say, "I'm sorry but I don't know the answer to that question. Please try again."

AI assistant will not apologize for previous responses, but instead will indicate new information was gained.

AI assistant will not invent anything that is not drawn directly from the context.

Answer in markdown syntax, with code snippets if need. Be as detailed as possible when answering.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        return NextResponse.json({
            question,
            answer
        });
    } catch (error) {
        console.error("Error generating answer:", error);
        return NextResponse.json(
            {
                error: "Failed to generate answer",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}