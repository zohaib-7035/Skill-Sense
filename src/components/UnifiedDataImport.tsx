import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Github, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseDocument } from '@/lib/documentParser';

interface UnifiedDataImportProps {
  profileId: string;
  onDataExtracted: (text: string, source: string) => void;
  onSkillsExtracted: () => void;
}

export const UnifiedDataImport = ({ profileId, onDataExtracted, onSkillsExtracted }: UnifiedDataImportProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  
  // GitHub state
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubMetadata, setGithubMetadata] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await parseDocument(file);
      if (text) {
        await onDataExtracted(text, file.name);
        toast.success(`File "${file.name}" processed successfully`);
        setOpen(false);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      await onDataExtracted(textInput, 'manual text input');
      setTextInput('');
      setOpen(false);
    } catch (error) {
      console.error('Error processing text:', error);
      toast.error('Failed to process text');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubExtract = async () => {
    if (!githubUsername.trim()) {
      toast.error('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-skill-extract', {
        body: { 
          username: githubUsername,
          token: githubToken || undefined
        }
      });

      if (error) throw error;

      const extractedSkills = data.skills || [];
      setGithubMetadata(data.metadata);

      if (extractedSkills.length > 0) {
        const skillsToInsert = extractedSkills.map((skill: any) => ({
          profile_id: profileId,
          skill_name: skill.skill_name,
          skill_type: skill.skill_type,
          confidence_score: skill.confidence_score,
          evidence: skill.evidence || [],
          cluster: skill.cluster || 'Technical',
          microstory: skill.microstory || '',
          state: skill.state || 'unlocked',
        }));

        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);

        if (insertError) throw insertError;

        onSkillsExtracted();
        toast.success(`Extracted ${extractedSkills.length} skills from GitHub`);
        setOpen(false);
        setGithubUsername('');
        setGithubToken('');
        setGithubMetadata(null);
      } else {
        toast.info('No skills extracted from GitHub repositories');
      }
    } catch (error: any) {
      console.error('GitHub extraction error:', error);
      toast.error(error.message || 'Failed to extract skills from GitHub');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-24 text-lg">
          <Upload className="mr-2 h-6 w-6" />
          Import Your Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Your Professional Data</DialogTitle>
          <DialogDescription>
            Upload documents, paste text, or connect your GitHub to extract skills
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="github">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium">Click to upload</span>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF, DOCX, TXT, or other document formats
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Paste your content</Label>
              <Textarea
                id="text-input"
                placeholder="Paste your resume, job description, project details, or any professional content..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px]"
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleTextSubmit} 
              disabled={loading || !textInput.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Extract Skills from Text'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="github" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-username">GitHub Username *</Label>
                <Input
                  id="github-username"
                  placeholder="octocat"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github-token">
                  Personal Access Token (Optional)
                </Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended for private repos and higher rate limits
                </p>
              </div>

              <Button 
                onClick={handleGitHubExtract} 
                disabled={loading || !githubUsername.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Repositories...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Extract Skills from GitHub
                  </>
                )}
              </Button>

              {githubMetadata && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{githubMetadata.repositoriesAnalyzed}</div>
                    <div className="text-xs text-muted-foreground">Repositories</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{githubMetadata.languagesFound}</div>
                    <div className="text-xs text-muted-foreground">Languages</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{githubMetadata.topicsFound}</div>
                    <div className="text-xs text-muted-foreground">Topics</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <p className="text-sm">Processing your data...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
