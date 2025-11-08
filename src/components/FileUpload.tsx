import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { parseDocument } from '@/lib/documentParser';
import { toast } from 'sonner';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await parseDocument(file);
      onTextExtracted(text, file.name);
      toast.success('Document parsed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse document');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Click to upload or drag and drop
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Choose File'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
