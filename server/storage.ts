import { 
  users, type User, type InsertUser,
  videos, type Video, type InsertVideo,
  videoSummaries, type VideoSummary, type InsertVideoSummary,
  updateVideoStatusSchema, updateVideoDurationSchema
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Video methods
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  listVideos(): Promise<Video[]>;
  updateVideoStatus(id: number, status: { status: string }): Promise<void>;
  updateVideoDuration(id: number, duration: { originalDuration: number }): Promise<void>;
  
  // Video summary methods
  getVideoSummary(id: number): Promise<VideoSummary | undefined>;
  getVideoSummaryByVideoId(videoId: number): Promise<VideoSummary | undefined>;
  createVideoSummary(summary: InsertVideoSummary): Promise<VideoSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private videoSummaries: Map<number, VideoSummary>;
  userId: number;
  videoId: number;
  videoSummaryId: number;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.videoSummaries = new Map();
    this.userId = 1;
    this.videoId = 1;
    this.videoSummaryId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Video methods
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoId++;
    const now = new Date();
    const video: Video = { 
      ...insertVideo, 
      id, 
      originalDuration: null, 
      status: "uploaded", 
      createdAt: now,
      updatedAt: now
    };
    this.videos.set(id, video);
    return video;
  }
  
  async listVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }
  
  async updateVideoStatus(id: number, statusUpdate: { status: string }): Promise<void> {
    const video = this.videos.get(id);
    if (!video) {
      throw new Error(`Video not found: ${id}`);
    }
    
    const updatedVideo = { 
      ...video, 
      status: statusUpdate.status,
      updatedAt: new Date()
    };
    this.videos.set(id, updatedVideo);
  }
  
  async updateVideoDuration(id: number, durationUpdate: { originalDuration: number }): Promise<void> {
    const video = this.videos.get(id);
    if (!video) {
      throw new Error(`Video not found: ${id}`);
    }
    
    const updatedVideo = { 
      ...video, 
      originalDuration: durationUpdate.originalDuration,
      updatedAt: new Date()
    };
    this.videos.set(id, updatedVideo);
  }
  
  // Video summary methods
  async getVideoSummary(id: number): Promise<VideoSummary | undefined> {
    return this.videoSummaries.get(id);
  }
  
  async getVideoSummaryByVideoId(videoId: number): Promise<VideoSummary | undefined> {
    return Array.from(this.videoSummaries.values()).find(
      (summary) => summary.videoId === videoId
    );
  }
  
  async createVideoSummary(insertSummary: InsertVideoSummary): Promise<VideoSummary> {
    const id = this.videoSummaryId++;
    const now = new Date();
    const summary: VideoSummary = { 
      ...insertSummary, 
      id, 
      createdAt: now,
      updatedAt: now,
      textSummary: insertSummary.textSummary || null,
      transcription: insertSummary.transcription || null,
      summaryVideoPath: insertSummary.summaryVideoPath || null,
      summaryDuration: insertSummary.summaryDuration || null
    };
    this.videoSummaries.set(id, summary);
    return summary;
  }
}

export const storage = new MemStorage();
