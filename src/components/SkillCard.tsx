import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
}

interface SkillCardProps {
  skill: Skill;
  onConfirm: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SkillCard({ skill, onConfirm, onRemove }: SkillCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Card className={skill.is_confirmed ? 'border-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{skill.skill_name}</h3>
              <Badge variant={skill.skill_type === 'explicit' ? 'default' : 'secondary'}>
                {skill.skill_type}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Confidence:</span>
                <span className="font-medium">{(skill.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <Progress value={skill.confidence_score * 100} className="h-2" />
            </div>
          </div>
          <div className="flex gap-2">
            {!skill.is_confirmed && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onConfirm(skill.id)}
                title="Confirm skill"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(skill.id)}
              title="Remove skill"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={showEvidence} onOpenChange={setShowEvidence}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {showEvidence ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Evidence
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Evidence ({skill.evidence.length})
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2">
              {skill.evidence.map((evidence, index) => (
                <div key={index} className="p-2 bg-muted rounded text-sm italic">
                  "{evidence}"
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
