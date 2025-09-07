import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, Image, FileImage, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdvertisementUploaderProps {
  onUploadSuccess: (filePath: string, fileType: "image" | "gif") => void;
  buttonClassName?: string;
  currentFile?: string | null;
}

/**
 * A specialized file upload component for advertisement images and GIFs.
 * Supports both static images and animated GIFs with appropriate validation.
 */
export function AdvertisementUploader({
  onUploadSuccess,
  buttonClassName,
  currentFile,
}: AdvertisementUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const resetModal = () => {
    setSelectedFile(null);
    setFileName("");
    setDescription("");
    setUploadProgress(0);
    setUploadComplete(false);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      // Upload file directly to server
      const uploadResponse = await fetch("/api/admin/advertisements/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload response error:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText
        });
        throw new Error(`Upload failed with status: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();
      console.log("Upload result:", result);
      
      if (!result.success || !result.filePath) {
        throw new Error("Upload failed - invalid response from server");
      }

      setUploadProgress(100);
      setUploadComplete(true);
      
      setTimeout(() => {
        onUploadSuccess(result.filePath, result.fileType);
        setShowModal(false);
        resetModal();
        toast({
          title: "Upload successful",
          description: "Advertisement file has been uploaded successfully",
        });
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      
      let errorMessage = "Failed to upload file. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Network error") || error.message.includes("Failed to fetch")) {
          errorMessage = "Network error: Please check your connection and try again. The file upload service may be temporarily unavailable.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Upload service configuration issue. Please contact support.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadComplete(false);
    }
  };

  const getFileTypeDisplay = () => {
    if (currentFile) {
      return currentFile.includes('.gif') ? 'GIF' : 'Image';
    }
    return null;
  };

  const getFileIcon = () => {
    if (selectedFile?.type.includes("gif")) {
      return <FileImage className="h-8 w-8 text-purple-500" />;
    }
    return <Image className="h-8 w-8 text-blue-500" />;
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-upload-advertisement"
      >
        <div className="flex items-center gap-2">
          {isUploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>{currentFile ? 'Change' : 'Upload'} File</span>
            </>
          )}
        </div>
      </Button>

      {currentFile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getFileTypeDisplay() === 'GIF' ? (
            <FileImage className="h-4 w-4" />
          ) : (
            <Image className="h-4 w-4" />
          )}
          <span>Current: {getFileTypeDisplay()} file uploaded</span>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Advertisement File
            </DialogTitle>
            <DialogDescription>
              Upload an image or GIF for your advertisement. Maximum file size: 5MB
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragOver 
                  ? "border-coral-400 bg-coral-50 dark:bg-coral-900/20" 
                  : "border-gray-300 dark:border-gray-600 hover:border-coral-300 dark:hover:border-coral-700"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    {getFileIcon()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                    </p>
                  </div>
                  {uploadComplete && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Upload Complete!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Drop your file here
                    </p>
                    <p className="text-gray-500">
                      or{" "}
                      <label className="text-coral-600 hover:text-coral-700 cursor-pointer font-medium">
                        browse files
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                      </label>
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, GIF, WebP up to 5MB • Recommended: 300x250 or 300x600px
                  </p>
                </div>
              )}
            </div>

            {/* File Details Form */}
            {selectedFile && !uploadComplete && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the advertisement..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetModal();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            <div className="flex items-center gap-2">
              {selectedFile && !uploadComplete && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove File
                </Button>
              )}
              
              {selectedFile && !uploadComplete && (
                <Button
                  onClick={uploadFile}
                  disabled={isUploading || !selectedFile}
                  className="bg-coral-600 hover:bg-coral-700"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}