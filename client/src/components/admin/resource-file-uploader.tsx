import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X, CheckCircle } from "lucide-react";

interface ResourceFileUploaderProps {
  onUploadSuccess: (filePath: string, fileName: string, fileSize: number, type: 'image' | 'file') => void;
  currentFile?: string;
  uploadType: 'image' | 'file'; // 'image' for featured images, 'file' for downloads
  accept?: string;
  maxSize?: number; // in MB
}

export function ResourceFileUploader({ 
  onUploadSuccess, 
  currentFile, 
  uploadType,
  accept = uploadType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.zip,.xls,.xlsx',
  maxSize = uploadType === 'image' ? 5 : 50 // 5MB for images, 50MB for files
}: ResourceFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentFile || null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const response = await fetch('/api/admin/resources/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadedFile(result.filePath);
      onUploadSuccess(result.filePath, file.name, file.size, uploadType);
      
      toast({
        title: "File uploaded successfully!",
        description: `${file.name} has been uploaded`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onUploadSuccess('', '', 0, uploadType);
  };

  return (
    <div className="space-y-3">
      <Label>
        {uploadType === 'image' ? 'Featured Image' : 'Download File'}
        {uploadType === 'file' && ' *'}
      </Label>
      
      {uploadedFile ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
          <div className="flex items-center gap-2 flex-1">
            {uploadType === 'image' ? (
              <img
                src={uploadedFile}
                alt="Uploaded file"
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <File className="h-8 w-8 text-blue-600" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {uploadType === 'image' ? 'Image uploaded' : 'File uploaded'}
              </p>
              <p className="text-xs text-green-600">{uploadedFile}</p>
            </div>
          </div>
          <CheckCircle className="h-5 w-5 text-green-600" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {uploadType === 'image' 
              ? 'Upload an image for this resource'
              : 'Upload a file for download'
            }
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id={`file-upload-${uploadType}`}
          />
          <Label htmlFor={`file-upload-${uploadType}`} className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="mt-2"
              asChild
            >
              <span>
                {isUploading ? 'Uploading...' : `Choose ${uploadType === 'image' ? 'Image' : 'File'}`}
              </span>
            </Button>
          </Label>
          <p className="text-xs text-gray-500 mt-2">
            {uploadType === 'image' 
              ? `Max size: ${maxSize}MB. Formats: JPG, PNG, GIF, WebP`
              : `Max size: ${maxSize}MB. Formats: PDF, DOC, DOCX, TXT, ZIP, XLS, XLSX`
            }
          </p>
        </div>
      )}
    </div>
  );
}