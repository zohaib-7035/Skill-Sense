import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface TextInputProps {
  onTextSubmit: (text: string, source: string) => void;
  onTextChanged?: (text: string) => void;
}

export function TextInput({ onTextSubmit, onTextChanged }: TextInputProps) {
  const [text, setText] = useState('');

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
          onChange={(e) => {
            setText(e.target.value);
            onTextChanged?.(e.target.value);
          }}
          rows={8}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
}
