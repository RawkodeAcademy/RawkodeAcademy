#!/usr/bin/env bun

import { mkdir, exists } from "node:fs/promises";
import { join } from "node:path";

const GRAPHQL_ENDPOINT = "https://api.rawkode.academy/graphql";
const TRANSCRIPT_BASE_URL = "https://content.rawkode.academy/videos";
const OUTPUT_DIR = join(import.meta.dir, "transcripts");

interface Video {
  id: string;
}

interface GraphQLResponse {
  data?: {
    getAllVideos: Video[];
  };
  errors?: Array<{ message: string }>;
}

async function fetchVideoIds(): Promise<string[]> {
  const query = `
    query {
      getAllVideos {
        id
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const data: GraphQLResponse = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data) {
      throw new Error("No data returned from GraphQL query");
    }

    return data.data.getAllVideos.map(video => video.id);
  } catch (error) {
    console.error("Failed to fetch video IDs:", error);
    throw error;
  }
}

async function downloadTranscript(videoId: string): Promise<boolean> {
  const url = `${TRANSCRIPT_BASE_URL}/${videoId}/captions/en.vtt`;
  const outputPath = join(OUTPUT_DIR, `${videoId}.vtt`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Transcript not found for video ${videoId}`);
        return false;
      }
      throw new Error(`Failed to download transcript: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    await Bun.write(outputPath, content);
    console.log(`Downloaded transcript for video ${videoId}`);
    return true;
  } catch (error) {
    console.error(`Failed to download transcript for video ${videoId}:`, (error as Error).message);
    return false;
  }
}

async function main() {
  try {
    if (!(await exists(OUTPUT_DIR))) {
      await mkdir(OUTPUT_DIR, { recursive: true });
      console.log(`Created output directory: ${OUTPUT_DIR}`);
    }

    console.log("Fetching video IDs from GraphQL API...");
    const videoIds = await fetchVideoIds();
    console.log(`Found ${videoIds.length} videos`);

    let successCount = 0;
    let failureCount = 0;

    console.log("\nDownloading transcripts...");
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      console.log(`Progress: ${i + 1}/${videoIds.length}`);
      
      const success = await downloadTranscript(videoId);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      await Bun.sleep(100);
    }

    console.log("\n=== Download Summary ===");
    console.log(`Total videos: ${videoIds.length}`);
    console.log(`Successfully downloaded: ${successCount}`);
    console.log(`Failed/Not found: ${failureCount}`);
    console.log(`Transcripts saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main();