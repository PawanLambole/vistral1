import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { updateVideoDurationSchema, insertVideoSummarySchema } from "@shared/schema";

// Utility function to run python script
const runPythonScript = (scriptPath: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [scriptPath, ...args]);
    
    let stdoutData = "";
    let stderrData = "";
    
    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });
    
    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });
    
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
      } else {
        resolve(stdoutData.trim());
      }
    });
  });
};

export async function processVideo(videoId: number): Promise<void> {
  try {
    // Update video status to processing
    await storage.updateVideoStatus(videoId, { status: "processing" });
    
    // Get video details
    const video = await storage.getVideo(videoId);
    
    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }
    
    const inputVideoPath = video.originalPath;
    // Define base storage path based on environment
    const BASE_STORAGE_PATH = process.env.NODE_ENV === "production"
      ? "/data" // Fly.io volume mount point
      : process.cwd();
    
    const processorDir = path.join(process.cwd(), "processor"); // Scripts are still in the app directory
    const summariesDir = path.join(BASE_STORAGE_PATH, "summaries");
    
    // Create summaries directory if it doesn't exist
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }
    
    // Extract filename without extension and sanitize it for file system
    const sanitizeFileName = (name: string): string => {
      // Limit length and remove problematic characters
      const sanitized = name
        .replace(/[^\w\s.-]/g, '_') // Replace non-alphanumeric chars except for some safe ones
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .slice(0, 50);              // Limit length to 50 chars
      return sanitized;
    };
    
    const fileNameWithoutExt = sanitizeFileName(
      path.basename(video.originalName, path.extname(video.originalName))
    );
    const outputSummaryPath = path.join(summariesDir, `${fileNameWithoutExt}_summary.mp4`);
    
    // Step 1: Transcribe the video (for video selection purposes only)
    console.log(`Transcribing video: ${videoId}`);
    const transcribeScript = path.join(processorDir, "transcribe.py");
    const transcription = await runPythonScript(transcribeScript, [inputVideoPath]);
    
    // Step 2: Create highlight video (skip text summary generation)
    console.log(`Creating highlight video: ${videoId}`);
    const videoTrimScript = path.join(processorDir, "video_trim.py");
    const videoTrimResult = await runPythonScript(videoTrimScript, [inputVideoPath, transcription, outputSummaryPath]);
    
    // Parse the result to get durations
    const durations = JSON.parse(videoTrimResult);
    
    // Update video with original duration
    await storage.updateVideoDuration(videoId, { originalDuration: durations.originalDuration });
    
    // Create video summary entry
    const summaryData = insertVideoSummarySchema.parse({
      videoId,
      transcription,
      summaryVideoPath: outputSummaryPath,
      summaryDuration: durations.summaryDuration,
      textSummary: null // Not generating text summaries as per requirement
    });
    
    await storage.createVideoSummary(summaryData);
    
    // Update video status to completed
    await storage.updateVideoStatus(videoId, { status: "completed" });
    
    console.log(`Video processing completed: ${videoId}`);
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    // Update video status to failed
    await storage.updateVideoStatus(videoId, { status: "failed" });
    throw error;
  }
}
