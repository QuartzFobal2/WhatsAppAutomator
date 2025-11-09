import { useState, useCallback, useRef } from "react";
import { Upload, X, FileIcon, Image, Video, Music, File as FileIconLucide } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FileType = "image" | "video" | "audio" | "file";

interface FileUploadProps {
  type: FileType;
  onFileSelect: (file: File, base64: string) => void;
  onFileRemove?: () => void;
  currentFile?: { fileName: string; base64Data?: string };
  maxSizeMB?: number;
}

const FILE_TYPE_CONFIG = {
  image: {
    accept: "image/*",
    icon: Image,
    label: "Imagem",
    maxSize: 16, // MB
    validTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  video: {
    accept: "video/*",
    icon: Video,
    label: "Vídeo",
    maxSize: 64, // MB
    validTypes: ["video/mp4", "video/webm", "video/ogg"],
  },
  audio: {
    accept: "audio/*",
    icon: Music,
    label: "Áudio",
    maxSize: 16, // MB
    validTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
  },
  file: {
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.txt",
    icon: FileIconLucide,
    label: "Arquivo",
    maxSize: 16, // MB
    validTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"],
  },
};

export function FileUpload({
  type,
  onFileSelect,
  onFileRemove,
  currentFile,
  maxSizeMB,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIG[type];
  const maxSize = (maxSizeMB || config.maxSize) * 1024 * 1024; // Convert to bytes
  const Icon = config.icon;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB || config.maxSize}MB`;
    }

    // Check file type
    const isValidType = config.validTypes.some((validType) => {
      if (validType.includes('*')) {
        const category = validType.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === validType;
    });

    if (!isValidType) {
      return `Tipo de arquivo inválido. Tipos aceitos: ${config.validTypes.join(', ')}`;
    }

    return null;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Create preview for images
      if (type === 'image') {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
      }

      // Call callback with file and base64
      onFileSelect(file, base64);
    } catch (err) {
      setError('Erro ao processar arquivo');
      console.error('File processing error:', err);
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove?.();
  }, [preview, onFileRemove]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-2">
      {!currentFile && !preview ? (
        <Card
          className={cn(
            "border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragging && "border-primary bg-primary/5",
            error && "border-destructive"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-full bg-muted p-3">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Arraste um {config.label.toLowerCase()} ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo {maxSizeMB || config.maxSize}MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            {preview && type === 'image' ? (
              <img
                src={preview}
                alt="Preview"
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentFile?.fileName || 'Arquivo selecionado'}
              </p>
              <Badge variant="secondary" className="mt-1">
                {config.label}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
