
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Sparkles, Image } from 'lucide-react';

interface ImageUploaderProps {
  images: File[];
  previewUrls: string[];
  isAnalyzing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeImage: () => void;
  onRemoveImage: (index: number) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  previewUrls,
  isAnalyzing,
  onFileChange,
  onAnalyzeImage,
  onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  return (
    <div className="grid gap-2 mb-6">
      <div className="flex items-center">
        <Image className="h-4 w-4 mr-2 text-muted-foreground" />
        <Label>Bilder hinzufügen</Label>
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="rounded-lg flex gap-2"
          onClick={handleFileUpload}
        >
          <Upload size={16} />
          <span>Bilder auswählen</span>
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          className="rounded-lg flex gap-2"
          onClick={handleCameraCapture}
        >
          <Camera size={16} />
          <span>Kamera</span>
        </Button>
        
        {images.length > 0 && (
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-lg flex gap-2"
            onClick={onAnalyzeImage}
            disabled={isAnalyzing}
          >
            <Sparkles size={16} />
            <span>{isAnalyzing ? "Analysiere..." : "Daten erkennen"}</span>
          </Button>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        <input
          type="file"
          ref={cameraInputRef}
          onChange={onFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
      </div>
      
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img 
                src={url} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-24 object-cover rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => onRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
