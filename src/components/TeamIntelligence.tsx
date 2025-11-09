import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Search, Users, TrendingUp, Award } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface ExpertProfile {
  user_id: string;
  display_name?: string;
  skills: Array<{
    skill_name: string;
    confidence_score: number;
  }>;
  totalSkills: number;
}

export function TeamIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgStats, setOrgStats] = useState<any>(null);

  useEffect(() => {
    loadOrganizationStats();
  }, []);

  const loadOrganizationStats = async () => {
    try {
      // Get all public profiles and their skills
      const { data: profiles, error } = await supabase
        .from('skill_profiles')
        .select('id, display_name, user_id, is_public')
        .eq('is_public', true);

      if (error) throw error;

      // Aggregate stats
      const stats = {
        totalExperts: profiles?.length || 0,
        topSkills: [] as Array<{ skill: string; count: number }>
      };

      setOrgStats(stats);
    } catch (error) {
      console.error('Error loading org stats:', error);
    }
  };

  const searchExperts = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a skill to search for');
      return;
    }

    setLoading(true);
    try {
      // Find profiles with matching skills
      const { data: matchingSkills, error: skillsError } = await supabase
        .from('skills')
        .select('profile_id, skill_name, confidence_score')
        .ilike('skill_name', `%${searchQuery}%`)
        .gte('confidence_score', 0.5);

      if (skillsError) throw skillsError;

      // Get profile details for matching users
      const profileIds = [...new Set(matchingSkills?.map(s => s.profile_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('skill_profiles')
        .select('id, user_id, display_name, is_public')
        .in('id', profileIds)
        .eq('is_public', true);

      if (profilesError) throw profilesError;

      // Build expert profiles
      const expertProfiles: ExpertProfile[] = (profiles || []).map(profile => {
        const profileSkills = matchingSkills?.filter(s => s.profile_id === profile.id) || [];
        
        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Anonymous User',
          skills: profileSkills.map(s => ({
            skill_name: s.skill_name,
            confidence_score: s.confidence_score
          })),
          totalSkills: profileSkills.length
        };
      });

      // Sort by confidence and number of matching skills
      expertProfiles.sort((a, b) => {
        const avgConfA = a.skills.reduce((sum, s) => sum + s.confidence_score, 0) / a.skills.length;
        const avgConfB = b.skills.reduce((sum, s) => sum + s.confidence_score, 0) / b.skills.length;
        return avgConfB - avgConfA;
      });

      setExperts(expertProfiles);
      toast.success(`Found ${expertProfiles.length} expert(s)`);
    } catch (error) {
      console.error('Error searching experts:', error);
      toast.error('Failed to search for experts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-blue-500/10">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Team Intelligence & Expert Finder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search across all public user profiles to find internal experts and build high-performing teams based on skill synergy.
            </p>
            
            {orgStats && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-background/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    Available Experts
                  </div>
                  <div className="text-2xl font-bold">{orgStats.totalExperts}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Award className="w-4 h-4" />
                    Public Profiles
                  </div>
                  <div className="text-2xl font-bold">{orgStats.totalExperts}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Input
                placeholder="Search for a skill (e.g., React, Python, Leadership)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchExperts()}
                className="flex-1"
              />
              <Button onClick={searchExperts} disabled={loading} className="gap-2">
                <Search className="w-4 h-4" />
                {loading ? 'Searching...' : 'Find Experts'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {experts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            Found {experts.length} Expert(s)
          </h4>
          
          {experts.map((expert, idx) => (
            <Card key={expert.user_id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {expert.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h5 className="font-semibold">{expert.display_name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {expert.totalSkills} matching skill{expert.totalSkills !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Rank #{idx + 1}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {expert.skills.map((skill) => (
                  <Badge 
                    key={skill.skill_name} 
                    variant="outline"
                    className="text-xs"
                  >
                    {skill.skill_name}
                    <span className="ml-1 opacity-60">
                      ({(skill.confidence_score * 100).toFixed(0)}%)
                    </span>
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && experts.length === 0 && searchQuery && (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No experts found for "{searchQuery}". Try a different skill.
          </p>
        </Card>
      )}
    </div>
  );
}
