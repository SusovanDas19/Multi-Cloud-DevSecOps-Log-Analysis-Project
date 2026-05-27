import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "";

export async function getAgentDownloadUrl(): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET env var is not set");
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: "agent/LogMonitoringAgent.zip",
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function getGalleryUrls(): Promise<string[]> {
  if (!BUCKET_NAME) return [];

  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: "arch_gallery/",
  });

  const response = await s3Client.send(listCommand);
  const urls: string[] = [];

  if (response.Contents) {
    for (const item of response.Contents) {
      if (
        item.Key &&
        item.Key !== "arch_gallery/" &&
        item.Key.length > "arch_gallery/".length
      ) {
        const getCmd = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        });
        const url = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
        urls.push(url);
      }
    }
  }

  return urls;
}