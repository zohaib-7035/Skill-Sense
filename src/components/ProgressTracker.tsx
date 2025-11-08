import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, Trophy } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  state?: string;
}

interface ProgressTrackerProps {
  skills: Skill[];
}

export function ProgressTracker({ skills }: ProgressTrackerProps) {
  const totalSkills = skills.length;
  const unlockedSkills = skills.filter(s => s.state === 'unlocked').length;
  const lockedSkills = skills.filter(s => s.state === 'locked').length;
  
  const progressPercent = totalSkills > 0 ? (unlockedSkills / totalSkills) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Skill Progress
        </CardTitle>
        <CardDescription>
          Track your skill unlocking journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {progressPercent.toFixed(0)}% Complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Unlock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Unlocked</span>
            </div>
            <p className="text-2xl font-bold text-primary">{unlockedSkills}</p>
          </div>
          
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">Locked</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{lockedSkills}</p>
          </div>
        </div>

        {/* Motivational Message */}
        {lockedSkills > 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Complete quests to unlock {lockedSkills} more skill{lockedSkills !== 1 ? 's' : ''}! 🚀
          </p>
        ) : (
          <p className="text-sm text-primary text-center font-medium">
            🎉 All skills unlocked! You're on fire!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
