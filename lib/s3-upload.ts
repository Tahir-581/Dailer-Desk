import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION || "us-east-1",
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

export interface UploadFileResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadFileToS3(
  file: File,
  orgId: string,
  kbId: string
): Promise<UploadFileResult> {
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_S3_ENDPOINT || !process.env.SUPABASE_STORAGE_BUCKET_NAME) {
      throw new Error("Missing S3 configuration");
    }

    // Generate a unique key for the file
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `knowledge-base/${orgId}/${kbId}/${timestamp}_${sanitizedFileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.SUPABASE_STORAGE_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct the public URL
    const url = `${process.env.SUPABASE_S3_ENDPOINT!.replace(/\/$/, "")}/${process.env.SUPABASE_STORAGE_BUCKET_NAME}/${key}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function uploadFilesToS3(
  files: File[],
  orgId: string,
  kbId: string
): Promise<{ results: UploadFileResult[]; urls: string[] }> {
  const results = await Promise.all(
    files.map(file => uploadFileToS3(file, orgId, kbId))
  );

  const urls = results
    .filter(result => result.success && result.url)
    .map(result => result.url!);

  return { results, urls };
}
