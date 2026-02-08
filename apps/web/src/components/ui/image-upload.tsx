import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (url: string) => void;
  className?: string;
}

export default function ImageUpload({
  currentImage,
  onImageSelect,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    currentImage || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast("File size must be less than 5MB");
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to server
      const response = await api.post<{ url: string }>(
        "/api/files/upload",
        formData
      );

      const imageUrl = response.url;
      onImageSelect(imageUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast("Image upload failed. Please try again.");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
      // Clean up preview URL if it's a local object URL
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onImageSelect("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {imagePreview ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Replace Image
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full h-32 flex-col space-y-2"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <div className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Upload Image"}
            </div>
            <div className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 5MB
            </div>
          </div>
        </Button>
      )}
    </div>
  );
}
