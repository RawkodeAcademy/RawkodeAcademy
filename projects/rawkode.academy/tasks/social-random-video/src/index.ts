import { Ai } from "@cloudflare/ai";
import {
  WorkflowEntrypoint,
  type WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";

export interface Env {
  AI: Ai;
  SOCIAL_VIDEO_WORKFLOW: Workflow;
}

interface Technology {
  name: string;
}

interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
  slug: string;
  publishedAt: string;
  duration: number;
  technologies: Technology[];
}

interface SocialPosts {
  bluesky: string;
  x: string;
  linkedin: string;
}

interface WorkflowOutput {
  video: {
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    publishedAt: string;
    duration: number;
    technologies: Technology[];
  };
  posts: SocialPosts;
}

const GRAPHQL_ENDPOINT = "https://api.rawkode.academy/graphql";

async function fetchRandomVideo(): Promise<Video> {
  const query = `
    query {
      getRandomVideos(limit: 1) {
        title
        description
        thumbnailUrl
        slug
        publishedAt
        duration
        technologies {
          name
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.getRandomVideos[0];
}

async function generateSocialPosts(video: Video, ai: Ai): Promise<SocialPosts> {
  const technologies = video.technologies.map((t) => t.name).join(", ");
  const videoUrl = `https://rawkode.academy/videos/${video.slug}`;

  const prompt = `
    Based on this video information, create engaging social media posts for different platforms:

    Title: ${video.title}
    Description: ${video.description}
    Technologies: ${technologies}
    URL: ${videoUrl}

		Guidelines:
		- Always present as if Rawkode is posting
		- Always be authentic and credible, as a software engineer
;		- Always be polite and professional, but remember sarcasm is fucking great.

    Please create:
    1. A BlueSky post (max 300 characters, engaging and conversational)
    2. An X (Twitter) post (max 280 characters, use relevant hashtags)
    3. A LinkedIn post (professional tone, can be longer, max 600 characters)

    Format the response as JSON with keys: bluesky, x, linkedin
  `;

  const response = await ai.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      {
        role: "system",
        content:
          "You are a social media expert who creates engaging posts for tech content. Always respond with valid JSON only, no additional text.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    // Extract JSON from the response
    const responseText = response.response;

		console.log("AI Response:", responseText);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    // Fallback to simple posts if AI fails
    const techHashtags = video.technologies
      .map((t) => `#${t.name.replace(/\s+/g, "")}`)
      .join(" ");
    return {
      bluesky: `Check out this video: "${video.title}" ${videoUrl}`,
      x: `🎥 ${video.title} ${videoUrl} ${techHashtags} #tech #coding`,
      linkedin: `I'd like to share this interesting video: "${video.title}"\n\n${video.description}\n\nTechnologies covered: ${technologies}\n\nWatch here: ${videoUrl}`,
    };
  }
}

type WorkflowParams = Record<string, never>;

export class SocialVideoWorkflow extends WorkflowEntrypoint<
  Env,
  WorkflowParams,
  WorkflowOutput
> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		console.log("Starting Social Video Workflow...");

    // Step 1: Fetch a random video from the GraphQL API
    const video = await step.do("fetch-video", async () => {
      return await fetchRandomVideo();
    });

    // Step 2: Generate social posts using AI
    const socialPosts = await step.do("generate-posts", async () => {
      const ai = new Ai(this.env.AI);
      return await generateSocialPosts(video, ai);
    });

    // Step 3: Prepare the final output
    const output = await step.do("prepare-output", async () => {
      const videoUrl = `https://rawkode.academy/videos/${video.slug}`;
      return {
        video: {
          title: video.title,
          description: video.description,
          url: videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          publishedAt: video.publishedAt,
          duration: video.duration,
          technologies: video.technologies,
        },
        posts: socialPosts,
      };
    });

    return output;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Create a workflow instance with a unique ID
      const workflowId = crypto.randomUUID();

      // Run the workflow
      const instance = await env.SOCIAL_VIDEO_WORKFLOW.create({
        id: workflowId,
        params: {},
      });

      // Wait for the workflow to complete
      const result = await instance.status();

      if (result.status === "complete" && result.output) {
        // Return the results
        return new Response(JSON.stringify(result.output, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      if (result.status === "errored") {
        throw new Error(result.error?.message || "Workflow failed");
      }
      // This shouldn't happen as we're waiting for completion
      throw new Error(`Unexpected workflow status: ${result.status}`);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  },
};
