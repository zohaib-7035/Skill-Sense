import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseDocument } from '@/lib/documentParser';

interface SmartAggregateExtractProps {
  profileId: string;
  onComplete: () => void;
}

interface ExtractionSource {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  skillsCount: number;
  error?: string;
}

interface ExtractedSkill {
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  cluster?: string;
  microstory?: string;
  state?: string;
  source: string;
}

export const SmartAggregateExtract = ({ profileId, onComplete }: SmartAggregateExtractProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [autoMerge, setAutoMerge] = useState(true);
  const [progress, setProgress] = useState(0);
  const [sources, setSources] = useState<ExtractionSource[]>([]);

  // Input states
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');

  const updateSourceStatus = (
    sourceName: string,
    status: ExtractionSource['status'],
    skillsCount = 0,
    error?: string
  ) => {
    setSources(prev =>
      prev.map(s =>
        s.name === sourceName
          ? { ...s, status, skillsCount, error }
          : s
      )
    );
  };

  const mergeSkills = (skillsArray: ExtractedSkill[][]): ExtractedSkill[] => {
    const skillMap = new Map<string, ExtractedSkill>();

    skillsArray.flat().forEach(skill => {
      const key = skill.skill_name.toLowerCase().trim();
      
      if (skillMap.has(key)) {
        const existing = skillMap.get(key)!;
        // Average confidence scores
        const avgConfidence = (existing.confidence_score + skill.confidence_score) / 2;
        // Combine evidence from all sources
        const combinedEvidence = [...new Set([...existing.evidence, ...skill.evidence])];
        // Track sources
        const sources = existing.source.includes(skill.source) 
          ? existing.source 
          : `${existing.source}, ${skill.source}`;
        
        skillMap.set(key, {
          ...existing,
          confidence_score: avgConfidence,
          evidence: combinedEvidence,
          source: sources,
        });
      } else {
        skillMap.set(key, skill);
      }
    });

    return Array.from(skillMap.values());
  };

  const extractFromDocument = async (): Promise<ExtractedSkill[]> => {
    if (!file) return [];
    
    updateSourceStatus('Document', 'processing');
    try {
      const text = await parseDocument(file);
      if (!text) throw new Error('Failed to parse document');

      const { data, error } = await supabase.functions.invoke('extract-skills', {
        body: { text },
      });

      if (error) throw error;

      const skills = (data.skills || []).map((s: any) => ({
        ...s,
        source: 'Document',
        evidence: s.evidence || [],
        cluster: s.cluster || 'Other',
        microstory: s.microstory || '',
        state: s.state || 'unlocked',
      }));

      updateSourceStatus('Document', 'completed', skills.length);
      return skills;
    } catch (error: any) {
      updateSourceStatus('Document', 'error', 0, error.message);
      return [];
    }
  };

  const extractFromGitHub = async (): Promise<ExtractedSkill[]> => {
    if (!githubUsername.trim()) return [];
    
    updateSourceStatus('GitHub', 'processing');
    try {
      const { data, error } = await supabase.functions.invoke('github-skill-extract', {
        body: { 
          username: githubUsername,
          token: githubToken || undefined
        }
      });

      if (error) throw error;

      const skills = (data.skills || []).map((s: any) => ({
        ...s,
        source: 'GitHub',
        evidence: s.evidence || [],
        cluster: s.cluster || 'Technical',
        microstory: s.microstory || '',
        state: s.state || 'unlocked',
      }));

      updateSourceStatus('GitHub', 'completed', skills.length);
      return skills;
    } catch (error: any) {
      updateSourceStatus('GitHub', 'error', 0, error.message);
      return [];
    }
  };

  const extractFromText = async (): Promise<ExtractedSkill[]> => {
    if (!textInput.trim()) return [];
    
    updateSourceStatus('Text', 'processing');
    try {
      const { data, error } = await supabase.functions.invoke('extract-skills', {
        body: { text: textInput },
      });

      if (error) throw error;

      const skills = (data.skills || []).map((s: any) => ({
        ...s,
        source: 'Text Input',
        evidence: s.evidence || [],
        cluster: s.cluster || 'Other',
        microstory: s.microstory || '',
        state: s.state || 'unlocked',
      }));

      updateSourceStatus('Text', 'completed', skills.length);
      return skills;
    } catch (error: any) {
      updateSourceStatus('Text', 'error', 0, error.message);
      return [];
    }
  };

  const handleAggregateExtract = async () => {
    // Check which sources are available
    const availableSources: ExtractionSource[] = [];
    if (file) availableSources.push({ name: 'Document', status: 'pending', skillsCount: 0 });
    if (githubUsername.trim()) availableSources.push({ name: 'GitHub', status: 'pending', skillsCount: 0 });
    if (textInput.trim()) availableSources.push({ name: 'Text', status: 'pending', skillsCount: 0 });

    if (availableSources.length === 0) {
      toast.error('Please provide at least one data source (Document, GitHub, or Text)');
      return;
    }

    setIsExtracting(true);
    setSources(availableSources);
    setProgress(0);

    try {
      // Run all extractions concurrently
      const extractionPromises: Promise<ExtractedSkill[]>[] = [];
      
      if (file) extractionPromises.push(extractFromDocument());
      if (githubUsername.trim()) extractionPromises.push(extractFromGitHub());
      if (textInput.trim()) extractionPromises.push(extractFromText());

      const results = await Promise.all(extractionPromises);
      setProgress(50);

      // Merge results
      const mergedSkills = autoMerge ? mergeSkills(results) : results.flat();
      setProgress(75);

      // Save to database
      if (mergedSkills.length > 0) {
        const skillsToInsert = mergedSkills.map(skill => ({
          profile_id: profileId,
          skill_name: skill.skill_name,
          skill_type: skill.skill_type,
          confidence_score: skill.confidence_score,
          evidence: skill.evidence,
          cluster: skill.cluster || 'Other',
          microstory: skill.microstory || '',
          state: skill.state || 'unlocked',
        }));

        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);

        if (insertError) throw insertError;

        setProgress(100);
        
        const sourceSummary = sources
          .filter(s => s.status === 'completed')
          .map(s => `${s.name}: ${s.skillsCount}`)
          .join(' | ');

        toast.success(
          `✅ Unified Skill Extraction Complete! ${mergedSkills.length} total skills extracted. ${sourceSummary}`
        );
        
        onComplete();
        
        // Reset inputs
        setFile(null);
        setTextInput('');
        setGithubUsername('');
        setGithubToken('');
      } else {
        toast.info('No skills were extracted from the provided sources');
      }
    } catch (error: any) {
      console.error('Aggregate extraction error:', error);
      toast.error('Failed to complete aggregate extraction');
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Smart Aggregate Extract</CardTitle>
              <CardDescription>
                Run all extractors simultaneously and merge results intelligently
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-merge"
              checked={autoMerge}
              onCheckedChange={setAutoMerge}
              disabled={isExtracting}
            />
            <Label htmlFor="auto-merge" className="text-sm">
              Auto Merge
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="agg-file">Document</Label>
            <input
              id="agg-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isExtracting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              accept=".pdf,.doc,.docx,.txt,.md"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agg-github">GitHub Username</Label>
            <input
              id="agg-github"
              type="text"
              placeholder="octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              disabled={isExtracting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agg-token">GitHub Token (Optional)</Label>
            <input
              id="agg-token"
              type="password"
              placeholder="ghp_xxx..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              disabled={isExtracting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agg-text">Text Input</Label>
          <textarea
            id="agg-text"
            placeholder="Paste your resume, project details, or professional content..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isExtracting}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {sources.length > 0 && (
          <div className="space-y-2">
            <Label>Extraction Progress</Label>
            <div className="space-y-2">
              {sources.map((source) => (
                <div key={source.name} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {source.status === 'pending' && <div className="h-2 w-2 rounded-full bg-gray-400" />}
                    {source.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {source.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {source.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {source.status === 'completed' && (
                      <Badge variant="secondary">{source.skillsCount} skills</Badge>
                    )}
                    {source.status === 'error' && (
                      <span className="text-xs text-red-500">{source.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {progress > 0 && <Progress value={progress} className="h-2" />}
          </div>
        )}

        <Button
          onClick={handleAggregateExtract}
          disabled={isExtracting}
          size="lg"
          className="w-full h-14 text-lg"
        >
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Aggregating All Sources...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Run Smart Aggregate Extract
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
