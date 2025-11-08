import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SkillMap } from '@/components/SkillMap';
import { Brain, Mail, MapPin, Briefcase, Trophy, Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
  public_slug: string;
}

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicProfile();
  }, [slug]);

  const loadPublicProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('skill_profiles')
        .select('*')
        .eq('public_slug', slug)
        .eq('is_public', true)
        .single();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error('Profile not found or is private');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch confirmed skills only
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', profileData.id)
        .eq('is_confirmed', true)
        .eq('state', 'unlocked');

      if (skillsError) throw skillsError;

      setSkills(skillsData.map(s => ({
        ...s,
        skill_type: s.skill_type as 'explicit' | 'implicit',
        evidence: s.evidence || [],
        is_confirmed: s.is_confirmed || false,
      })));
    } catch (error) {
      console.error('Error loading public profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              This profile doesn't exist or is set to private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to SkillSense
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const skillsByCluster = skills.reduce((acc, skill) => {
    const cluster = skill.cluster || 'Other';
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const totalXP = skills.reduce((sum, s) => sum + Math.round(s.confidence_score * 100), 0);
  const avgConfidence = skills.length > 0 
    ? skills.reduce((sum, s) => sum + s.confidence_score, 0) / skills.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SkillSense</h1>
          </div>
          <Link to="/">
            <Button variant="outline">
              Create Your Profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  <p className="text-muted-foreground mt-2">{profile.bio || 'Professional skill portfolio powered by SkillSense'}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Skills</p>
                    <p className="text-2xl font-bold text-primary">{skills.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Skill Clusters</p>
                    <p className="text-2xl font-bold text-blue-600">{Object.keys(skillsByCluster).length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold text-green-600">{Math.round(avgConfidence * 100)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total XP</p>
                    <p className="text-2xl font-bold text-yellow-600">{totalXP}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D Skill Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Interactive Skill Map
            </CardTitle>
            <CardDescription>
              Explore skills in 3D • Larger nodes = higher confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillMap skills={skills} onSkillClick={() => {}} />
            <p className="text-sm text-muted-foreground text-center mt-4">
              💡 Click and drag to rotate • Scroll to zoom
            </p>
          </CardContent>
        </Card>

        {/* Skill Clusters */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(skillsByCluster).map(([cluster, clusterSkills]) => (
            <Card key={cluster}>
              <CardHeader>
                <CardTitle className="text-lg">{cluster}</CardTitle>
                <CardDescription>
                  {clusterSkills.length} skill{clusterSkills.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clusterSkills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{skill.skill_name}</span>
                        <Badge variant="secondary">
                          {(skill.confidence_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={skill.confidence_score * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Skills by Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {skills
                .sort((a, b) => b.confidence_score - a.confidence_score)
                .slice(0, 10)
                .map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium">{skill.skill_name}</span>
                      {skill.cluster && (
                        <Badge variant="outline" className="text-xs">
                          {skill.cluster}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      {(skill.confidence_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Create Your Own Skill Profile</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Build a professional skill portfolio like this one. Upload your CV, extract skills with AI, 
              complete quests to unlock abilities, and share your unique profile link.
            </p>
            <Link to="/">
              <Button size="lg" className="mt-4">
                Get Started for Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-background/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by <span className="font-semibold text-primary">SkillSense</span> • AI-Powered Skill Discovery & Validation</p>
        </div>
      </footer>
    </div>
  );
}
