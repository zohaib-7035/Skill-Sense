import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, originalText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a professional CV writer. Based on the user's original content and discovered skills (both explicit and hidden), generate suggestions to enhance their CV.

Provide:
1. A professional summary that highlights key strengths
2. Skill-based bullet points that showcase both explicit and implicit skills
3. Suggestions for reformulating existing experience to highlight hidden skills

Return ONLY a JSON object in this exact format:
{
  "professional_summary": "A compelling 2-3 sentence summary",
  "enhanced_skills_section": ["Skill category 1: skill1, skill2, skill3", "Skill category 2: ..."],
  "experience_improvements": [
    {
      "original": "Original bullet point or section",
      "enhanced": "Improved version highlighting skills"
    }
  ],
  "additional_suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const userMessage = `Skills discovered: ${JSON.stringify(skills)}

Original content: ${originalText}

Please provide CV enhancement suggestions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content;
    const suggestions = JSON.parse(suggestionsText);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enhance-cv function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});