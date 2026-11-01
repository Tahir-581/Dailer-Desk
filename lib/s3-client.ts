import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT;
const REGION = process.env.SUPABASE_S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY_ID;
const SECRET_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET_NAME;

if (!S3_ENDPOINT || !ACCESS_KEY || !SECRET_KEY || !BUCKET_NAME) {
    console.warn("Missing S3 configuration for recordings playback.");
}

const s3Client = new S3Client({
    region: REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY || "",
        secretAccessKey: SECRET_KEY || "",
    },
    forcePathStyle: true,
});

export interface Recording {
    key: string;
    url: string;
    lastModified: Date | undefined;
    size: number | undefined;
    filename: string;
}

export async function listRecordings(prefix: string = "recordings/"): Promise<Recording[]> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        const contents = response.Contents || [];

        const recordings = await Promise.all(
            contents
                .filter((item) => item.Size && item.Size > 0)
                .map(async (item) => {
                    const command = new GetObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: item.Key,
                    });

                    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

                    return {
                        key: item.Key!,
                        url,
                        lastModified: item.LastModified,
                        size: item.Size,
                        filename: item.Key!.split("/").pop() || item.Key!,
                    };
                })
        );

        return recordings.sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
    } catch (error) {
        console.error("Error listing recordings:", error);
        return [];
    }
}
