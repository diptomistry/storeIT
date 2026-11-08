import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { getR2BucketName, getR2Client } from "@/lib/storage/r2-client";

export async function deleteObject(storageKey: string) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: storageKey,
    })
  );
}

export async function deleteObjects(storageKeys: string[]) {
  if (storageKeys.length === 0) return;

  const client = getR2Client();
  const bucket = getR2BucketName();

  // R2/S3 delete batch limit is 1000
  for (let i = 0; i < storageKeys.length; i += 1000) {
    const chunk = storageKeys.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}
