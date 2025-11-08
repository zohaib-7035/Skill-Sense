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
    const { userSkills, targetRole } = await req.json();
    console.log('Received request - Skills count:', userSkills?.length, 'Target role:', targetRole?.role_title);
    
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not configured');
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    if (!userSkills || !Array.isArray(userSkills)) {
      return new Response(JSON.stringify({ error: 'Invalid userSkills format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!targetRole || !targetRole.role_title) {
      return new Response(JSON.stringify({ error: 'Invalid targetRole format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a career development expert. Analyze the gap between a user's current skills and a target job role.

Compare the user's skills with the job requirements and identify:
1. Matching skills (skills the user has that align with the role)
2. Missing skills (skills required for the role that the user lacks)
3. Specific learning recommendations for each missing skill`;

    const userMessage = `User's Skills: ${userSkills.map((s: any) => s.skill_name || s).join(', ')}

Target Role: ${targetRole.role_title}
Job Description: ${targetRole.role_description || 'No description provided'}

Please analyze the skill gap and provide recommendations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${userMessage}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              matching_skills: {
                type: "array",
                items: { type: "string" }
              },
              missing_skills: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    skill: { type: "string" },
                    resources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          url: { type: "string" },
                          type: { type: "string" }
                        },
                        required: ["title", "url", "type"]
                      }
                    },
                    practice_suggestion: { type: "string" }
                  },
                  required: ["skill", "resources", "practice_suggestion"]
                }
              }
            },
            required: ["matching_skills", "missing_skills", "recommendations"]
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

    let analysis: any = { matching_skills: [], missing_skills: [], recommendations: [] };

    try {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        analysis = JSON.parse(content);
        console.log('Parsed analysis successfully');
      }
    } catch (e) {
      console.error('Parsing failure:', e);
    }

    // Validate structure
    if (!Array.isArray(analysis.matching_skills)) analysis.matching_skills = [];
    if (!Array.isArray(analysis.missing_skills)) analysis.missing_skills = [];
    if (!Array.isArray(analysis.recommendations)) analysis.recommendations = [];

    console.log('Final analysis - Matching:', analysis.matching_skills.length, 'Missing:', analysis.missing_skills.length, 'Recommendations:', analysis.recommendations.length);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-gap function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});