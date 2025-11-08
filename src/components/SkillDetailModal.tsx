import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: string;
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
  cluster?: string;
  microstory?: string;
  state?: string;
}

interface SkillDetailModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (skillId: string) => void;
  onReject: (skillId: string) => void;
}

export function SkillDetailModal({ skill, isOpen, onClose, onAccept, onReject }: SkillDetailModalProps) {
  if (!skill) return null;

  const isLocked = skill.state === 'locked';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl">{skill.skill_name}</DialogTitle>
            {isLocked ? (
              <Lock className="h-5 w-5 text-destructive" />
            ) : (
              <Unlock className="h-5 w-5 text-primary" />
            )}
          </div>
          <DialogDescription>
            {skill.cluster && (
              <Badge variant="secondary" className="mt-2">
                {skill.cluster}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Confidence Score */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className="text-sm text-muted-foreground">
                {(skill.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={skill.confidence_score * 100} className="h-2" />
          </div>

          {/* Skill Type */}
          <div>
            <span className="text-sm font-medium">Type: </span>
            <Badge variant={skill.skill_type === 'explicit' ? 'default' : 'outline'}>
              {skill.skill_type}
            </Badge>
          </div>

          {/* Microstory */}
          {skill.microstory && (
            <div>
              <h3 className="text-sm font-medium mb-2">Story</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {skill.microstory}
              </p>
            </div>
          )}

          {/* Evidence */}
          <div>
            <h3 className="text-sm font-medium mb-2">Evidence</h3>
            <div className="space-y-2">
              {skill.evidence.map((item, idx) => (
                <div key={idx} className="text-sm bg-muted p-3 rounded-md border-l-4 border-primary">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="text-sm font-medium">Status: </span>
            <Badge variant={skill.is_confirmed ? 'default' : 'secondary'}>
              {skill.is_confirmed ? 'Confirmed' : 'Pending'}
            </Badge>
            {isLocked && (
              <Badge variant="destructive" className="ml-2">
                Locked - Complete quests to unlock
              </Badge>
            )}
          </div>

          {/* Actions */}
          {!skill.is_confirmed && !isLocked && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  onAccept(skill.id);
                  onClose();
                }}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept & Confirm
              </Button>
              <Button
                onClick={() => {
                  onReject(skill.id);
                  onClose();
                }}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
