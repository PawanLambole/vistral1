import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProcessingPipelineProps {
  videoId: number;
  onProcessingComplete: () => void;
}

type ProcessingStep = {
  id: number;
  name: string;
  status: "pending" | "processing" | "completed";
};

export default function ProcessingPipeline({ videoId, onProcessingComplete }: ProcessingPipelineProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 1, name: "Transcribing", status: "processing" },
    { id: 2, name: "Summarizing Text", status: "pending" },
    { id: 3, name: "Extracting Highlights", status: "pending" },
    { id: 4, name: "Finalizing", status: "pending" }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Transcribing video content...");
  const [progressWidth, setProgressWidth] = useState("25%");
  const { toast } = useToast();

  // Poll for video status
  useEffect(() => {
    if (!videoId) return;

    const messages = [
      "Transcribing video content...",
      "Analyzing content and generating text summary...",
      "Identifying key moments and creating highlight clips...",
      "Finalizing your summary video..."
    ];

    const pollStatus = async () => {
      try {
        const response = await apiRequest("GET", `/api/videos/${videoId}/status`);
        const data = await response.json();
        
        if (data.status === "failed") {
          toast({
            title: "Processing failed",
            description: "There was an error processing your video. Please try uploading again.",
            variant: "destructive"
          });
          return;
        }

        if (data.status === "completed") {
          // All steps completed
          const updatedSteps = steps.map(step => ({ ...step, status: "completed" }));
          setSteps(updatedSteps);
          setCurrentStepIndex(3);
          setProgressWidth("100%");
          setProcessingMessage("Processing complete!");
          
          // Wait a moment before showing results
          setTimeout(() => {
            onProcessingComplete();
          }, 1000);
          return;
        }

        // Simulate step progress for better user experience
        // In a real implementation, the backend would provide more detailed status updates
        const simulateStepProgress = () => {
          // Update current step based on elapsed time
          let newStepIndex = currentStepIndex;
          if (currentStepIndex < 3) {
            newStepIndex = currentStepIndex + 1;
          }
          
          // Update steps
          const updatedSteps = [...steps];
          
          if (newStepIndex > 0) {
            // Mark previous steps as completed
            for (let i = 0; i < newStepIndex; i++) {
              updatedSteps[i].status = "completed";
            }
          }
          
          // Mark current step as processing
          if (newStepIndex < 3) {
            updatedSteps[newStepIndex].status = "processing";
          }
          
          setSteps(updatedSteps);
          setCurrentStepIndex(newStepIndex);
          setProcessingMessage(messages[newStepIndex]);
          setProgressWidth(`${(newStepIndex + 1) * 25}%`);
        };

        // Simulate step progress for better UX
        // In a real app, we would get detailed step information from the API
        setTimeout(simulateStepProgress, 5000);
      } catch (error) {
        console.error("Error checking video status:", error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollStatus, 5000);
    
    // Initial poll
    pollStatus();

    return () => clearInterval(interval);
  }, [videoId, currentStepIndex, steps, toast, onProcessingComplete]);

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">Processing Your Video</h2>
        
        <div className="relative">
          {/* Pipeline Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 flex items-center justify-center rounded-full 
                    ${step.status === "completed" ? "bg-primary text-white" : 
                      step.status === "processing" ? "bg-primary text-white" : 
                      "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}`}
                >
                  {step.status === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : step.status === "processing" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 
                  ${step.status !== "pending" ? 
                    "text-gray-600 dark:text-gray-300" : 
                    "text-gray-400 dark:text-gray-500"}`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-500" style={{ width: progressWidth }}></div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {processingMessage}
          </p>
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This may take a few minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
