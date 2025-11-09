import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Sparkles, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface Skill {
  id?: string;
  skill_name: string;
  skill_type: string;
  confidence_score: number;
  cluster?: string;
}

interface DiscoveredSkill {
  skill_name: string;
  confidence_score: number;
  inferred_from: string[];
  reasoning: string;
  is_confirmed?: boolean;
  is_rejected?: boolean;
}

interface HiddenSkillDiscoveryProps {
  profileId: string;
  skills: Skill[];
  onSkillsDiscovered?: () => void;
}

export function HiddenSkillDiscovery({ profileId, skills, onSkillsDiscovered }: HiddenSkillDiscoveryProps) {
  const [loading, setLoading] = useState(false);
  const [discoveredSkills, setDiscoveredSkills] = useState<DiscoveredSkill[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const handleDiscover = async () => {
    if (skills.length < 5) {
      toast.error("Add at least 5 skills before discovering hidden skills");
      return;
    }

    setLoading(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('discover-skills', {
        body: { existingSkills: skills, profileId }
      });

      if (functionError) throw functionError;

      const discovered = functionData.discovered_skills || [];
      
      // Save to database
      const skillsToInsert = discovered.map((skill: DiscoveredSkill) => ({
        profile_id: profileId,
        skill_name: skill.skill_name,
        confidence_score: skill.confidence_score,
        inferred_from: skill.inferred_from,
        reasoning: skill.reasoning,
        is_confirmed: false,
        is_rejected: false
      }));

      const { error: insertError } = await supabase
        .from('discovered_skills')
        .insert(skillsToInsert);

      if (insertError) throw insertError;

      setDiscoveredSkills(discovered);
      toast.success(`Discovered ${discovered.length} hidden skills!`);
      onSkillsDiscovered?.();
    } catch (error) {
      console.error('Error discovering skills:', error);
      toast.error('Failed to discover hidden skills');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDiscovered = async () => {
    setLoadingExisting(true);
    try {
      const { data, error } = await supabase
        .from('discovered_skills')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_rejected', false);

      if (error) throw error;
      
      const mappedData = (data || []).map(d => ({
        skill_name: d.skill_name,
        confidence_score: d.confidence_score,
        inferred_from: Array.isArray(d.inferred_from) ? d.inferred_from as string[] : [],
        reasoning: d.reasoning || '',
        is_confirmed: d.is_confirmed,
        is_rejected: d.is_rejected
      }));
      
      setDiscoveredSkills(mappedData);
    } catch (error) {
      console.error('Error loading discovered skills:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleConfirm = async (skillName: string) => {
    try {
      const { error } = await supabase
        .from('discovered_skills')
        .update({ is_confirmed: true })
        .eq('profile_id', profileId)
        .eq('skill_name', skillName);

      if (error) throw error;

      setDiscoveredSkills(prev => 
        prev.map(s => s.skill_name === skillName ? { ...s, is_confirmed: true } : s)
      );
      
      toast.success(`Confirmed: ${skillName}`);
    } catch (error) {
      console.error('Error confirming skill:', error);
      toast.error('Failed to confirm skill');
    }
  };

  const handleReject = async (skillName: string) => {
    try {
      const { error } = await supabase
        .from('discovered_skills')
        .update({ is_rejected: true })
        .eq('profile_id', profileId)
        .eq('skill_name', skillName);

      if (error) throw error;

      setDiscoveredSkills(prev => prev.filter(s => s.skill_name !== skillName));
      toast.success('Skill rejected');
    } catch (error) {
      console.error('Error rejecting skill:', error);
      toast.error('Failed to reject skill');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Hidden Skill Discovery</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI analyzes your existing skills to discover hidden transferable competencies and meta-skills you likely possess.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleDiscover} 
                disabled={loading || skills.length < 5}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Discover Hidden Skills
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadExistingDiscovered}
                disabled={loadingExisting}
              >
                Load Existing
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loadingExisting && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {discoveredSkills.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Discovered Skills ({discoveredSkills.length})
          </h4>
          
          {discoveredSkills.map((skill) => (
            <Card 
              key={skill.skill_name} 
              className={`p-4 transition-all ${
                skill.is_confirmed ? 'border-green-500/50 bg-green-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold">{skill.skill_name}</h5>
                    <Badge variant="secondary" className="text-xs">
                      {(skill.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                    {skill.is_confirmed && (
                      <Badge variant="default" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{skill.reasoning}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Inferred from:</span>
                    {skill.inferred_from?.map((source: string) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {!skill.is_confirmed && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirm(skill.skill_name)}
                      className="gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(skill.skill_name)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
