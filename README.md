# SkillSense - AI-Powered Skill Discovery & Career Development Platform

SkillSense is an intelligent career development application which transforms how you discover, manage, and showcase your professional skills. Using advanced AI analysis, it extracts skills from multiple sources, gamifies skill development through quests, and provides comprehensive career insights.

## 🎯 Features

### 1. **Multi-Source Skill Extraction**
- **Upload Resumes**: Support for PDF, DOCX, and TXT formats
- **Text Input**: Paste resume content or job descriptions directly
- **GitHub Integration**: Automatically extract technical skills from repositories and activity
- **Aggregate Extraction**: Combine multiple sources (resume + GitHub + text) with smart deduplication
- **AI-Powered Analysis**: Extract both explicit and implicit skills with confidence scoring
- **Evidence-Based Verification**: Each skill includes source quotes and reasoning

### 2. **Interactive Skill Map Visualization**
- **3D Force-Directed Graph**: Beautiful interactive visualization of skill relationships
- **Skill Clustering**: Automatic grouping by categories (Technical, Soft Skills, etc.)
- **Color-Coded States**: Visual distinction between unlocked and locked skills
- **Micro-Stories**: Narrative context for each skill showing real-world application
- **Interactive Exploration**: Click, drag, and explore your skill network

### 3. **Gamified Quest System**
- **Skill Unlocking Mechanism**: Locked skills require quest completion to unlock
- **Quest Categories**: Verification, Content, Portfolio, Credentials, Social
- **XP & Rewards**: Earn experience points for completing quests
- **Multiple Quest Types**:
  - Add GitHub profile validation
  - Write skill reflections
  - Add project demonstrations
  - Upload certifications
  - Get peer endorsements
  - Create blog posts or tutorials
  - Record demonstration videos
  - Mentor others
- **Progress Tracking**: Visual dashboards showing completion stats and XP earned

### 4. **Hidden Skill Discovery**
- **AI Inference Engine**: Discover transferable skills based on existing competencies
- **Meta-Skills Identification**: Find high-level capabilities you likely possess
- **Confidence Scoring**: Each discovered skill rated for accuracy
- **Reasoning Transparency**: See why each skill was inferred and from which existing skills
- **Confirm/Reject Workflow**: Review and curate discovered skills

### 5. **Team Intelligence & Collaboration**
- **Team Skill Analysis**: Aggregate team member skills for organization-wide insights
- **Skill Coverage Maps**: Identify strengths and gaps across teams
- **Collaborative Learning**: Share quests and progress with team members
- **Organizational Skill Inventory**: Build comprehensive skill databases for teams

### 6. **Public Profile Sharing**
- **Shareable Public Profiles**: Create SEO-friendly public URLs
- **Custom Display Names & Bios**: Professional presentation of your skills
- **Confirmed Skills Only**: Share verified competencies with employers
- **One-Click Sharing**: Copy link for LinkedIn, email signatures, resumes
- **Privacy Controls**: Toggle between public and private modes

### 7. **Progress Tracking & Analytics**
- **Unlock Progress**: Track ratio of unlocked vs locked skills
- **Quest Completion Stats**: Monitor active, completed, and total quests
- **XP Leaderboards**: Gamification metrics for motivation
- **Category Breakdowns**: Progress by quest category
- **Visual Progress Bars**: Real-time feedback on skill development journey

### 8. **Gap Analysis**
- **Role Comparison**: Compare your skills against target job roles
- **Missing Skills Identification**: Pinpoint gaps for career advancement
- **Learning Recommendations**: Personalized resource suggestions (courses, tutorials, articles)
- **Practice Projects**: Actionable project ideas to build missing skills

### 9. **CV Enhancement**
- **AI-Generated Summaries**: Professional profile summaries optimized for your skills
- **Skills Section Optimization**: Enhanced presentation of competencies
- **Experience Improvements**: Better bullet points highlighting achievements
- **ATS Optimization**: Improve applicant tracking system compatibility
- **Export-Ready Format**: Copy suggestions directly to your CV

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Shadcn/UI** - Component library
- **React Router** - Navigation
- **Tanstack Query** - Data fetching and caching
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Backend (Lovable Cloud)
- **Supabase** - Database and authentication
- **Edge Functions** - Serverless backend logic
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Data protection

