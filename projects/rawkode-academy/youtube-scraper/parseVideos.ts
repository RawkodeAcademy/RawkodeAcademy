import { readdirSync, readFileSync, writeFileSync } from "fs";
import OpenAI from 'openai';
import * as fastq from "fastq";
import { queueAsPromised } from "fastq";

const CONCURRENCY = 10;

type Task = {
  filename: string;
  yaml: string;
}

export interface Video {
  title: string;
  youtubeId: string;
  slug: string;
  description: string;
  duration: string;
  visibility: string;
  publishedAt: string;
  thumbnailUrl: string;
  scheduledStartTime: string;
  live: boolean;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  commentCount: number;
  chapters: {
    title: string;
    start: string;
  }[];
  guests: {
    name: string;
    biography: string;
    github: string;
    website: string;
    twitter: string;
  }[];
  technologies: {
    name: string;
    website: string;
    repository: string;
    documentation: string;
  }[];
  links: {
    name: string;
    url: string;
  }[];
}

const parseVideo = async (task: Task): Promise<void> => {
  console.log(`Parsing ${task.filename}`);

  let result;

  try {
    result = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{
        role: "system",
        content: `
You MUST ONLY EVER respond with RAW and VALID JSON.

You will be given a YAML document that describes a pre-recorded video or live stream.

Your job is to extract whatever you can from it and provide a JSON response for the following TypeScript type:

interface Video {
  title: string;
  youtubeId: string;
  slug: string;
  description: string;
  duration: string;
  visibility: string;
  publishedAt: string;
  scheduledStartTime: string;
  isLive: boolean;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  commentCount: number;
  chapters: {
    title: string;
    start: string;
  }[];
  guests: {
    name: string;
    biography: string;
    github: string;
    website: string;
    twitter: string;
  }[];
  technologies: {
    name: string;
    website: string;
    repository: string;
    documentation: string;
  }[];
  links: {
    name: string;
    url: string;
  }[];
}

Rules:

- If there's no slug, please create one.
- The chapters property should be an array of objects with title and start properties, you'll find them in the description in the format: "00:00 - Something or 00:00 Something".
- Extract ALL chapters.
- Remove from the title "| Show Name" where it exists and add it to the properties.
- Ensure that any links used for guest or technology properties are removed from link property.
- Condense the description to remove the metadata capture in other properties of the type
`,
      },
        {
          role: "user",
          content: task.yaml,
        }
      ],
    });
  } catch (error) {
    console.log(`Error with ${task.filename}`);
    console.error(error);
    return;
  }

  console.log(`NO ERROR ${task.filename}`);

  const cleanResponse = result.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "");

  const payload = JSON.parse(cleanResponse);
  writeFileSync(`ai/${payload.youtubeId}.json`, cleanResponse);
  console.log(`Done with ${payload.youtubeId}`);
}

// Main
const openai = new OpenAI({});
const q: queueAsPromised<Task> = fastq.promise(parseVideo, CONCURRENCY);

const videoFiles = readdirSync("./videos");

for (const filename of videoFiles) {
  // Check if filename exists in ai folder
  if (readdirSync("./ai").includes(`${filename.replace('yaml', 'json')}`)) {
    console.log(`Skipping ${filename}`);
    continue;
  }

  q.push({
    filename,
    yaml: readFileSync(`./videos/${filename}`, "utf8"),
  });
}

await q.drained();

console.log("All done, yo");
