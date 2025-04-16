import { useState } from "react";
import UploadArea from "@/components/UploadArea";
import ProcessingPipeline from "@/components/ProcessingPipeline";
import ResultsSection from "@/components/ResultsSection";

export default function Home() {
  // Application state
  const [currentView, setCurrentView] = useState<"upload" | "processing" | "results">("upload");
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);

  // Handlers
  const handleUploadComplete = (videoId: number) => {
    setCurrentVideoId(videoId);
    setCurrentView("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentView("results");
  };

  const handleNewVideo = () => {
    setCurrentVideoId(null);
    setCurrentView("upload");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {currentView === "upload" && (
        <UploadArea onUploadComplete={handleUploadComplete} />
      )}
      
      {currentView === "processing" && currentVideoId && (
        <ProcessingPipeline 
          videoId={currentVideoId} 
          onProcessingComplete={handleProcessingComplete} 
        />
      )}
      
      {currentView === "results" && currentVideoId && (
        <ResultsSection 
          videoId={currentVideoId} 
          onNewVideo={handleNewVideo} 
        />
      )}
    </main>
  );
}
