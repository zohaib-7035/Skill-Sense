import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  topics: string[];
  languages_url: string;
}

interface GitHubCommit {
  commit: {
    message: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { githubUsername, githubToken } = await req.json();
    console.log(`Extracting skills from GitHub for user: ${githubUsername}`);

    if (!githubUsername) {
      throw new Error('GitHub username is required');
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SkillSense-App'
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    // Fetch user's repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=30`,
      { headers }
    );

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error('GitHub API error:', reposResponse.status, errorText);
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repos: GitHubRepo[] = await reposResponse.json();
    console.log(`Found ${repos.length} repositories`);

    // Aggregate data from repositories
    const languagesUsed = new Set<string>();
    const topics = new Set<string>();
    const descriptions: string[] = [];
    const readmeContents: string[] = [];
    const commitMessages: string[] = [];

    // Process each repository
    for (const repo of repos.slice(0, 15)) { // Limit to 15 repos to avoid rate limits
      // Collect languages
      if (repo.language) languagesUsed.add(repo.language);
      
      // Collect topics
      repo.topics?.forEach(topic => topics.add(topic));
      
      // Collect descriptions
      if (repo.description) descriptions.push(repo.description);

      // Fetch detailed language breakdown
      try {
        const langResponse = await fetch(repo.languages_url, { headers });
        if (langResponse.ok) {
          const languages = await langResponse.json();
          Object.keys(languages).forEach(lang => languagesUsed.add(lang));
        }
      } catch (err) {
        console.error(`Error fetching languages for ${repo.name}:`, err);
      }

      // Fetch README
      try {
        const readmeResponse = await fetch(
          `https://api.github.com/repos/${githubUsername}/${repo.name}/readme`,
          { headers }
        );
        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          const readmeContent = atob(readmeData.content); // Decode base64
          readmeContents.push(readmeContent.slice(0, 2000)); // Limit size
        }
      } catch (err) {
        console.error(`Error fetching README for ${repo.name}:`, err);
      }

      // Fetch recent commits (max 10 per repo)
      try {
        const commitsResponse = await fetch(
          `https://api.github.com/repos/${githubUsername}/${repo.name}/commits?per_page=10`,
          { headers }
        );
        if (commitsResponse.ok) {
          const commits: GitHubCommit[] = await commitsResponse.json();
          commits.forEach(commit => {
            if (commit.commit.message) {
              commitMessages.push(commit.commit.message);
            }
          });
        }
      } catch (err) {
        console.error(`Error fetching commits for ${repo.name}:`, err);
      }
    }

    console.log(`Aggregated: ${languagesUsed.size} languages, ${topics.size} topics, ${readmeContents.length} READMEs, ${commitMessages.length} commits`);

    // Prepare context for AI
    const contextText = `
GITHUB PROFILE ANALYSIS FOR: ${githubUsername}

PROGRAMMING LANGUAGES USED:
${Array.from(languagesUsed).join(', ')}

REPOSITORY TOPICS/TAGS:
${Array.from(topics).join(', ')}

PROJECT DESCRIPTIONS:
${descriptions.slice(0, 20).join('\n')}

SAMPLE README CONTENT:
${readmeContents.slice(0, 5).join('\n---\n')}

SAMPLE COMMIT MESSAGES:
${commitMessages.slice(0, 30).join('\n')}
`;

    // Use Gemini to extract skills
    const systemPrompt = `You are an expert technical skill analyzer specializing in GitHub profile analysis.

Analyze the provided GitHub data and extract professional technical skills. Look for:
1. Programming languages and frameworks
2. Development tools and technologies
3. Architecture patterns and methodologies
4. Domain expertise (web dev, mobile, data science, DevOps, etc.)
5. Soft skills implied by commit messages and project types
6. Cloud platforms and infrastructure tools

Be comprehensive but accurate. Assign confidence scores based on:
- High (0.8-1.0): Languages/tools used extensively across multiple repos
- Medium (0.5-0.7): Technologies mentioned in READMEs or used occasionally
- Low (0.3-0.4): Implied skills or minor mentions

Return skills with evidence from the GitHub data.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${contextText}\n\nExtract skills from this GitHub profile data.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3048,
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
                      skill_type: { 
                        type: "string",
                        enum: ["explicit", "implicit"]
                      },
                      confidence_score: { type: "number" },
                      evidence: {
                        type: "array",
                        items: { type: "string" }
                      },
                      cluster: { type: "string" },
                      microstory: { type: "string" },
                      state: {
                        type: "string",
                        enum: ["unlocked", "locked"]
                      }
                    },
                    required: ["skill_name", "skill_type", "confidence_score", "evidence", "cluster", "state"]
                  }
                }
              },
              required: ["skills"]
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(text);
    const skills = parsed.skills || [];

    // Normalize and validate skills
    const normalizedSkills = skills.map((skill: any) => ({
      skill_name: skill.skill_name || 'Unknown',
      skill_type: skill.skill_type || 'explicit',
      confidence_score: Math.min(Math.max(skill.confidence_score || 0.5, 0), 1),
      evidence: Array.isArray(skill.evidence) ? skill.evidence.slice(0, 5) : [],
      cluster: skill.cluster || 'Technical',
      microstory: skill.microstory || `Extracted from GitHub profile @${githubUsername}`,
      state: skill.confidence_score >= 0.5 ? 'unlocked' : 'locked'
    }));

    console.log(`Extracted ${normalizedSkills.length} skills from GitHub`);

    return new Response(
      JSON.stringify({ 
        skills: normalizedSkills,
        metadata: {
          repositories_analyzed: repos.length,
          languages_found: languagesUsed.size,
          topics_found: topics.size
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in github-skill-extract function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
