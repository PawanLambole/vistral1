import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Video model
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  originalPath: text("original_path").notNull(),
  originalDuration: integer("original_duration"),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Video summary model
export const videoSummaries = pgTable("video_summaries", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  textSummary: text("text_summary"),
  transcription: text("transcription"),
  summaryVideoPath: text("summary_video_path"),
  summaryDuration: integer("summary_duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserting a new video
export const insertVideoSchema = createInsertSchema(videos).pick({
  originalName: true,
  originalPath: true,
  fileSize: true,
  mimeType: true,
});

// Schema for inserting a video summary
export const insertVideoSummarySchema = createInsertSchema(videoSummaries).pick({
  videoId: true,
  textSummary: true,
  transcription: true,
  summaryVideoPath: true,
  summaryDuration: true,
});

// Schema for updating video status
export const updateVideoStatusSchema = z.object({
  status: z.enum(["uploaded", "processing", "completed", "failed"]),
});

// Schema for updating video duration
export const updateVideoDurationSchema = z.object({
  originalDuration: z.number(),
});

// Types
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type VideoSummary = typeof videoSummaries.$inferSelect;
export type InsertVideoSummary = z.infer<typeof insertVideoSummarySchema>;
