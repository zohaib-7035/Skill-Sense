import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
}

interface CVEnhancementProps {
  skills: Skill[];
  originalText: string;
}

interface Suggestions {
  professional_summary: string;
  enhanced_skills_section: string[];
  experience_improvements: Array<{
    original: string;
    enhanced: string;
  }>;
  additional_suggestions: string[];
}

export function CVEnhancement({ skills, originalText }: CVEnhancementProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-cv', {
        body: {
          skills: skills.map(s => ({
            name: s.skill_name,
            type: s.skill_type,
            confidence: s.confidence_score,
          })),
          originalText,
        },
      });

      if (error) throw error;
      setSuggestions(data);
      toast.success('CV suggestions generated!');
    } catch (error) {
      console.error('CV enhancement error:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!suggestions) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Enhanced CV Suggestions', margin, yPosition);
    yPosition += 15;

    // Professional Summary
    doc.setFontSize(14);
    doc.text('Professional Summary', margin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(suggestions.professional_summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 5 + 10;

    // Skills Section
    doc.setFontSize(14);
    doc.text('Enhanced Skills', margin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    suggestions.enhanced_skills_section.forEach(skill => {
      const skillLines = doc.splitTextToSize(`• ${skill}`, pageWidth - 2 * margin);
      doc.text(skillLines, margin, yPosition);
      yPosition += skillLines.length * 5 + 2;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 10;

    // Experience Improvements
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Experience Improvements', margin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);

    suggestions.experience_improvements.forEach((improvement, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont(undefined, 'bold');
      doc.text(`Improvement ${index + 1}:`, margin, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');

      const enhancedLines = doc.splitTextToSize(improvement.enhanced, pageWidth - 2 * margin);
      doc.text(enhancedLines, margin, yPosition);
      yPosition += enhancedLines.length * 5 + 8;
    });

    doc.save('cv-enhancement-suggestions.pdf');
    toast.success('PDF downloaded!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CV Enhancement
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to enhance your CV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <Button onClick={handleGenerateSuggestions} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              'Generate CV Suggestions'
            )}
          </Button>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Professional Summary</h3>
              <p className="text-sm text-muted-foreground">{suggestions.professional_summary}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Enhanced Skills Section</h3>
              <ul className="space-y-1">
                {suggestions.enhanced_skills_section.map((skill, index) => (
                  <li key={index} className="text-sm text-muted-foreground">• {skill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Experience Improvements</h3>
              <div className="space-y-4">
                {suggestions.experience_improvements.map((improvement, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Enhanced version:</p>
                    <p className="text-sm text-muted-foreground">{improvement.enhanced}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Additional Suggestions</h3>
              <ul className="space-y-1">
                {suggestions.additional_suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground">• {suggestion}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownloadPDF} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
              </Button>
              <Button onClick={handleGenerateSuggestions} variant="outline" className="flex-1">
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
