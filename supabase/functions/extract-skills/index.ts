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
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a professional skills analyst. Extract both explicit and implicit skills from the provided text.

Explicit skills are directly mentioned (e.g., "Python", "Project Management", "SQL").
Implicit skills are inferred from context (e.g., leadership from "managed a team of 10", problem-solving from "resolved complex technical challenges").

For each skill:
1. Identify the skill name
2. Classify as "explicit" or "implicit"
3. Assign a confidence score between 0.00 and 1.00
4. Provide evidence snippets (1-3 relevant quotes from the text)

Return ONLY a JSON array in this exact format:
[
  {
    "skill_name": "Python",
    "skill_type": "explicit",
    "confidence_score": 0.95,
    "evidence": ["5 years of Python development", "Built Python-based APIs"]
  }
]`;

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
          { role: 'user', content: text }
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
    const skillsText = data.choices[0].message.content;
    
    let skills;
    try {
      const parsed = JSON.parse(skillsText);
      skills = Array.isArray(parsed) ? parsed : parsed.skills || [];
    } catch {
      skills = [];
    }

    return new Response(JSON.stringify({ skills }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-skills function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});