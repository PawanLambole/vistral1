import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface UploadAreaProps {
  onUploadComplete: (videoId: number) => void;
}

export default function UploadArea({ onUploadComplete }: UploadAreaProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Ready to upload");
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    
    // Validate file type
    const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
    if (!allowedMimeTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a supported video format (MP4, MOV, or AVI)",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 500MB",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setProgress(0);
      setUploadStatus("Uploading...");
      
      const formData = new FormData();
      formData.append("video", file);
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<{ id: number }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progressPercent = Math.round((event.loaded * 100) / event.total);
            setProgress(progressPercent);
            
            if (progressPercent < 90) {
              setUploadStatus("Uploading...");
            } else {
              setUploadStatus("Processing...");
            }
          }
        });
        
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || "Upload failed"));
            } catch (e) {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });
        
        xhr.addEventListener("error", () => {
          reject(new Error("Network error occurred during upload"));
        });
        
        xhr.addEventListener("abort", () => {
          reject(new Error("Upload aborted"));
        });
        
        xhr.open("POST", "/api/videos/upload");
        xhr.send(formData);
      });
      
      const response = await uploadPromise;
      
      // Upload completed successfully
      setProgress(100);
      setUploadStatus("Upload complete");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      
      // Trigger onUploadComplete callback with video ID
      onUploadComplete(response.id);
      
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded and is now processing.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const cancelUpload = () => {
    setFile(null);
    setIsUploading(false);
    setProgress(0);
    setUploadStatus("Upload canceled");
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Your Video</h2>
        
        {!isUploading && !file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-gray-300 hover:border-primary hover:bg-primary/5"
            }`}
          >
            <div className="max-w-md mx-auto">
              <CloudUpload className="h-14 w-14 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                Drag and drop your video here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Or click to browse files
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Supports MP4, MOV, AVI (max 500MB)
              </p>
              
              <input {...getInputProps()} />
              
              <Button>
                Browse Files
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {file && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</span>
              </div>
            )}
            
            <Progress value={progress} className="h-2.5 mb-2" />
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{uploadStatus}</span>
              <span>{progress}%</span>
            </div>
            
            <div className="mt-4 flex gap-2">
              {!isUploading && file ? (
                <>
                  <Button onClick={handleUpload}>Upload Video</Button>
                  <Button variant="outline" onClick={cancelUpload}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" onClick={cancelUpload}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Upload
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
