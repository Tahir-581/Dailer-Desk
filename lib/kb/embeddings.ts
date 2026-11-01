import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const MAX_CHUNK_SIZE_BYTES = 500;
const CHUNK_OVERLAP_BYTES = 100;

if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY environment variable is not set. Embeddings will not work.");
}

function chunkText(text: string, maxBytes: number = MAX_CHUNK_SIZE_BYTES): string[] {
    const textBytes = new TextEncoder().encode(text);

    if (textBytes.length <= maxBytes) {
        return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < textBytes.length) {
        const endIndex = Math.min(startIndex + maxBytes, textBytes.length);
        let chunkBytes = textBytes.slice(startIndex, endIndex);
        let chunk = new TextDecoder('utf-8', { fatal: false }).decode(chunkBytes);

        if (endIndex < textBytes.length) {
            const lastSpace = chunk.lastIndexOf(' ');
            const lastNewline = chunk.lastIndexOf('\n');
            const lastSentence = Math.max(
                chunk.lastIndexOf('.'),
                chunk.lastIndexOf('!'),
                chunk.lastIndexOf('?')
            );

            const breakPoint = Math.max(lastSentence, lastNewline, lastSpace);

            if (breakPoint > chunk.length * 0.7) {
                chunk = chunk.substring(0, breakPoint + 1);
                const actualChunkBytes = new TextEncoder().encode(chunk);
                startIndex += actualChunkBytes.length;
            } else {
                startIndex = endIndex;
            }
        } else {
            startIndex = endIndex;
        }

        if (chunk.trim().length > 0) {
            chunks.push(chunk.trim());
        }

        if (startIndex < textBytes.length && chunks.length > 0) {
            startIndex = Math.max(0, startIndex - CHUNK_OVERLAP_BYTES);
        }
    }

    return chunks.length > 0 ? chunks : [text];
}

function averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
        throw new Error("Cannot average empty embeddings array");
    }

    if (embeddings.length === 1) {
        return embeddings[0];
    }

    const dimension = embeddings[0].length;
    const averaged = new Array(dimension).fill(0);

    for (const embedding of embeddings) {
        if (embedding.length !== dimension) {
            throw new Error("All embeddings must have the same dimension");
        }
        for (let i = 0; i < dimension; i++) {
            averaged[i] += embedding[i];
        }
    }

    for (let i = 0; i < dimension; i++) {
        averaged[i] /= embeddings.length;
    }

    return averaged;
}

async function generateEmbeddingForChunk(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
        throw new Error("Failed to generate embedding: empty result");
    }

    return embedding;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error("Text cannot be empty");
    }

    try {
        const chunks = chunkText(text);

        if (chunks.length === 1) {
            return await generateEmbeddingForChunk(chunks[0]);
        }

        const chunkEmbeddings = await Promise.all(
            chunks.map(chunk => generateEmbeddingForChunk(chunk))
        );

        return averageEmbeddings(chunkEmbeddings);
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error(
            `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    if (!texts || texts.length === 0) {
        throw new Error("Texts array cannot be empty");
    }

    const validTexts = texts.filter((text) => text && text.trim().length > 0);

    if (validTexts.length === 0) {
        throw new Error("No valid texts to generate embeddings for");
    }

    try {
        const embeddings = await Promise.all(
            validTexts.map(text => generateEmbedding(text))
        );

        const invalidEmbeddings = embeddings.filter(
            (emb) => !emb || emb.length === 0
        );

        if (invalidEmbeddings.length > 0) {
            throw new Error(
                `Failed to generate ${invalidEmbeddings.length} embedding(s)`
            );
        }

        return embeddings;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw new Error(
            `Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

export async function generateChunkEmbeddings(text: string): Promise<{ text: string; embedding: number[] }[]> {
    if (!text || text.trim().length === 0) {
        throw new Error("Text cannot be empty");
    }

    try {
        const chunks = chunkText(text);
        const results = await Promise.all(
            chunks.map(async (chunk) => {
                const embedding = await generateEmbeddingForChunk(chunk);
                return { text: chunk, embedding };
            })
        );
        return results;
    } catch (error) {
        console.error("Error generating chunk embeddings:", error);
        throw new Error(
            `Failed to generate chunk embeddings: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

export async function saveEmbeddingToVectorStore(
    embedding: number[],
    recordId: string,
    tableName: string = 'kb',
    embeddingColumn: string = 'embedding'
): Promise<void> {
    if (!embedding || embedding.length === 0) {
        throw new Error("Embedding cannot be empty");
    }

    if (!recordId) {
        throw new Error("Record ID is required");
    }

    try {
        const vectorString = `[${embedding.join(",")}]`;
        const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) ? tableName : 'kb';
        const validColumnName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(embeddingColumn) ? embeddingColumn : 'embedding';

        await db.execute(
            sql.raw(`
                UPDATE ${validTableName}
                SET ${validColumnName} = '${vectorString}'::vector
                WHERE id = '${recordId}'::uuid
            `)
        );
    } catch (error) {
        console.error("Error saving embedding to vector store:", error);
        throw new Error(
            `Failed to save embedding to vector store: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

export async function saveEmbeddingWithRecord(
    embedding: number[],
    data: {
        orgId: string;
        name: string;
        description?: string | null;
        content?: string | null;
        metadata?: Record<string, unknown>;
        createdBy: string;
    },
    tableName: string = 'kb',
    embeddingColumn: string = 'embedding'
): Promise<string> {
    if (!embedding || embedding.length === 0) {
        throw new Error("Embedding cannot be empty");
    }

    try {
        const vectorString = `[${embedding.join(",")}]`;
        const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) ? tableName : 'kb';
        const validColumnName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(embeddingColumn) ? embeddingColumn : 'embedding';

        const escapeString = (str: string | null | undefined): string => {
            if (!str) return 'NULL';
            return `'${str.replace(/'/g, "''")}'`;
        };

        const nameEscaped = escapeString(data.name);
        const descriptionEscaped = escapeString(data.description);
        const contentEscaped = escapeString(data.content);
        const createdByEscaped = escapeString(data.createdBy);
        const metadataEscaped = data.metadata
            ? `'${JSON.stringify(data.metadata).replace(/'/g, "''")}'`
            : "'{}'";

        const result = await db.execute(
            sql.raw(`
                INSERT INTO ${validTableName} (
                    org_id,
                    name,
                    description,
                    content,
                    ${validColumnName},
                    metadata,
                    created_by
                )
                VALUES (
                    '${data.orgId}'::uuid,
                    ${nameEscaped}::text,
                    ${descriptionEscaped}::text,
                    ${contentEscaped}::text,
                    '${vectorString}'::vector,
                    ${metadataEscaped}::jsonb,
                    ${createdByEscaped}::text
                )
                RETURNING id
            `)
        );

        const rows = Array.isArray(result) ? result : (result as any).rows || [];
        if (rows.length === 0) {
            throw new Error("Failed to insert record");
        }

        return rows[0].id;
    } catch (error) {
        console.error("Error saving embedding with record:", error);
        throw new Error(
            `Failed to save embedding with record: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

export async function generateAndSaveEmbedding(
    text: string,
    recordId: string,
    tableName: string = 'kb',
    embeddingColumn: string = 'embedding'
): Promise<void> {
    if (!text || text.trim().length === 0) {
        throw new Error("Text cannot be empty");
    }

    try {
        const embedding = await generateEmbedding(text);
        await saveEmbeddingToVectorStore(embedding, recordId, tableName, embeddingColumn);
    } catch (error) {
        console.error("Error generating and saving embedding:", error);
        throw error;
    }
}
