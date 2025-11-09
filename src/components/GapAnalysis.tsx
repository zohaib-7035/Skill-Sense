import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, ExternalLink, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
}

interface GapAnalysisProps {
  profileId: string;
  skills: Skill[];
}

interface GapResult {
  matching_skills: string[];
  missing_skills: string[];
  recommendations: Array<{
    skill: string;
    resources: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    practice_suggestion: string;
  }>;
}

export function GapAnalysis({ profileId, skills }: GapAnalysisProps) {
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);

  const handleDownload = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    doc.setFontSize(18);
    doc.text('CV Gap Analysis', margin, y);
    y += 10;

    if (roleTitle) {
      doc.setFontSize(12);
      doc.text(`Target Role: ${roleTitle}`, margin, y);
      y += 7;
    }
    if (roleDescription) {
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(`Job Description: ${roleDescription}`, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    }

    const ensurePage = (threshold = 260) => {
      if (y > threshold) {
        doc.addPage();
        y = 20;
      }
    };

    // Matching Skills
    doc.setFontSize(14);
    doc.text('Matching Skills', margin, y);
    y += 7;
    doc.setFontSize(10);
    const matching = result.matching_skills.length ? result.matching_skills : ['None'];
    const mLines = doc.splitTextToSize(matching.map(s => `• ${s}`).join('\n'), pageWidth - 2 * margin);
    doc.text(mLines, margin, y);
    y += mLines.length * 5 + 8;
    ensurePage();

    // Missing Skills
    doc.setFontSize(14);
    doc.text('Missing Skills', margin, y);
    y += 7;
    doc.setFontSize(10);
    const missing = result.missing_skills.length ? result.missing_skills : ['None'];
    const msLines = doc.splitTextToSize(missing.map(s => `• ${s}`).join('\n'), pageWidth - 2 * margin);
    doc.text(msLines, margin, y);
    y += msLines.length * 5 + 8;
    ensurePage();

    // Recommendations
    doc.setFontSize(14);
    doc.text('Recommendations', margin, y);
    y += 7;
    doc.setFontSize(10);

    result.recommendations.forEach((rec, idx) => {
      ensurePage();
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}. ${rec.skill}`, margin, y);
      y += 5;
      doc.setFont(undefined, 'normal');

      const practice = doc.splitTextToSize(`Practice: ${rec.practice_suggestion}`, pageWidth - 2 * margin);
      doc.text(practice, margin, y);
      y += practice.length * 5 + 4;

      const resourcesText = rec.resources.map(r => `- ${r.title} (${r.type}) ${r.url}`).join('\n');
      const rLines = doc.splitTextToSize(resourcesText || '- No resources', pageWidth - 2 * margin);
      doc.text(rLines, margin, y);
      y += rLines.length * 5 + 6;
    });

    doc.save('cv-gap-analysis.pdf');
  };

  const handleAnalyze = async () => {
    if (!roleTitle.trim() || !roleDescription.trim()) {
      toast.error('Please fill in both role title and description');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save target role
      const { data: roleData, error: roleError } = await supabase
        .from('target_roles')
        .insert({
          user_id: user.id,
          role_title: roleTitle,
          role_description: roleDescription,
          required_skills: [],
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Call AI for gap analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-gap', {
        body: {
          userSkills: skills.map(s => s.skill_name),
          targetRole: {
            role_title: roleTitle,
            role_description: roleDescription,
          },
        },
      });

      if (analysisError) throw analysisError;

      // Save gap analysis result
      await supabase.from('skill_gaps').insert({
        profile_id: profileId,
        target_role_id: roleData.id,
        missing_skills: analysisData.missing_skills,
        matching_skills: analysisData.matching_skills,
        recommendations: analysisData.recommendations,
      });

      setResult(analysisData);
      toast.success('Gap analysis completed!');
    } catch (error) {
      console.error('Gap analysis error:', error);
      toast.error('Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skill Gap Analysis
          </CardTitle>
          <CardDescription>
            Compare your skills with a target role to identify gaps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-title">Target Role Title</Label>
            <Input
              id="role-title"
              placeholder="e.g., Senior Full Stack Developer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Job Description</Label>
            <Textarea
              id="role-description"
              placeholder="Paste the job description here..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={6}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Gap'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" /> Download Gap PDF
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Matching Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.matching_skills.map((skill, index) => (
                  <Badge key={index} variant="default">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Missing Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-semibold text-lg">{rec.skill}</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Practice suggestion:</strong> {rec.practice_suggestion}
                      </p>
                      <div>
                        <p className="text-sm font-medium mb-2">Resources:</p>
                        <ul className="space-y-1">
                          {rec.resources.map((resource, rIndex) => (
                            <li key={rIndex} className="text-sm">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {resource.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {resource.type}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
