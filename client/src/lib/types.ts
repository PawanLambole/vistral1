export interface VideoSummaryResult {
  id: number;
  originalName: string;
  originalDuration?: number;
  summaryDuration?: number;
  textSummary?: string;
  transcription?: string;
  summaryVideoPath?: string;
  status: "uploaded" | "processing" | "completed" | "failed";
}

export interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
}
