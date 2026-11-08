import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  PRESIGN_DOWNLOAD_EXPIRES_SECONDS,
  PRESIGN_PREVIEW_EXPIRES_SECONDS,
} from "@/lib/constants";
import { getR2BucketName, getR2Client } from "@/lib/storage/r2-client";

function encodeContentDispositionFilename(filename: string) {
  const escaped = filename.replace(/"/g, "");
  return `filename="${escaped}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function createPresignedDownloadUrl(
  storageKey: string,
  filename: string,
  expiresIn = PRESIGN_DOWNLOAD_EXPIRES_SECONDS
) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: storageKey,
    ResponseContentDisposition: `attachment; ${encodeContentDispositionFilename(filename)}`,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return { url, expiresIn };
}

export async function createPresignedPreviewUrl(
  storageKey: string,
  mimeType: string,
  expiresIn = PRESIGN_PREVIEW_EXPIRES_SECONDS
) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: storageKey,
    ResponseContentType: mimeType,
    ResponseContentDisposition: "inline",
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return { url, expiresIn };
}
