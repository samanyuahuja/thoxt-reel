import OpenAI from "openai";
import { Article } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ScriptGenerationOptions {
  tone: 'engaging' | 'formal' | 'funny' | 'educational';
  duration: 15 | 30 | 60; // seconds
  targetAudience?: string;
}

export interface GeneratedScript {
  script: string;
  keyPoints: string[];
  suggestedVisuals: string[];
  estimatedDuration: number;
}

export async function generateScriptFromArticle(
  article: Article,
  options: ScriptGenerationOptions
): Promise<GeneratedScript> {
  const durationInstructions = {
    15: "Keep it under 40 words for a 15-second video",
    30: "Keep it under 80 words for a 30-second video", 
    60: "Keep it under 160 words for a 60-second video"
  };

  const toneInstructions = {
    engaging: "Use an enthusiastic, conversational tone that hooks viewers immediately",
    formal: "Use a professional, authoritative tone suitable for news or educational content",
    funny: "Use humor, wit, and engaging personality to entertain viewers",
    educational: "Use a clear, instructional tone that teaches viewers something valuable"
  };

  const prompt = `
    Convert the following article into a ${options.tone} video script for a ${options.duration}-second Instagram Reels/TikTok style video.

    Article Title: ${article.title}
    Article Content: ${article.content}
    Genre: ${article.genre}

    Guidelines:
    - ${toneInstructions[options.tone]}
    - ${durationInstructions[options.duration]}
    - Start with a hook that grabs attention in the first 3 seconds
    - Include the main message or takeaway
    - End with a call-to-action or thought-provoking statement
    - Use simple, conversational language
    - Make it suitable for vertical video format

    Respond in JSON format with:
    {
      "script": "The complete script text",
      "keyPoints": ["array", "of", "key", "points"],
      "suggestedVisuals": ["array", "of", "visual", "suggestions"],
      "estimatedDuration": estimated_seconds_as_number
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media content creator specializing in creating engaging short-form video scripts for platforms like TikTok and Instagram Reels."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      script: result.script || "",
      keyPoints: result.keyPoints || [],
      suggestedVisuals: result.suggestedVisuals || [],
      estimatedDuration: result.estimatedDuration || options.duration
    };
  } catch (error) {
    console.error("Script generation failed:", error);
    throw new Error("Failed to generate script from article");
  }
}

export async function generateScriptFromTopic(
  topic: string,
  options: ScriptGenerationOptions
): Promise<GeneratedScript> {
  const prompt = `
    Create a ${options.tone} video script about "${topic}" for a ${options.duration}-second Instagram Reels/TikTok style video.

    Guidelines:
    - ${options.tone === 'engaging' ? 'Use an enthusiastic, conversational tone' : `Use a ${options.tone} tone`}
    - Keep it under ${options.duration === 15 ? '40' : options.duration === 30 ? '80' : '160'} words
    - Start with a hook that grabs attention
    - Include valuable information or entertainment
    - End with engagement (question, call-to-action, etc.)
    - Make it suitable for vertical video format

    Respond in JSON format with:
    {
      "script": "The complete script text",
      "keyPoints": ["array", "of", "key", "points"],
      "suggestedVisuals": ["array", "of", "visual", "suggestions"],
      "estimatedDuration": estimated_seconds_as_number
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are an expert social media content creator specializing in creating engaging short-form video scripts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      script: result.script || "",
      keyPoints: result.keyPoints || [],
      suggestedVisuals: result.suggestedVisuals || [],
      estimatedDuration: result.estimatedDuration || options.duration
    };
  } catch (error) {
    console.error("Script generation failed:", error);
    throw new Error("Failed to generate script from topic");
  }
}
