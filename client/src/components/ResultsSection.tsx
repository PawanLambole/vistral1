import { useState, useEffect, useRef } from "react";
import { Download, Share, Play, Plus } from "lucide-react";
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

  return (
    <div>
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Summary Results</h2>
          
          <div className="w-full mx-auto max-w-3xl">
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
                  <span className="text-gray-700 dark:text-gray-300">Highlight Duration: </span>
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
                    download={`highlights_${summaryData.originalName}`}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Highlights
                  </a>
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    toast({
                      title: "Share link copied",
                      description: "Link to this video has been copied to clipboard",
                    });
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
