import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { upload } from "./multerConfig";
import { 
  insertVideoSchema, 
  updateVideoStatusSchema, 
  updateVideoDurationSchema,
  insertVideoSummarySchema
} from "@shared/schema";
import { processVideo } from "./processVideo";

// Create directories if they don't exist
const uploadsDir = path.join(process.cwd(), "uploads");
const summariesDir = path.join(process.cwd(), "summaries");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(summariesDir)) {
  fs.mkdirSync(summariesDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints for video processing
  
  // Upload video endpoint
  app.post("/api/videos/upload", upload.single("video"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const { originalname, mimetype, path: filePath, size } = req.file;
      
      // Validate file type
      const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
      if (!allowedMimeTypes.includes(mimetype)) {
        // Delete the file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "Invalid file type. Only MP4, MOV, and AVI are supported." });
      }
      
      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (size > maxSize) {
        // Delete the file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "File size exceeds the 500MB limit." });
      }

      // Insert video metadata into storage
      const videoData = insertVideoSchema.parse({
        originalName: originalname,
        originalPath: filePath,
        fileSize: size,
        mimeType: mimetype
      });

      const video = await storage.createVideo(videoData);
      
      // Start processing the video asynchronously
      processVideo(video.id).catch(error => {
        console.error("Error processing video:", error);
        // Update video status to failed
        storage.updateVideoStatus(video.id, { status: "failed" });
      });

      res.status(201).json({ 
        id: video.id, 
        originalName: video.originalName,
        fileSize: video.fileSize,
        status: video.status 
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Get video status endpoint
  app.get("/api/videos/:id/status", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json({ id: video.id, status: video.status });
    } catch (error) {
      console.error("Error getting video status:", error);
      res.status(500).json({ message: "Failed to get video status" });
    }
  });

  // Update video status endpoint (internal use)
  app.patch("/api/videos/:id/status", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const { status } = updateVideoStatusSchema.parse(req.body);
      
      await storage.updateVideoStatus(videoId, { status });
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json({ id: video.id, status: video.status });
    } catch (error) {
      console.error("Error updating video status:", error);
      res.status(500).json({ message: "Failed to update video status" });
    }
  });

  // Get video summary endpoint
  app.get("/api/videos/:id/summary", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const summary = await storage.getVideoSummaryByVideoId(videoId);
      
      if (!summary) {
        return res.status(404).json({ message: "Video summary not found" });
      }
      
      res.json({
        id: video.id,
        originalName: video.originalName,
        originalDuration: video.originalDuration,
        summaryDuration: summary.summaryDuration,
        textSummary: summary.textSummary,
        transcription: summary.transcription,
        summaryVideoPath: summary.summaryVideoPath,
        status: video.status
      });
    } catch (error) {
      console.error("Error getting video summary:", error);
      res.status(500).json({ message: "Failed to get video summary" });
    }
  });

  // Stream video endpoint
  app.get("/api/videos/:id/stream", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const videoPath = video.originalPath;
      
      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: "Video file not found" });
      }

      // Stream the video
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': video.mimeType,
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType,
        };
        
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error) {
      console.error("Error streaming video:", error);
      res.status(500).json({ message: "Failed to stream video" });
    }
  });

  // Stream summary video endpoint
  app.get("/api/videos/:id/summary/stream", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const summary = await storage.getVideoSummaryByVideoId(videoId);
      
      if (!summary || !summary.summaryVideoPath) {
        return res.status(404).json({ message: "Summary video not found" });
      }
      
      const videoPath = summary.summaryVideoPath;
      
      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: "Summary video file not found" });
      }

      // Stream the video
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': video.mimeType,
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType,
        };
        
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error) {
      console.error("Error streaming summary video:", error);
      res.status(500).json({ message: "Failed to stream summary video" });
    }
  });

  // Download summary video endpoint
  app.get("/api/videos/:id/summary/download", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const summary = await storage.getVideoSummaryByVideoId(videoId);
      
      if (!summary || !summary.summaryVideoPath) {
        return res.status(404).json({ message: "Summary video not found" });
      }
      
      const videoPath = summary.summaryVideoPath;
      
      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: "Summary video file not found" });
      }

      // Set content disposition for download
      res.setHeader('Content-Disposition', `attachment; filename="summary_${video.originalName}"`);
      res.setHeader('Content-Type', video.mimeType);
      
      // Stream the file for download
      fs.createReadStream(videoPath).pipe(res);
    } catch (error) {
      console.error("Error downloading summary video:", error);
      res.status(500).json({ message: "Failed to download summary video" });
    }
  });

  // Download summary text endpoint
  app.get("/api/videos/:id/summary/text/download", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const summary = await storage.getVideoSummaryByVideoId(videoId);
      
      if (!summary || !summary.textSummary) {
        return res.status(404).json({ message: "Text summary not found" });
      }
      
      // Set content disposition for download
      res.setHeader('Content-Disposition', `attachment; filename="summary_${video.originalName.replace(/\.[^/.]+$/, "")}.txt"`);
      res.setHeader('Content-Type', 'text/plain');
      
      // Send the text summary
      res.send(summary.textSummary);
    } catch (error) {
      console.error("Error downloading text summary:", error);
      res.status(500).json({ message: "Failed to download text summary" });
    }
  });

  // Download transcript endpoint
  app.get("/api/videos/:id/transcript/download", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const summary = await storage.getVideoSummaryByVideoId(videoId);
      
      if (!summary || !summary.transcription) {
        return res.status(404).json({ message: "Transcription not found" });
      }
      
      // Set content disposition for download
      res.setHeader('Content-Disposition', `attachment; filename="transcript_${video.originalName.replace(/\.[^/.]+$/, "")}.txt"`);
      res.setHeader('Content-Type', 'text/plain');
      
      // Send the transcription
      res.send(summary.transcription);
    } catch (error) {
      console.error("Error downloading transcription:", error);
      res.status(500).json({ message: "Failed to download transcription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