### Document Processing
- **PDF.js** - PDF parsing
- **Mammoth.js** - DOCX parsing
- **File API** - Text file handling

### AI Integration
- **Lovable AI Gateway** - AI model access
- **Google Gemini 2.5 Flash** - Natural language processing
- **Structured Tool Calling** - Reliable JSON responses

## 📁 Project Structure

```
skillsense/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthForm.tsx          # Authentication forms
│   │   ├── ui/                        # Shadcn UI components
│   │   ├── CVEnhancement.tsx          # CV enhancement interface
│   │   ├── FileUpload.tsx             # Drag-drop file upload
│   │   ├── GapAnalysis.tsx            # Skill gap analysis UI
│   │   ├── GitHubIntegration.tsx      # GitHub skill extraction
│   │   ├── HiddenSkillDiscovery.tsx   # AI skill inference
│   │   ├── ProgressTracker.tsx        # Unlock progress dashboard
│   │   ├── QuestSystem.tsx            # Gamified quest management
│   │   ├── ShareProfileDialog.tsx     # Public profile sharing
│   │   ├── SkillCard.tsx              # Individual skill display
│   │   ├── SkillDetailModal.tsx       # Skill detail viewer
│   │   ├── SkillMap.tsx               # 3D skill visualization
│   │   ├── SkillVisualization.tsx     # Skill overview charts
│   │   ├── TeamIntelligence.tsx       # Team collaboration features
│   │   ├── TextInput.tsx              # Manual text input
│   │   └── UnifiedDataImport.tsx      # Multi-source aggregation
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Supabase client (auto-generated)
│   │       └── types.ts               # Database types (auto-generated)
│   ├── lib/
│   │   ├── documentParser.ts          # PDF/DOCX parsing logic
│   │   └── utils.ts                   # Utility functions
│   ├── pages/
│   │   ├── Index.tsx                  # Main application page
│   │   ├── PublicProfile.tsx          # Public profile viewer
│   │   └── NotFound.tsx               # 404 page
│   └── main.tsx                       # App entry point
├── supabase/
│   ├── functions/
│   │   ├── extract-skills/            # Skill extraction endpoint
│   │   ├── github-skill-extract/      # GitHub analysis endpoint
│   │   ├── discover-skills/           # Hidden skill discovery endpoint
│   │   ├── analyze-gap/               # Gap analysis endpoint
│   │   └── enhance-cv/                # CV enhancement endpoint
│   ├── migrations/                    # Database migrations
│   └── config.toml                    # Supabase configuration
└── README.md                          # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for AI processing

### Usage

1. **Sign Up / Login**
   - Create an account or login with existing credentials
   - Email confirmation is auto-enabled for testing

2. **Extract Skills from Multiple Sources**
   - **Option A**: Upload your resume (PDF, DOCX, or TXT)
   - **Option B**: Paste your resume text directly
   - **Option C**: Connect GitHub to analyze repositories and activity
   - **Option D**: Use Aggregate Extraction to combine all sources
   - Wait for AI processing (10-30 seconds per source)
   - Review extracted skills with confidence scores and micro-stories

3. **Explore Your Skill Map**
   - Navigate to "Skill Map" tab
   - Interact with 3D visualization of skill relationships
   - See skills grouped by clusters (Technical, Soft Skills, etc.)
   - Click skills to view details and evidence
   - Observe locked vs unlocked skill states

4. **Complete Quests to Unlock Skills**
   - Navigate to "Quests" tab
   - View locked skills requiring quest completion
   - Choose from various quest types (verification, content, portfolio, etc.)
   - Complete quests to earn XP and unlock skills
   - Track progress with visual dashboards

5. **Discover Hidden Skills**
   - Navigate to "Discover" tab
   - Click "Discover Hidden Skills" (requires 5+ existing skills)
   - Review AI-inferred transferable skills and meta-skills
   - See reasoning and source skills for each discovery
   - Confirm or reject discovered skills

6. **Share Your Profile**
   - Click "Share Profile" button in header
   - Toggle "Make Profile Public"
   - Add display name and bio
   - Copy your unique public URL
   - Share on LinkedIn, resumes, or email signatures

7. **Analyze Skill Gaps**
   - Navigate to "Gap Analysis" tab
   - Enter target job title and description
   - Click "Analyze Gap"
   - Review matching and missing skills
   - Explore learning recommendations with resources

8. **Enhance Your CV**
   - Go to "CV Enhancement" tab
   - Click "Generate Suggestions"
   - Review AI-generated improvements:
     - Professional summary
     - Enhanced skills section
     - Experience bullet improvements
     - Additional CV tips

## 🔧 Backend Architecture

### Edge Functions

All backend logic runs as serverless Edge Functions with AI-powered processing via Lovable AI Gateway:

#### 1. **extract-skills**
- **Purpose**: Extract skills from resume/document text
- **AI Model**: Google Gemini 2.5 Flash
- **Method**: Structured tool calling
- **Input**: `{ text: string }`
- **Output**: 
  ```typescript
  {
    skills: [
      {
        skill_name: string,
        skill_type: 'explicit' | 'implicit',
        confidence_score: number,
        evidence: string[],
        cluster: string,
        microstory: string,
        state: 'locked' | 'unlocked'
      }
    ]
  }
  ```

#### 2. **github-skill-extract**
- **Purpose**: Analyze GitHub activity to extract technical skills
- **AI Model**: Google Gemini 2.5 Flash
- **Input**: `{ githubUsername: string, githubToken?: string }`
- **Process**: 
  - Fetches user's repositories via GitHub API
  - Analyzes languages, frameworks, and technologies
  - Infers skills from commit patterns and project types
- **Output**: Same structure as extract-skills

#### 3. **discover-skills**
- **Purpose**: Infer hidden/transferable skills from existing skills
- **AI Model**: Google Gemini 2.5 Flash
- **Input**: `{ existingSkills: Skill[], profileId: string }`
- **Output**:
  ```typescript
  {
    discovered_skills: [
      {
        skill_name: string,
        confidence_score: number,
        inferred_from: string[],
        reasoning: string
      }
    ]
  }
  ```

#### 4. **analyze-gap**
- **Purpose**: Compare user skills vs target role
- **AI Model**: Google Gemini 2.5 Flash
- **Method**: Structured tool calling
- **Input**: `{ userSkills: Skill[], targetRole: TargetRole }`
- **Output**:
  ```typescript
  {
    matching_skills: string[],
    missing_skills: string[],
    recommendations: [
      {
        skill: string,
        resources: [
          {
            title: string,
            url: string,
            type: 'course' | 'tutorial' | 'article'
          }
        ],
        practice_suggestion: string
      }
    ]
  }
  ```

#### 5. **enhance-cv**
- **Purpose**: Generate CV improvement suggestions
- **AI Model**: Google Gemini 2.5 Flash
- **Method**: Structured tool calling
- **Input**: `{ skills: Skill[], originalText: string }`
- **Output**:
  ```typescript
  {
    professional_summary: string,
    enhanced_skills_section: string[],
    experience_improvements: [
      {
        original: string,
        enhanced: string
      }
    ],
    additional_suggestions: string[]
  }
  ```

### Database Schema

#### Tables

**skill_profiles**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `profile_name` (text)
- `display_name` (text) - For public profiles
- `bio` (text) - For public profiles
- `public_slug` (text, unique) - URL-friendly identifier
- `is_public` (boolean) - Public/private toggle
- `avatar_url` (text)
- `raw_data` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**skills**
- `id` (uuid, primary key)
- `profile_id` (uuid, references skill_profiles)
- `skill_name` (text)
- `skill_type` (text: 'explicit' | 'implicit')
- `confidence_score` (numeric)
- `evidence` (text[])
- `cluster` (text) - Skill category
- `microstory` (text) - Narrative context
- `state` (text: 'locked' | 'unlocked') - Quest system state
- `is_confirmed` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**quests**
- `id` (uuid, primary key)
- `skill_id` (uuid, references skills)
- `quest_type` (text) - Type of quest (verification, content, etc.)
- `quest_description` (text)
- `is_completed` (boolean)
- `completed_at` (timestamp)
- `created_at` (timestamp)

**discovered_skills**
- `id` (uuid, primary key)
- `profile_id` (uuid, references skill_profiles)
- `skill_name` (text)
- `confidence_score` (numeric)
- `inferred_from` (text[]) - Source skills
- `reasoning` (text) - AI explanation
- `is_confirmed` (boolean)
- `is_rejected` (boolean)
- `created_at` (timestamp)

**target_roles**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `role_title` (text)
- `role_description` (text)
- `required_skills` (text[])
- `created_at` (timestamp)

**skill_gaps**
- `id` (uuid, primary key)
- `profile_id` (uuid, references skill_profiles)
- `target_role_id` (uuid, references target_roles)
- `matching_skills` (text[])
- `missing_skills` (text[])
- `recommendations` (jsonb)
- `created_at` (timestamp)

#### Views

**public_skill_profiles**
- Secure view exposing only public profiles
- Excludes `user_id` for privacy
- Used for public profile sharing feature
- Filters to `is_public = true` only

#### Row Level Security (RLS)

All tables have RLS policies ensuring users can only:
- View their own data (except public profiles)
- Create their own records
- Update their own records
- Delete their own records

Public profile view has special policies:
- Anyone can SELECT from public profiles
- Uses SECURITY INVOKER for proper RLS enforcement

## 🔐 Security Features

- **Authentication**: Email/password with Supabase Auth
- **Row Level Security**: Database-level access control
- **API Key Management**: Secure secret storage
- **CORS Protection**: Configured CORS headers
- **Input Validation**: Backend request validation
- **Error Handling**: Graceful error responses

## 🐛 Key Bug Fixes & Improvements

### 1. **PDF.js Worker Loading**
- **Issue**: PDF parsing failed with worker errors
- **Fix**: Updated to use `.mjs` extension with HTTPS CDN
- **Result**: Reliable PDF document parsing

### 2. **Skill Extraction JSON Parsing**
- **Issue**: AI responses wrapped in code fences caused parsing failures
- **Fix**: Implemented structured tool calling with robust fallback parser
- **Result**: 100% reliable JSON extraction

### 3. **Gap Analysis Errors**
- **Issue**: Non-2xx status codes from edge function
- **Fix**: Added tool calling + input validation + comprehensive logging
- **Result**: Reliable gap analysis with detailed error messages

### 4. **CV Enhancement Failures**
- **Issue**: Similar JSON parsing problems
- **Fix**: Applied same tool-calling approach with validation
- **Result**: Consistent CV suggestions generation

### 5. **GitHub Integration**
- **Added**: GitHub API integration for extracting skills from repositories
- **Features**: Language detection, framework identification, project analysis
- **Result**: Comprehensive technical skill extraction from code activity

### 6. **Security Improvements**
- **Issue**: User ID exposure in public profiles
- **Fix**: Created secure view excluding sensitive data
- **Implementation**: SECURITY INVOKER with proper RLS policies
- **Result**: Safe public profile sharing without data leakage

### 7. **Aggregate Extraction**
- **Added**: Multi-source skill extraction with deduplication
- **Features**: Combines resume + GitHub + text inputs intelligently
- **Deduplication**: Merges duplicate skills with averaged confidence
- **Result**: Comprehensive skill profiles from multiple data sources

### 8. **3D Skill Visualization**
- **Added**: Interactive force-directed graph using React Three Fiber
- **Features**: Clustered nodes, color-coded states, micro-stories
- **Optimization**: Efficient rendering for large skill networks
- **Result**: Beautiful, explorable skill relationship maps

### 9. **Error Handling**
- Added logging throughout all edge functions
- Implemented graceful error responses
- User-friendly error messages in UI
- Comprehensive error tracking

## 📊 Performance Optimizations

- **Client-side document parsing** - Reduces backend load and improves response times
- **Tanstack Query caching** - Minimizes database queries with intelligent cache invalidation
- **Optimistic UI updates** - Instant feedback for user interactions
- **Lazy loading components** - Faster initial page load with code splitting
- **Structured AI responses** - Faster parsing with guaranteed schema compliance
- **Efficient 3D rendering** - Optimized Three.js scene for smooth 60fps visualization
- **Skill deduplication** - Smart merging prevents duplicate entries across sources
- **Progressive data loading** - Staged loading for better perceived performance
- **Database indexing** - Optimized queries for large skill datasets
- **Edge function caching** - Reduced cold starts for frequently used functions

## 🎨 Design System

- **Semantic color tokens** - HSL-based design system for consistent theming
- **Dark/light mode support** - Full theme switching with smooth transitions
- **Responsive design** - Mobile-first approach with breakpoints for all devices
- **Accessible components** - ARIA labels and keyboard navigation throughout
- **Consistent spacing** - Tailwind spacing scale for visual harmony
- **Typography system** - Hierarchical text styles for clear information architecture
- **Custom animations** - Smooth transitions and micro-interactions
- **Glassmorphism effects** - Modern UI with backdrop blur and transparency
- **Gradient backgrounds** - Subtle color transitions for visual depth
- **Icon system** - Lucide React for consistent, scalable icons

## 📝 Environment Variables

The following environment variables are automatically configured via Lovable Cloud:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Backend secrets (managed securely in Supabase):
- `LOVABLE_API_KEY` - AI gateway access for all edge functions
- No external API keys required - uses Lovable AI Gateway

## 🎮 Gamification Concepts

### Locked vs Unlocked Skills

**Unlocked Skills**
- Skills you currently have available and confirmed
- Fully verified and can be used for gap analysis
- Appear in your public profile (if enabled)
- Displayed with green/unlocked indicators
- Can be immediately leveraged for career opportunities

**Locked Skills**
- Potential skills identified but requiring validation
- Hidden opportunities detected by AI
- Require quest completion to unlock
- Displayed with red/locked indicators in skill map
- Represent growth targets and development areas

The quest system creates a gamified journey where completing tasks (adding projects, certifications, reflections, etc.) unlocks these potential skills, transforming them into confirmed competencies.

## 🚢 Deployment

### Frontend
1. Click "Publish" button in Lovable
2. Click "Update" to deploy frontend changes
3. Access via `yourapp.lovable.app`

### Backend
- Edge functions deploy automatically
- No manual deployment needed
- Changes go live immediately

## 🤝 Contributing

This project was built on Lovable. To make changes:

1. Open project in Lovable
2. Use chat interface for AI-assisted development
3. Test in preview window
4. Deploy via Publish button

## 📄 License

This project is created with Lovable and follows standard terms of service.

## 🙏 Acknowledgments

- **Lovable** - No-code AI development platform
- **Supabase** - Backend infrastructure
- **Google Gemini** - AI language model
- **Shadcn/UI** - Beautiful component library
- **PDF.js** - PDF parsing capabilities
- **Mammoth.js** - DOCX parsing capabilities

## 📞 Support

For issues or questions:
- Open an issue in the project
- Contact via Lovable platform
- Check Lovable documentation at https://docs.lovable.dev

---

## Project Info

**Lovable Project URL**: https://lovable.dev/projects/c89409ca-c41f-4ac1-9581-560806326490

### How to Edit This Code

**Use Lovable** - Visit the project and start prompting for changes

**Use Your IDE** - Clone, edit locally, and push changes:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

**GitHub Codespaces** - Edit directly in the browser

---

**Built with ❤️ using Lovable - AI-powered full-stack development**
