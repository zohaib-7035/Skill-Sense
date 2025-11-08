import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth/AuthForm';
import { FileUpload } from '@/components/FileUpload';
import { TextInput } from '@/components/TextInput';
import { SkillCard } from '@/components/SkillCard';
import { SkillVisualization } from '@/components/SkillVisualization';
import { GapAnalysis } from '@/components/GapAnalysis';
import { CVEnhancement } from '@/components/CVEnhancement';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, Brain, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [processing, setProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');

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
    const { error } = await supabase
      .from('skills')
      .update({ is_confirmed: true })
      .eq('id', skillId);

    if (error) {
      toast.error('Failed to confirm skill');
    } else {
      setSkills(skills.map(s => s.id === skillId ? { ...s, is_confirmed: true } : s));
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="extract">Extract Skills</TabsTrigger>
            <TabsTrigger value="profile">Skill Profile</TabsTrigger>
            <TabsTrigger value="gap">Gap Analysis</TabsTrigger>
            <TabsTrigger value="cv">CV Enhancement</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-6">
            {processing && (
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Analyzing your content with AI...</p>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <FileUpload onTextExtracted={handleTextExtracted} />
              <TextInput onTextSubmit={handleTextExtracted} />
            </div>
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
                <SkillVisualization skills={skills} />
                <div>
                  <h2 className="text-2xl font-bold mb-4">Your Skills ({skills.length})</h2>
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
      </main>
    </div>
  );
};

export default Index;
