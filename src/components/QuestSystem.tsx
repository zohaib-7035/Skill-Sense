import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Target, Trophy, Star, Zap, Award, Clock, Gift } from 'lucide-react';
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
    category: 'verification',
    difficulty: 'easy',
    xp: 10,
  },
  {
    type: 'write_reflection',
    description: 'Write a brief reflection on how you used this skill',
    icon: '✍️',
    category: 'content',
    difficulty: 'medium',
    xp: 20,
  },
  {
    type: 'add_project',
    description: 'Add a project example that demonstrates this skill',
    icon: '🚀',
    category: 'portfolio',
    difficulty: 'medium',
    xp: 25,
  },
  {
    type: 'add_certification',
    description: 'Add a certification or course completion proof',
    icon: '🎓',
    category: 'credentials',
    difficulty: 'easy',
    xp: 15,
  },
  {
    type: 'peer_endorsement',
    description: 'Get an endorsement from a colleague or peer',
    icon: '🤝',
    category: 'social',
    difficulty: 'hard',
    xp: 30,
  },
  {
    type: 'blog_post',
    description: 'Write a blog post or article about this skill',
    icon: '📝',
    category: 'content',
    difficulty: 'hard',
    xp: 35,
  },
  {
    type: 'tutorial_video',
    description: 'Create a tutorial or demo video showcasing this skill',
    icon: '🎥',
    category: 'content',
    difficulty: 'hard',
    xp: 40,
  },
  {
    type: 'mentor_session',
    description: 'Teach or mentor someone using this skill',
    icon: '👨‍🏫',
    category: 'social',
    difficulty: 'medium',
    xp: 25,
  },
];

export function QuestSystem({ profileId, lockedSkills, onQuestComplete }: QuestSystemProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');

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
        // Assign 2-3 random quests per locked skill with variety
        const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
        const numQuests = Math.floor(Math.random() * 2) + 2; // 2-3 quests
        return shuffled.slice(0, numQuests).map(template => ({
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

  const completeQuest = async (questId: string, questType: string) => {
    try {
      const { error } = await supabase
        .from('quests')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) throw error;

      const template = QUEST_TEMPLATES.find(t => t.type === questType);
      const xpGained = template?.xp || 10;

      setQuests(prev => prev.map(q => 
        q.id === questId ? { ...q, is_completed: true, completed_at: new Date().toISOString() } : q
      ));
      setTotalXP(prev => prev + xpGained);

      toast.success(`Quest completed! +${xpGained} XP 🎉`);
      onQuestComplete();
    } catch (error) {
      console.error('Error completing quest:', error);
      toast.error('Failed to complete quest');
    }
  };

  const completedCount = quests.filter(q => q.is_completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  useEffect(() => {
    const completed = quests.filter(q => q.is_completed);
    const xp = completed.reduce((sum, q) => {
      const template = QUEST_TEMPLATES.find(t => t.type === q.quest_type);
      return sum + (template?.xp || 0);
    }, 0);
    setTotalXP(xp);
  }, [quests]);

  const getQuestsByCategory = (category: string) => {
    return quests.filter(q => {
      const template = QUEST_TEMPLATES.find(t => t.type === q.quest_type);
      return template?.category === category;
    });
  };

  const filteredQuests = quests.filter(q => {
    if (activeFilter === 'active') return !q.is_completed;
    if (activeFilter === 'completed') return q.is_completed;
    return true;
  });

  const categories = ['verification', 'content', 'portfolio', 'credentials', 'social'];
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold text-primary">{totalXP}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{completedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-bold text-orange-600">{totalCount - completedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{Math.round(progressPercent)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Quest Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Quests
              </CardTitle>
              <CardDescription>
                Complete quests to unlock skills and earn XP
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Gift className="h-4 w-4 mr-2" />
              {totalCount - completedCount} Available
            </Badge>
          </div>
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
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({quests.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({quests.filter(q => !q.is_completed).length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-4 space-y-3">
              {filteredQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quests in this category
                </div>
              ) : (
                filteredQuests.map((quest) => {
                  const template = QUEST_TEMPLATES.find(t => t.type === quest.quest_type);
                  return (
                    <div
                      key={quest.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                        quest.is_completed
                          ? 'bg-muted border-muted-foreground/20'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="capitalize">
                              {template?.category}
                            </Badge>
                            <Badge variant="secondary" className={getDifficultyColor(template?.difficulty || 'easy')}>
                              {template?.difficulty}
                            </Badge>
                            <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              <Star className="h-3 w-3 mr-1" />
                              {template?.xp} XP
                            </Badge>
                          </div>
                          <p className={`text-sm ${quest.is_completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                            {quest.quest_description}
                          </p>
                          {quest.is_completed && quest.completed_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Completed on {new Date(quest.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {quest.is_completed ? (
                          <Badge variant="default" className="shrink-0 bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => completeQuest(quest.id, quest.quest_type)}
                            className="shrink-0"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>

          {/* Categories Overview */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Quest Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map(category => {
                const categoryQuests = getQuestsByCategory(category);
                const completed = categoryQuests.filter(q => q.is_completed).length;
                const total = categoryQuests.length;
                return (
                  <div key={category} className="bg-muted rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium capitalize text-muted-foreground">{category}</p>
                    <p className="text-lg font-bold">{completed}/{total}</p>
                    <Progress value={total > 0 ? (completed / total) * 100 : 0} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
