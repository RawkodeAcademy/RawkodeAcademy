#!/usr/bin/env bun

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, exists } from "node:fs/promises";
import { join } from "node:path";

const REVISED_DIR = join(import.meta.dir, "transcripts-revised");

interface UploadConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getConfig(): UploadConfig {
  const endpoint = process.env.CONTENT_ENDPOINT;
  const accessKeyId = process.env.CONTENT_ACCESS_KEY;
  const secretAccessKey = process.env.CONTENT_SECRET_KEY;
  const bucket = process.env.CONTENT_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Missing required environment variables: CONTENT_ENDPOINT, CONTENT_ACCESS_KEY, CONTENT_SECRET_KEY, CONTENT_BUCKET"
    );
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

async function uploadTranscript(
  s3Client: S3Client,
  bucket: string,
  videoId: string,
  transcriptPath: string
): Promise<void> {
  const file = Bun.file(transcriptPath);
  const content = await file.arrayBuffer();
  
  const key = `videos/${videoId}/captions/en.vtt`;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: new Uint8Array(content),
    ContentType: "text/vtt",
    ACL: "public-read",
  });

  await s3Client.send(command);
  console.log(`✓ Uploaded: ${key}`);
}

async function main() {
  try {
    const config = getConfig();
    
    const s3Client = new S3Client({
      endpoint: config.endpoint,
      region: "auto",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    if (!(await exists(REVISED_DIR))) {
      console.error(`Revised transcripts directory not found: ${REVISED_DIR}`);
      console.error("Please run revise-transcripts.ts first");
      process.exit(1);
    }

    const files = await readdir(REVISED_DIR);
    const revisedFiles = files.filter(f => f.endsWith("_revised.vtt"));
    
    if (revisedFiles.length === 0) {
      console.log("No revised transcript files found to upload");
      return;
    }

    console.log(`Found ${revisedFiles.length} revised transcripts to upload`);
    console.log(`Target bucket: ${config.bucket}`);
    console.log("");

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < revisedFiles.length; i++) {
      const filename = revisedFiles[i];
      const videoId = filename.replace("_revised.vtt", "");
      
      console.log(`Uploading ${i + 1}/${revisedFiles.length}: ${videoId}`);
      
      try {
        const transcriptPath = join(REVISED_DIR, filename);
        await uploadTranscript(s3Client, config.bucket, videoId, transcriptPath);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to upload ${videoId}:`, (error as Error).message);
        errorCount++;
      }
    }

    console.log("\n=== Upload Summary ===");
    console.log(`Total files: ${revisedFiles.length}`);
    console.log(`Successfully uploaded: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main();