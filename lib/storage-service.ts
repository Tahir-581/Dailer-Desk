import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT;
const REGION = process.env.SUPABASE_S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY_ID;
const SECRET_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET_NAME;

const s3Client = new S3Client({
  region: REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY || "",
    secretAccessKey: SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export class StorageService {
  static async uploadRecording(sessionId: string, data: Buffer | Blob): Promise<string> {
    if (!BUCKET_NAME) throw new Error("Bucket name not configured");
    
    const key = `recordings/${sessionId}.mp3`;
    let body: Buffer | Uint8Array;

    if (data instanceof Buffer) {
      body = data;
    } else {
      body = Buffer.from(await data.arrayBuffer());
    }
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'audio/mpeg'
    });
    
    await s3Client.send(command);
    return key;
  }

  static async uploadTranscript(sessionId: string, content: string): Promise<string> {
    if (!BUCKET_NAME) throw new Error("Bucket name not configured");

    const key = `transcripts/${sessionId}.json`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: 'application/json'
    });
    
    await s3Client.send(command);
    return key;
  }

  static async generateSignedUrl(fileKey: string, expirySeconds: number = 3600): Promise<string> {
    if (!BUCKET_NAME) throw new Error("Bucket name not configured");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    
    return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
  }

  static async deleteFile(fileKey: string): Promise<void> {
    if (!BUCKET_NAME) throw new Error("Bucket name not configured");

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    
    await s3Client.send(command);
  }
}
