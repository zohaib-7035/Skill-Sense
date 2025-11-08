import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface TextInputProps {
  onTextSubmit: (text: string, source: string) => void;
}

export function TextInput({ onTextSubmit }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text, 'Manual Input');
      setText('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Paste Text
        </CardTitle>
        <CardDescription>
          Paste content from LinkedIn, GitHub, blogs, or anywhere else
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your professional experience, project descriptions, or any relevant content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="resize-none"
        />
        <Button onClick={handleSubmit} disabled={!text.trim()} className="w-full">
          Analyze Text
        </Button>
      </CardContent>
    </Card>
  );
}
