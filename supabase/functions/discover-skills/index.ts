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
    const { existingSkills, profileId } = await req.json();
    console.log(`Analyzing ${existingSkills.length} skills for hidden skill discovery`);

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Group skills by cluster for better context
    const skillsByCluster: Record<string, any[]> = {};
    existingSkills.forEach((skill: any) => {
      const cluster = skill.cluster || 'general';
      if (!skillsByCluster[cluster]) skillsByCluster[cluster] = [];
      skillsByCluster[cluster].push(skill);
    });

    const systemPrompt = `You are an expert career analyst specializing in skill inference and transferable competency discovery.

Your task is to analyze a person's existing skills and discover HIDDEN or TRANSFERABLE skills that they likely possess but haven't explicitly stated.

INSTRUCTIONS:
1. Look for skill patterns, combinations, and relationships
2. Infer transferable skills from clusters of related skills
3. Identify meta-skills (e.g., if someone has multiple programming languages, they likely have "rapid technology adoption")
4. Consider soft skills implied by technical competencies
5. Only suggest skills with high confidence (>0.6)
6. Provide clear reasoning for each inference
7. Return 5-15 discovered skills maximum

EXAMPLES:
- If user has "Python", "JavaScript", "Go" → infer "Polyglot Programming" or "Cross-language Architecture"
- If user has "Team Leadership" + "Project Management" → infer "Strategic Planning"
- If user has "React", "Vue", "Angular" → infer "Frontend Framework Expertise"
- If user has "AWS", "Docker", "Kubernetes" → infer "Cloud-Native Architecture"`;

    const userMessage = `Analyze these existing skills and discover hidden/transferable skills:

EXISTING SKILLS BY CLUSTER:
${Object.entries(skillsByCluster).map(([cluster, skills]) => `
${cluster.toUpperCase()}:
${skills.map(s => `  - ${s.skill_name} (confidence: ${s.confidence_score}, type: ${s.skill_type})`).join('\n')}
`).join('\n')}

Return discovered skills as JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userMessage}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                discovered_skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill_name: { type: "string" },
                      confidence_score: { type: "number" },
                      inferred_from: {
                        type: "array",
                        items: { type: "string" }
                      },
                      reasoning: { type: "string" }
                    },
                    required: ["skill_name", "confidence_score", "inferred_from", "reasoning"]
                  }
                }
              },
              required: ["discovered_skills"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(text);
    const discoveredSkills = parsed.discovered_skills || [];

    // Validate and filter
    const validSkills = discoveredSkills.filter((skill: any) => 
      skill.confidence_score >= 0.6 && 
      skill.skill_name && 
      skill.reasoning &&
      skill.inferred_from?.length > 0
    );

    console.log(`Discovered ${validSkills.length} hidden skills`);

    return new Response(
      JSON.stringify({ discovered_skills: validSkills }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in discover-skills function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
