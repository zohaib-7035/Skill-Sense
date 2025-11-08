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
    console.log('Received request - Skills count:', skills?.length, 'Text length:', originalText?.length);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!skills || !Array.isArray(skills)) {
      return new Response(JSON.stringify({ error: 'Invalid skills format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!originalText || originalText.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Original text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a professional CV writer. Based on the user's original content and discovered skills, generate suggestions to enhance their CV.

Provide:
1. A professional summary highlighting key strengths
2. Skill-based categories and recommendations
3. Experience improvements that showcase skills effectively`;

    const skillsList = skills.map((s: any) => `${s.skill_name} (${s.skill_type})`).join(', ');
    const userMessage = `Skills discovered: ${skillsList}

Original CV content: ${originalText.substring(0, 3000)}

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
        tools: [
          {
            type: 'function',
            function: {
              name: 'enhance_cv',
              description: 'Return CV enhancement suggestions with professional summary, skills, and experience improvements.',
              parameters: {
                type: 'object',
                properties: {
                  professional_summary: {
                    type: 'string',
                    description: 'A compelling 2-3 sentence professional summary'
                  },
                  enhanced_skills_section: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Categorized skill groupings'
                  },
                  experience_improvements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        original: { type: 'string' },
                        enhanced: { type: 'string' }
                      },
                      required: ['original', 'enhanced']
                    },
                    description: 'Original vs enhanced experience bullets'
                  },
                  additional_suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'General CV improvement tips'
                  }
                },
                required: ['professional_summary', 'enhanced_skills_section', 'experience_improvements', 'additional_suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'enhance_cv' } }
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
    console.log('AI response received:', JSON.stringify(data).substring(0, 300));

    let suggestions: any = {
      professional_summary: '',
      enhanced_skills_section: [],
      experience_improvements: [],
      additional_suggestions: []
    };

    try {
      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;
      
      const toolCall = toolCalls?.find((t: any) => t.type === 'function' && t.function?.name === 'enhance_cv');
      if (toolCall?.function?.arguments) {
        console.log('Parsing tool call arguments...');
        suggestions = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: parse content
        const content = choice?.message?.content as string;
        if (content) {
          const clean = (s: string) => s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          let cleaned = clean(content);
          try {
            suggestions = JSON.parse(cleaned);
          } catch (_) {
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
              const maybe = content.slice(start, end + 1);
              suggestions = JSON.parse(clean(maybe));
            }
          }
        }
      }
    } catch (e) {
      console.error('Parsing failure:', e);
    }

    // Validate structure
    if (typeof suggestions.professional_summary !== 'string') suggestions.professional_summary = '';
    if (!Array.isArray(suggestions.enhanced_skills_section)) suggestions.enhanced_skills_section = [];
    if (!Array.isArray(suggestions.experience_improvements)) suggestions.experience_improvements = [];
    if (!Array.isArray(suggestions.additional_suggestions)) suggestions.additional_suggestions = [];

    console.log('Final suggestions - Summary length:', suggestions.professional_summary.length, 'Skills:', suggestions.enhanced_skills_section.length, 'Improvements:', suggestions.experience_improvements.length);

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