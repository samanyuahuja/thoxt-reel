import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateScriptFromArticle, generateScriptFromTopic } from "./services/scriptGenerator";
import { insertScriptRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all articles for script generation
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Get specific article
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Generate script from article
  app.post("/api/generate-script", async (req, res) => {
    try {
      const { articleId, tone, duration, customTopic } = req.body;

      if (!tone || !duration) {
        return res.status(400).json({ error: "Tone and duration are required" });
      }

      let generatedScript;

      if (customTopic) {
        // Generate from custom topic
        generatedScript = await generateScriptFromTopic(customTopic, { tone, duration });
      } else if (articleId) {
        // Generate from existing article
        const article = await storage.getArticle(articleId);
        if (!article) {
          return res.status(404).json({ error: "Article not found" });
        }
        generatedScript = await generateScriptFromArticle(article, { tone, duration });
      } else {
        return res.status(400).json({ error: "Either articleId or customTopic is required" });
      }

      // Store the script generation request
      const scriptRequest = await storage.createScriptRequest({
        articleId: articleId || null,
        tone,
        duration
      });

      // Update with generated script
      const updatedRequest = await storage.updateScriptRequest(
        scriptRequest.id, 
        generatedScript.script
      );

      res.json({
        id: updatedRequest.id,
        ...generatedScript
      });

    } catch (error) {
      console.error("Error generating script:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  // Get all reels
  app.get("/api/reels", async (req, res) => {
    try {
      const reels = await storage.getReels();
      res.json(reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
      res.status(500).json({ error: "Failed to fetch reels" });
    }
  });

  // Create new reel
  app.post("/api/reels", async (req, res) => {
    try {
      const reelData = req.body;
      
      if (!reelData.title || !reelData.videoUrl || !reelData.duration) {
        return res.status(400).json({ error: "Title, videoUrl, and duration are required" });
      }

      const reel = await storage.createReel(reelData);
      res.status(201).json(reel);
    } catch (error) {
      console.error("Error creating reel:", error);
      res.status(500).json({ error: "Failed to create reel" });
    }
  });

  // Get script request
  app.get("/api/script-requests/:id", async (req, res) => {
    try {
      const scriptRequest = await storage.getScriptRequest(req.params.id);
      if (!scriptRequest) {
        return res.status(404).json({ error: "Script request not found" });
      }
      res.json(scriptRequest);
    } catch (error) {
      console.error("Error fetching script request:", error);
      res.status(500).json({ error: "Failed to fetch script request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
