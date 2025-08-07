import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  genre: text("genre"),
  hashtags: text("hashtags").array(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const reels = pgTable("reels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull(), // in seconds
  authorId: varchar("author_id").references(() => users.id),
  sourceArticleId: varchar("source_article_id").references(() => articles.id),
  script: text("script"),
  metadata: json("metadata"), // filters, effects, etc.
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const scriptGenerationRequests = pgTable("script_generation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id),
  tone: text("tone").notNull(),
  duration: integer("duration").notNull(),
  generatedScript: text("generated_script"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertReelSchema = createInsertSchema(reels).omit({
  id: true,
  createdAt: true,
});

export const insertScriptRequestSchema = createInsertSchema(scriptGenerationRequests).omit({
  id: true,
  createdAt: true,
  generatedScript: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertReel = z.infer<typeof insertReelSchema>;
export type Reel = typeof reels.$inferSelect;
export type InsertScriptRequest = z.infer<typeof insertScriptRequestSchema>;
export type ScriptGenerationRequest = typeof scriptGenerationRequests.$inferSelect;
