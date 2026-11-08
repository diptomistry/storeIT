import { S3Client } from "@aws-sdk/client-s3";

import { getServerEnv } from "@/lib/env";

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const env = getServerEnv();

  cachedClient = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return getServerEnv().R2_BUCKET_NAME;
}
