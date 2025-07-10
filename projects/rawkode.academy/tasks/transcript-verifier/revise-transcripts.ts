#!/usr/bin/env bun

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readdir, exists } from "node:fs/promises";
import { join } from "node:path";

const GRAPHQL_ENDPOINT = "https://api.rawkode.academy/graphql";
const TRANSCRIPTS_DIR = join(import.meta.dir, "transcripts");
const REVISED_DIR = join(import.meta.dir, "transcripts-revised");

interface Technology {
  name: string;
  terms: Array<{ term: string }>;
}

interface Video {
  id: string;
  title: string;
  description: string;
  technologies: Technology[];
}

interface GraphQLResponse {
  data?: {
    getAllVideos: Video[];
  };
  errors?: Array<{ message: string }>;
}

async function fetchVideoMetadata(): Promise<Map<string, Video>> {
  const query = `
    query {
      getAllVideos {
        id
        title
        description
        technologies {
          name
          terms {
            term
          }
        }
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

    const videoMap = new Map<string, Video>();
    for (const video of data.data.getAllVideos) {
      videoMap.set(video.id, video);
    }
    
    return videoMap;
  } catch (error) {
    console.error("Failed to fetch video metadata:", error);
    throw error;
  }
}

function buildContextPrompt(video: Video): string {
  const technologies = video.technologies
    .map(tech => {
      const terms = tech.terms.map(t => t.term).join(", ");
      return `${tech.name}: ${terms}`;
    })
    .join("\n");

  return `
You are a transcript editor for technical video content. Your task is to correct and improve the accuracy of auto-generated VTT (WebVTT) captions.

Video Context:
Title: ${video.title}
Description: ${video.description}

Technologies and Terms Referenced:
${technologies}

Instructions:
1. Fix any transcription errors, especially for technical terms, acronyms, and proper nouns
2. Ensure technical terms match the context provided above
3. Maintain the original VTT format with exact timing
4. Fix grammar and punctuation while preserving the speaker's natural speech patterns
5. Keep the same timing marks - only modify the text content
6. Pay special attention to technology names and technical terminology

Please return ONLY the corrected VTT content, maintaining the exact same format.
`;
}

async function reviseTranscript(
  videoId: string,
  transcript: string,
  video: Video,
  genAI: GoogleGenerativeAI
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = buildContextPrompt(video);
  const fullPrompt = `${prompt}\n\nOriginal VTT Transcript:\n${transcript}`;
  
  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Failed to revise transcript for video ${videoId}:`, error);
    throw error;
  }
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Error: GOOGLE_API_KEY environment variable is not set");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    if (!(await exists(TRANSCRIPTS_DIR))) {
      console.error(`Transcripts directory not found: ${TRANSCRIPTS_DIR}`);
      console.error("Please run download-transcripts.ts first");
      process.exit(1);
    }

    if (!(await exists(REVISED_DIR))) {
      await Bun.write(REVISED_DIR + "/.gitkeep", "");
      console.log(`Created revised transcripts directory: ${REVISED_DIR}`);
    }

    console.log("Fetching video metadata from GraphQL API...");
    const videoMetadata = await fetchVideoMetadata();
    console.log(`Loaded metadata for ${videoMetadata.size} videos`);

    const transcriptFiles = await readdir(TRANSCRIPTS_DIR);
    const vttFiles = transcriptFiles.filter(f => f.endsWith(".vtt"));
    console.log(`Found ${vttFiles.length} transcript files to process`);

    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < vttFiles.length; i++) {
      const filename = vttFiles[i];
      const videoId = filename.replace(".vtt", "");
      
      console.log(`\nProcessing ${i + 1}/${vttFiles.length}: ${videoId}`);
      
      const video = videoMetadata.get(videoId);
      if (!video) {
        console.warn(`No metadata found for video ${videoId}, skipping...`);
        errorCount++;
        continue;
      }

      try {
        const transcriptPath = join(TRANSCRIPTS_DIR, filename);
        const transcript = await Bun.file(transcriptPath).text();
        
        console.log(`Sending to Gemini for revision...`);
        const revised = await reviseTranscript(videoId, transcript, video, genAI);
        
        const outputPath = join(REVISED_DIR, `${videoId}_revised.vtt`);
        await Bun.write(outputPath, revised);
        
        console.log(`✓ Saved revised transcript: ${outputPath}`);
        processedCount++;
        
        // Rate limiting to avoid API quota issues
        await Bun.sleep(1000);
      } catch (error) {
        console.error(`✗ Failed to process ${videoId}:`, (error as Error).message);
        errorCount++;
      }
    }

    console.log("\n=== Processing Summary ===");
    console.log(`Total transcripts: ${vttFiles.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Revised transcripts saved to: ${REVISED_DIR}`);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main();