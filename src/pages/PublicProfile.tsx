import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkillMap } from '@/components/SkillMap';
import { Brain, Loader2, Lock } from 'lucide-react';
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
  profile_name: string;
}

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadPublicProfile();
  }, [slug]);

  const loadPublicProfile = async () => {
    if (!slug) return;

    try {
      // Fetch public profile
      const { data: profileData, error: profileError } = await supabase
        .from('skill_profiles')
        .select('*')
        .eq('public_slug', slug)
        .eq('is_public', true)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setNotFound(true);
        return;
      }

      setProfile({
        display_name: profileData.display_name || 'Anonymous User',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        profile_name: profileData.profile_name || 'Professional Profile',
      });

      // Fetch confirmed skills only
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', profileData.id)
        .eq('is_confirmed', true)
        .eq('state', 'unlocked');

      if (skillsError) throw skillsError;

      if (skillsData) {
        setSkills(skillsData.map(s => ({
          ...s,
          skill_type: s.skill_type as 'explicit' | 'implicit',
          evidence: s.evidence || [],
          is_confirmed: s.is_confirmed || false,
        })));
      }
    } catch (error) {
      console.error('Error loading public profile:', error);
      toast.error('Failed to load profile');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              This profile doesn't exist or is not publicly available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const confirmedSkills = skills.filter(s => s.is_confirmed);
  const skillsByCluster = confirmedSkills.reduce((acc, skill) => {
    const cluster = skill.cluster || 'Other';
    acc[cluster] = (acc[cluster] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SkillSense</h1>
          </div>
          <Badge variant="secondary">Public Profile</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{profile.display_name}</h2>
                <p className="text-muted-foreground mb-4">{profile.profile_name}</p>
                {profile.bio && (
                  <p className="text-sm">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{confirmedSkills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Skill Clusters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {Object.keys(skillsByCluster).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {confirmedSkills.length > 0
                  ? Math.round(
                      (confirmedSkills.reduce((sum, s) => sum + s.confidence_score, 0) /
                        confirmedSkills.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D Skill Map */}
        {confirmedSkills.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Skill Map</h3>
            <SkillMap skills={confirmedSkills} onSkillClick={() => {}} />
            <p className="text-sm text-muted-foreground text-center">
              💡 Click and drag to rotate • Scroll to zoom
            </p>
          </div>
        )}

        {/* Skill Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Categories</CardTitle>
            <CardDescription>Skills organized by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(skillsByCluster).map(([cluster, count]) => (
                <div key={cluster} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{cluster}</span>
                  <Badge variant="secondary" className="text-lg px-3">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
            <CardDescription>Highest confidence validated skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedSkills
                .sort((a, b) => b.confidence_score - a.confidence_score)
                .slice(0, 10)
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

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p>Powered by SkillSense • Build your own skill profile today</p>
        </div>
      </main>
    </div>
  );
}
