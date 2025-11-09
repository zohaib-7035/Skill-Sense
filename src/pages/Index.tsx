import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth/AuthForm';
import { FileUpload } from '@/components/FileUpload';
import { TextInput } from '@/components/TextInput';
import { SkillCard } from '@/components/SkillCard';
import { SkillVisualization } from '@/components/SkillVisualization';
import { GapAnalysis } from '@/components/GapAnalysis';
import { CVEnhancement } from '@/components/CVEnhancement';
import { SkillMap } from '@/components/SkillMap';
import { HiddenSkillDiscovery } from '@/components/HiddenSkillDiscovery';
import { TeamIntelligence } from '@/components/TeamIntelligence';
import { GitHubIntegration } from '@/components/GitHubIntegration';
import { SkillDetailModal } from '@/components/SkillDetailModal';
import { QuestSystem } from '@/components/QuestSystem';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ShareProfileDialog } from '@/components/ShareProfileDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, LogOut, Brain, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
  cluster?: string;
  microstory?: string;
  state?: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [processing, setProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Aggregate extraction states
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingText, setPendingText] = useState('');
  const [pendingGithub, setPendingGithub] = useState({ username: '', token: '' });
  const [aggregateProgress, setAggregateProgress] = useState<{
    github?: string;
    document?: string;
    text?: string;
  }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data: profiles } = await supabase
      .from('skill_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (profiles && profiles.length > 0) {
      setProfileId(profiles[0].id);
      loadSkills(profiles[0].id);
    } else {
      // Create a new profile
      const { data: newProfile } = await supabase
        .from('skill_profiles')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (newProfile) {
        setProfileId(newProfile.id);
      }
    }
  };

  const loadSkills = async (profileId: string) => {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', profileId);

    if (data) {
      setSkills(data.map(s => ({
        ...s,
        skill_type: s.skill_type as 'explicit' | 'implicit',
        evidence: s.evidence || [],
        is_confirmed: s.is_confirmed || false,
      })));
    }
  };

  const handleTextExtracted = async (text: string, source: string) => {
    if (!profileId) return;

    setProcessing(true);
    setOriginalText(text);

    try {
      const { data, error } = await supabase.functions.invoke('extract-skills', {
        body: { text },
      });

      if (error) throw error;

      const extractedSkills = data.skills || [];

      // Save skills to database
      if (extractedSkills.length > 0) {
        const skillsToInsert = extractedSkills.map((skill: any) => ({
          profile_id: profileId,
          skill_name: skill.skill_name,
          skill_type: skill.skill_type,
          confidence_score: skill.confidence_score,
          evidence: skill.evidence || [],
          cluster: skill.cluster || 'Other',
          microstory: skill.microstory || '',
          state: skill.state || 'unlocked',
        }));

        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);

        if (insertError) throw insertError;

        await loadSkills(profileId);
        toast.success(`Extracted ${extractedSkills.length} skills from ${source}`);
      } else {
        toast.info('No skills were extracted. Try providing more detailed content.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract skills');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmSkill = async (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    const updates: any = { is_confirmed: true };
    
    // If confirming increases confidence, unlock it
    if (skill && skill.confidence_score >= 0.5) {
      updates.state = 'unlocked';
    }

    const { error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', skillId);

    if (error) {
      toast.error('Failed to confirm skill');
    } else {
      setSkills(skills.map(s => s.id === skillId ? { ...s, ...updates } : s));
      toast.success('Skill confirmed!');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      toast.error('Failed to remove skill');
    } else {
      setSkills(skills.filter(s => s.id !== skillId));
      toast.success('Skill removed');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(skills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'my-skills.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Skills exported as JSON');
  };

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleAggregateExtract = async () => {
    const hasData = pendingFile || pendingText.trim() || pendingGithub.username.trim();
    
    if (!hasData) {
      toast.error('Please provide at least one data source');
      return;
    }

    if (!profileId) return;

    setProcessing(true);
    setAggregateProgress({});
    
    const allSkills: any[] = [];

    try {
      // Extract from document
      if (pendingFile) {
        setAggregateProgress(prev => ({ ...prev, document: 'Processing...' }));
        try {
          const { parseDocument } = await import('@/lib/documentParser');
          const text = await parseDocument(pendingFile);
          if (text) {
            const { data, error } = await supabase.functions.invoke('extract-skills', {
              body: { text },
            });
            if (!error && data?.skills) {
              allSkills.push(...data.skills.map((s: any) => ({ ...s, source: 'Document' })));
              setAggregateProgress(prev => ({ ...prev, document: `✓ ${data.skills.length} skills` }));
            }
          }
        } catch (error) {
          setAggregateProgress(prev => ({ ...prev, document: '✗ Failed' }));
        }
      }

      // Extract from GitHub
      if (pendingGithub.username.trim()) {
        setAggregateProgress(prev => ({ ...prev, github: 'Processing...' }));
        try {
          const { data, error } = await supabase.functions.invoke('github-skill-extract', {
            body: { 
              username: pendingGithub.username,
              token: pendingGithub.token || undefined
            }
          });
          if (!error && data?.skills) {
            allSkills.push(...data.skills.map((s: any) => ({ ...s, source: 'GitHub' })));
            setAggregateProgress(prev => ({ ...prev, github: `✓ ${data.skills.length} skills` }));
          }
        } catch (error) {
          setAggregateProgress(prev => ({ ...prev, github: '✗ Failed' }));
        }
      }

      // Extract from text
      if (pendingText.trim()) {
        setAggregateProgress(prev => ({ ...prev, text: 'Processing...' }));
        try {
          const { data, error } = await supabase.functions.invoke('extract-skills', {
            body: { text: pendingText },
          });
          if (!error && data?.skills) {
            allSkills.push(...data.skills.map((s: any) => ({ ...s, source: 'Text' })));
            setAggregateProgress(prev => ({ ...prev, text: `✓ ${data.skills.length} skills` }));
          }
        } catch (error) {
          setAggregateProgress(prev => ({ ...prev, text: '✗ Failed' }));
        }
      }

      // Merge duplicate skills
      const skillMap = new Map<string, any>();
      allSkills.forEach(skill => {
        const key = skill.skill_name.toLowerCase().trim();
        if (skillMap.has(key)) {
          const existing = skillMap.get(key);
          const avgConfidence = (existing.confidence_score + skill.confidence_score) / 2;
          const combinedEvidence = [...new Set([...existing.evidence, ...skill.evidence])];
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

      const mergedSkills = Array.from(skillMap.values());

      // Save to database
      if (mergedSkills.length > 0) {
        const skillsToInsert = mergedSkills.map(skill => ({
          profile_id: profileId,
          skill_name: skill.skill_name,
          skill_type: skill.skill_type,
          confidence_score: skill.confidence_score,
          evidence: skill.evidence || [],
          cluster: skill.cluster || 'Other',
          microstory: skill.microstory || '',
          state: skill.state || 'unlocked',
        }));

        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);

        if (insertError) throw insertError;

        await loadSkills(profileId);
        toast.success(`✅ Aggregate Extraction Complete! ${mergedSkills.length} total skills extracted and merged`);
        
        // Clear inputs
        setPendingFile(null);
        setPendingText('');
        setPendingGithub({ username: '', token: '' });
      } else {
        toast.info('No skills were extracted from the provided sources');
      }
    } catch (error) {
      console.error('Aggregate extraction error:', error);
      toast.error('Failed to complete aggregate extraction');
    } finally {
      setProcessing(false);
      setAggregateProgress({});
    }
  };

  const lockedSkills = skills.filter(s => s.state === 'locked');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SkillSense</h1>
          </div>
          <div className="flex items-center gap-2">
            {profileId && (
              <ShareProfileDialog 
                profileId={profileId} 
                userEmail={user.email || ''} 
              />
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="extract" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="extract">Extract</TabsTrigger>
            <TabsTrigger value="map">Skill Map</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="gap">Gap</TabsTrigger>
            <TabsTrigger value="cv">CV</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-6">
            {processing && (
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Analyzing your content with AI...</p>
              </div>
            )}
            
            <div className="space-y-6">
              {profileId && (
                <GitHubIntegration 
                  profileId={profileId}
                  onSkillsExtracted={loadUserProfile}
                  onGithubDataChanged={(username, token) => setPendingGithub({ username, token })}
                />
              )}
              
              <div className="grid gap-6 md:grid-cols-2">
                <FileUpload 
                  onTextExtracted={handleTextExtracted}
                  onFileSelected={(file) => setPendingFile(file)}
                />
                <TextInput 
                  onTextSubmit={handleTextExtracted}
                  onTextChanged={(text) => setPendingText(text)}
                />
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Aggregate All Sources
                  </span>
                </div>
              </div>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  {Object.keys(aggregateProgress).length > 0 && (
                    <div className="mb-4 space-y-2">
                      {aggregateProgress.github && (
                        <div className="flex items-center justify-between text-sm">
                          <span>GitHub:</span>
                          <Badge variant="secondary">{aggregateProgress.github}</Badge>
                        </div>
                      )}
                      {aggregateProgress.document && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Document:</span>
                          <Badge variant="secondary">{aggregateProgress.document}</Badge>
                        </div>
                      )}
                      {aggregateProgress.text && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Text:</span>
                          <Badge variant="secondary">{aggregateProgress.text}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAggregateExtract}
                    disabled={processing}
                    size="lg"
                    className="w-full h-16 text-lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Aggregating All Sources...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-6 w-6" />
                        Extract & Merge All Skills
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            {skills.length === 0 ? (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  No skills to visualize yet. Extract some skills first!
                </p>
              </div>
            ) : (
              <>
                <ProgressTracker skills={skills} />
                <SkillMap skills={skills} onSkillClick={handleSkillClick} />
                <p className="text-sm text-muted-foreground text-center">
                  💡 Click and drag to rotate • Scroll to zoom • Click nodes for details
                </p>
              </>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {skills.length === 0 ? (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  No skills discovered yet. Upload a document or paste some text to get started!
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Skills</CardTitle>
                      <CardDescription>Your complete skill inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{skills.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Confirmed Skills</CardTitle>
                      <CardDescription>Skills you've validated</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">
                        {skills.filter(s => s.is_confirmed).length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Unlocked Skills</CardTitle>
                      <CardDescription>Ready to showcase</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">
                        {skills.filter(s => s.state === 'unlocked').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Clusters</CardTitle>
                    <CardDescription>Your skills organized by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(
                        skills.reduce((acc, skill) => {
                          const cluster = skill.cluster || 'Other';
                          acc[cluster] = (acc[cluster] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([cluster, count]) => (
                        <div key={cluster} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="font-medium">{cluster}</span>
                          <Badge variant="secondary" className="text-lg px-3">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Skills by Confidence</CardTitle>
                    <CardDescription>Your strongest validated skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {skills
                        .sort((a, b) => b.confidence_score - a.confidence_score)
                        .slice(0, 8)
                        .map((skill) => (
                          <div key={skill.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{skill.skill_name}</span>
                                {skill.cluster && (
                                  <Badge variant="outline" className="text-xs">
                                    {skill.cluster}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">
                                {(skill.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={skill.confidence_score * 100} className="h-2" />
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <SkillVisualization skills={skills} />
                
                <div>
                  <h2 className="text-2xl font-bold mb-4">All Skills ({skills.length})</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {skills.map(skill => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onConfirm={handleConfirmSkill}
                        onRemove={handleRemoveSkill}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            {profileId && skills.length > 0 ? (
              <QuestSystem 
                profileId={profileId}
                lockedSkills={lockedSkills}
                onQuestComplete={loadUserProfile}
              />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Extract some skills first to unlock quests!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            {profileId && skills.length > 0 ? (
              <HiddenSkillDiscovery 
                profileId={profileId} 
                skills={skills}
                onSkillsDiscovered={loadUserProfile}
              />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Extract at least 5 skills to discover hidden competencies!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team">
            <TeamIntelligence />
          </TabsContent>

          <TabsContent value="gap">
            {profileId && skills.length > 0 ? (
              <GapAnalysis profileId={profileId} skills={skills} />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Extract some skills first to use gap analysis!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cv">
            {skills.length > 0 && originalText ? (
              <CVEnhancement skills={skills} originalText={originalText} />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Extract skills from your CV first to get enhancement suggestions!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SkillDetailModal
          skill={selectedSkill}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAccept={handleConfirmSkill}
          onReject={handleRemoveSkill}
        />
      </main>
    </div>
  );
};

export default Index;
