import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Target, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Quest {
  id: string;
  skill_id: string;
  quest_type: string;
  quest_description: string;
  is_completed: boolean;
  completed_at?: string;
}

interface QuestSystemProps {
  profileId: string;
  lockedSkills: Array<{ id: string; skill_name: string }>;
  onQuestComplete: () => void;
}

const QUEST_TEMPLATES = [
  {
    type: 'add_github',
    description: 'Add your GitHub profile link to validate coding skills',
    icon: '💻',
  },
  {
    type: 'write_reflection',
    description: 'Write a brief reflection on how you used this skill',
    icon: '✍️',
  },
  {
    type: 'add_project',
    description: 'Add a project example that demonstrates this skill',
    icon: '🚀',
  },
  {
    type: 'add_certification',
    description: 'Add a certification or course completion proof',
    icon: '🎓',
  },
];

export function QuestSystem({ profileId, lockedSkills, onQuestComplete }: QuestSystemProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, [profileId, lockedSkills]);

  const loadQuests = async () => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .in('skill_id', lockedSkills.map(s => s.id));

      if (error) throw error;

      // If no quests exist, generate them
      if (!data || data.length === 0) {
        await generateQuests();
      } else {
        setQuests(data);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
      toast.error('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const generateQuests = async () => {
    try {
      const newQuests = lockedSkills.flatMap(skill => {
        // Assign 2 random quests per locked skill
        const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2).map(template => ({
          skill_id: skill.id,
          quest_type: template.type,
          quest_description: `${template.icon} ${template.description} for "${skill.skill_name}"`,
          is_completed: false,
        }));
      });

      const { data, error } = await supabase
        .from('quests')
        .insert(newQuests)
        .select();

      if (error) throw error;
      setQuests(data || []);
    } catch (error) {
      console.error('Error generating quests:', error);
      toast.error('Failed to generate quests');
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const { error } = await supabase
        .from('quests')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) throw error;

      setQuests(prev => prev.map(q => 
        q.id === questId ? { ...q, is_completed: true, completed_at: new Date().toISOString() } : q
      ));

      toast.success('Quest completed! 🎉');
      onQuestComplete();
    } catch (error) {
      console.error('Error completing quest:', error);
      toast.error('Failed to complete quest');
    }
  };

  const completedCount = quests.filter(q => q.is_completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading quests...</div>;
  }

  if (lockedSkills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            All Skills Unlocked!
          </CardTitle>
          <CardDescription>
            Great job! You've unlocked all your skills. Keep building your profile!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Quests
        </CardTitle>
        <CardDescription>
          Complete quests to unlock skills and increase your profile strength
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-lg border ${
                quest.is_completed
                  ? 'bg-muted border-muted-foreground/20'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm ${quest.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                    {quest.quest_description}
                  </p>
                  {quest.is_completed && quest.completed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed on {new Date(quest.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {quest.is_completed ? (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => completeQuest(quest.id)}
                    className="shrink-0"
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
