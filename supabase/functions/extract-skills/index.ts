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
    console.log('Received text length:', text?.length || 0);
    
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      console.log('Empty text received');
      return new Response(JSON.stringify({ skills: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const skillClusters = [
      "Programming & Development",
      "Data & Analytics", 
      "Design & UX",
      "Management & Leadership",
      "Communication & Collaboration",
      "Cloud & Infrastructure",
      "Security & Compliance",
      "Marketing & Sales",
      "Product & Strategy",
      "Other"
    ];

    const systemPrompt = `You are an AI skill extraction expert. Analyze the provided text and extract both explicit and implicit professional skills.

For each skill identified, provide:
1. skill_name: The name of the skill
2. skill_type: Either "explicit" (directly mentioned) or "implicit" (inferred from context)
3. confidence_score: A number between 0 and 1 indicating confidence
4. evidence: An array of text snippets from the original text that support this skill
5. cluster: Categorize the skill into one of these clusters: ${skillClusters.join(', ')}
6. microstory: A brief 1-2 sentence story showing how this skill was demonstrated in the text
7. state: Set to "locked" if confidence < 0.5, otherwise "unlocked"

Extract a comprehensive list of skills including:
- Technical skills (programming languages, tools, frameworks)
- Soft skills (leadership, communication, teamwork)
- Domain knowledge (industry-specific expertise)
- Methodologies (Agile, DevOps, etc.)

Return ONLY the skills array, nothing else.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nAnalyze this text and extract skills:\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              skills: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    skill_name: { type: "string" },
                    skill_type: { type: "string", enum: ['explicit', 'implicit'] },
                    confidence_score: { type: "number" },
                    evidence: {
                      type: "array",
                      items: { type: "string" }
                    },
                    cluster: { type: "string" },
                    microstory: { type: "string" },
                    state: { type: "string", enum: ['locked', 'unlocked'] }
                  },
                  required: ['skill_name', 'skill_type', 'confidence_score', 'evidence', 'cluster', 'microstory', 'state']
                }
              }
            },
            required: ['skills']
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI processing failed', details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Gemini response received:', JSON.stringify(data).substring(0, 300));

    let skills: any[] = [];

    try {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        skills = Array.isArray(parsed.skills) ? parsed.skills : [];
        console.log('Parsed skills count:', skills.length);
      }
    } catch (e) {
      console.error('Parsing failure:', e);
    }

    // Normalize and validate
    skills = (skills || []).filter(Boolean).map((s: any) => {
      const name = String(s.skill_name ?? s.name ?? '').trim();
      const type = (s.skill_type === 'implicit' || s.skill_type === 'explicit') ? s.skill_type : 'explicit';
      let score = Number(s.confidence_score ?? s.confidence ?? 0.8);
      if (Number.isNaN(score)) score = 0.8;
      score = Math.max(0, Math.min(1, score));
      let evidence = Array.isArray(s.evidence) ? s.evidence : [];
      evidence = evidence.filter((e: any) => typeof e === 'string' && e.trim()).slice(0, 3);
      const cluster = s.cluster || 'Other';
      const microstory = String(s.microstory || 'No story available').trim();
      const state = s.state || (score < 0.5 ? 'locked' : 'unlocked');
      return { 
        skill_name: name, 
        skill_type: type, 
        confidence_score: score, 
        evidence,
        cluster,
        microstory,
        state
      };
    }).filter((s: any) => s.skill_name);

    console.log('Final skills array length:', skills.length);

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