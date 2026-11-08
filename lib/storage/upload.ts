import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { PRESIGN_UPLOAD_EXPIRES_SECONDS } from "@/lib/constants";
import { AppError } from "@/lib/auth/errors";
import { getR2BucketName, getR2Client } from "@/lib/storage/r2-client";

export async function createPresignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresIn = PRESIGN_UPLOAD_EXPIRES_SECONDS
) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: storageKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return { uploadUrl, expiresIn };
}

export async function headObject(storageKey: string) {
  const client = getR2Client();
  try {
    const result = await client.send(
      new HeadObjectCommand({
        Bucket: getR2BucketName(),
        Key: storageKey,
      })
    );
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType ?? null,
      etag: result.ETag ?? null,
    };
  } catch {
    throw new AppError("Uploaded object was not found in storage", 400, "OBJECT_MISSING");
  }
}

export async function verifyUploadedObject(storageKey: string, expectedSize: number) {
  const object = await headObject(storageKey);

  if (object.contentLength !== expectedSize) {
    throw new AppError(
      "Uploaded object size does not match the declared size",
      400,
      "SIZE_MISMATCH"
    );
  }

  return object;
}
