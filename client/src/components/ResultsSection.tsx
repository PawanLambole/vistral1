import { useState, useEffect, useRef } from "react";
import { Copy, Download, Share, ChevronsDown, ChevronsUp, Play, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactPlayer from "react-player";
import { formatDuration } from "@/lib/utils";
import { VideoSummaryResult } from "@/lib/types";

interface ResultsSectionProps {
  videoId: number;
  onNewVideo: () => void;
}

export default function ResultsSection({ videoId, onNewVideo }: ResultsSectionProps) {
  const [summaryData, setSummaryData] = useState<VideoSummaryResult | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { toast } = useToast();
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/summary`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch summary data");
        }
        
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error("Error fetching summary:", error);
        toast({
          title: "Error",
          description: "Failed to load video summary data",
          variant: "destructive"
        });
      }
    };
    
    if (videoId) {
      fetchSummary();
    }
  }, [videoId, toast]);

  const handlePlayVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setIsVideoPlaying(true);
    }
  };

  const toggleTranscript = () => {
    setIsTranscriptOpen(!isTranscriptOpen);
  };

  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Text summary copied to clipboard successfully",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  // Parse transcript entries from the transcription text
  const parseTranscriptEntries = (transcription: string) => {
    // This is a simplistic parser - in a real application, 
    // the transcription would likely have a more structured format
    return transcription.split('\n\n').map((block, index) => {
      const lines = block.split('\n');
      const timestamp = lines[0].match(/(\d+:\d+)/)?.[0] || `00:${index}0`;
      const speaker = "Speaker 1";
      const text = lines.slice(1).join(' ') || lines[0];
      
      return { timestamp, speaker, text };
    });
  };

  // Format percentage reduction
  const calculateReduction = (original?: number, summary?: number) => {
    if (!original || !summary || original === 0) return "0%";
    const reduction = ((original - summary) / original) * 100;
    return `${Math.round(reduction)}%`;
  };

  if (!summaryData) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Loading Results...</h2>
        </CardContent>
      </Card>
    );
  }

  const transcriptEntries = summaryData.transcription 
    ? parseTranscriptEntries(summaryData.transcription)
    : [];

  return (
    <div>
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Summary Results</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Summary */}
            <div>
              <h3 className="text-lg font-medium mb-3">Video Highlights</h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video mb-2 relative">
                {/* Video Player */}
                <ReactPlayer
                  ref={playerRef}
                  url={`/api/videos/${videoId}/summary/stream`}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={isVideoPlaying}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                  config={{
                    file: {
                      attributes: {
                        controlsList: "nodownload" // Disable browser download button
                      }
                    }
                  }}
                />
                
                {/* Custom Play Button (Overlay) */}
                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                    onClick={handlePlayVideo}
                  >
                    <div className="w-16 h-16 bg-primary bg-opacity-90 rounded-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Duration: </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatDuration(summaryData.summaryDuration || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Original: </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatDuration(summaryData.originalDuration || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Reduction: </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {calculateReduction(summaryData.originalDuration, summaryData.summaryDuration)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  asChild
                >
                  <a 
                    href={`/api/videos/${videoId}/summary/download`} 
                    download={`summary_${summaryData.originalName}`}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download MP4
                  </a>
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    toast({
                      title: "Share link copied",
                      description: "Link to this summary has been copied to clipboard",
                    });
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Text Summary */}
            <div>
              <h3 className="text-lg font-medium mb-3">Text Summary</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3 text-gray-800 dark:text-gray-200">
                {summaryData.textSummary?.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={index < summaryData.textSummary!.split('\n\n').length - 1 ? "mb-3" : ""}>
                    {paragraph}
                  </p>
                )) || "No text summary available."}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  onClick={() => summaryData.textSummary && copyTextToClipboard(summaryData.textSummary)}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copy Text
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  asChild
                >
                  <a href={`/api/videos/${videoId}/summary/text/download`} download={`summary_${summaryData.originalName}.txt`}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download TXT
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transcript Timeline (Expandable) */}
      {summaryData.transcription && (
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div 
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
            onClick={toggleTranscript}
          >
            <h3 className="text-lg font-medium">Complete Transcript & Timeline</h3>
            {isTranscriptOpen ? 
              <ChevronsUp className="text-gray-400 dark:text-gray-500" /> : 
              <ChevronsDown className="text-gray-400 dark:text-gray-500" />
            }
          </div>
          
          {isTranscriptOpen && (
            <CardContent className="p-6">
              <div className="flex flex-col mb-3">
                {transcriptEntries.map((entry, index) => (
                  <div key={index} className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                        {entry.timestamp}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{entry.speaker}</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200">{entry.text}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  asChild
                >
                  <a href={`/api/videos/${videoId}/transcript/download`} download={`transcript_${summaryData.originalName}.txt`}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Full Transcript
                  </a>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      
      {/* Additional Actions */}
      <div className="flex justify-between items-center mb-8">
        <Button onClick={onNewVideo}>
          <Plus className="h-4 w-4 mr-2" />
          Summarize New Video
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline">
            Settings
          </Button>
          <Button variant="outline">
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}
