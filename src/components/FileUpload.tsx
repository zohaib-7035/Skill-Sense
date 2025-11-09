import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onFileSelected?: (file: File | null) => void;
}

export function FileUpload({ onTextExtracted, onFileSelected }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // Just select the file, don't process immediately
    // Processing will happen via aggregate button
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelected?.(file);
    await processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['pdf', 'docx', 'txt'].includes(extension || '')) {
      toast.error('Please upload PDF, DOCX, or TXT files only');
      return;
    }

    onFileSelected?.(file);
    await processFile(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload your CV/Resume (PDF, DOCX, or TXT)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging 
              ? 'border-primary bg-primary/10 scale-105' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm text-muted-foreground mb-4">
            {isDragging ? 'Drop your file here' : 'Click to select or drag and drop'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
          >
            Choose File
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
