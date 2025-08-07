import { type User, type InsertUser, type Article, type InsertArticle, type Reel, type InsertReel, type ScriptGenerationRequest, type InsertScriptRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  
  getReels(): Promise<Reel[]>;
  getReel(id: string): Promise<Reel | undefined>;
  createReel(reel: InsertReel): Promise<Reel>;
  
  createScriptRequest(request: InsertScriptRequest): Promise<ScriptGenerationRequest>;
  getScriptRequest(id: string): Promise<ScriptGenerationRequest | undefined>;
  updateScriptRequest(id: string, script: string): Promise<ScriptGenerationRequest>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private articles: Map<string, Article>;
  private reels: Map<string, Reel>;
  private scriptRequests: Map<string, ScriptGenerationRequest>;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.reels = new Map();
    this.scriptRequests = new Map();
    
    // Seed with sample articles for demo
    this.seedArticles();
  }

  private seedArticles() {
    const sampleArticles: Article[] = [
      {
        id: "article-1",
        title: "Top Fashion Trends Taking Over 2024",
        content: "From sustainable fashion to Y2K comebacks, the fashion world is experiencing a revolution. Sustainable fashion has become more than just a trend—it's a movement. Brands are focusing on eco-friendly materials, ethical production, and circular fashion models. Meanwhile, Y2K fashion is making a massive comeback with low-rise jeans, metallic fabrics, and futuristic accessories dominating runways and street style.",
        author: "Fashion Expert",
        genre: "Fashion",
        hashtags: ["#FashionTrends", "#SustainableFashion", "#Y2K"],
        createdAt: new Date()
      },
      {
        id: "article-2", 
        title: "The Future of AI in Content Creation",
        content: "Artificial Intelligence is revolutionizing how we create, edit, and distribute content. From AI-powered video editing tools to automated script generation, creators now have access to sophisticated tools that were once reserved for large studios. This democratization of technology is enabling independent creators to produce professional-quality content at scale.",
        author: "Tech Journalist",
        genre: "Technology",
        hashtags: ["#AI", "#ContentCreation", "#Technology"],
        createdAt: new Date()
      }
    ];

    sampleArticles.forEach(article => {
      this.articles.set(article.id, article);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = { 
      ...insertArticle, 
      id,
      genre: insertArticle.genre || null,
      hashtags: insertArticle.hashtags || null,
      createdAt: new Date()
    };
    this.articles.set(id, article);
    return article;
  }

  async getReels(): Promise<Reel[]> {
    return Array.from(this.reels.values());
  }

  async getReel(id: string): Promise<Reel | undefined> {
    return this.reels.get(id);
  }

  async createReel(insertReel: InsertReel): Promise<Reel> {
    const id = randomUUID();
    const reel: Reel = {
      ...insertReel,
      id,
      description: insertReel.description || null,
      thumbnailUrl: insertReel.thumbnailUrl || null,
      authorId: insertReel.authorId || null,
      sourceArticleId: insertReel.sourceArticleId || null,
      script: insertReel.script || null,
      metadata: insertReel.metadata || null,
      createdAt: new Date()
    };
    this.reels.set(id, reel);
    return reel;
  }

  async createScriptRequest(insertRequest: InsertScriptRequest): Promise<ScriptGenerationRequest> {
    const id = randomUUID();
    const request: ScriptGenerationRequest = {
      ...insertRequest,
      id,
      articleId: insertRequest.articleId || null,
      generatedScript: null,
      createdAt: new Date()
    };
    this.scriptRequests.set(id, request);
    return request;
  }

  async getScriptRequest(id: string): Promise<ScriptGenerationRequest | undefined> {
    return this.scriptRequests.get(id);
  }

  async updateScriptRequest(id: string, script: string): Promise<ScriptGenerationRequest> {
    const request = this.scriptRequests.get(id);
    if (!request) {
      throw new Error("Script request not found");
    }
    
    const updatedRequest: ScriptGenerationRequest = {
      ...request,
      generatedScript: script
    };
    this.scriptRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
