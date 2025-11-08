# SkillSense - AI-Powered Skill Discovery & Career Development Platform

SkillSense is an intelligent career development application that analyzes resumes and documents to extract both explicit and implicit skills, perform gap analysis against target roles, and provide personalized CV enhancement recommendations.

## 🎯 Features

### 1. **Skill Extraction**
- Upload resumes (PDF, DOCX, TXT) or paste text directly
- AI-powered extraction of both explicit and implicit skills
- Confidence scoring for each identified skill
- Evidence-based skill verification with source quotes
- Visual skill categorization (explicit vs implicit)

### 2. **Skill Profile Management**
- Interactive skill cards with evidence display
- Manual skill confirmation/removal
- Real-time skill visualization
- Export skills to JSON format
- Persistent storage across sessions

### 3. **Gap Analysis**
- Compare your skills against target job roles
- Identify matching and missing skills
- Get personalized learning recommendations
- Resource suggestions (courses, tutorials, articles)
- Practice project ideas for skill development

### 4. **CV Enhancement**
- AI-generated professional summaries
- Enhanced skills section with categorization
- Experience bullet point improvements
- Additional CV writing suggestions
- Skills-focused content optimization

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
│   │   │   └── AuthForm.tsx          # Login/signup forms
│   │   ├── ui/                        # Shadcn UI components
│   │   ├── CVEnhancement.tsx          # CV enhancement interface
│   │   ├── FileUpload.tsx             # Drag-drop file upload
│   │   ├── GapAnalysis.tsx            # Skill gap analysis UI
│   │   ├── SkillCard.tsx              # Individual skill display
│   │   ├── SkillVisualization.tsx     # Skill overview charts
│   │   └── TextInput.tsx              # Manual text input
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Supabase client (auto-generated)
│   │       └── types.ts               # Database types (auto-generated)
│   ├── lib/
│   │   ├── documentParser.ts          # PDF/DOCX parsing logic
│   │   └── utils.ts                   # Utility functions
│   ├── pages/
│   │   ├── Index.tsx                  # Main application page
│   │   └── NotFound.tsx               # 404 page
│   └── main.tsx                       # App entry point
├── supabase/
│   ├── functions/
│   │   ├── extract-skills/            # Skill extraction endpoint
│   │   ├── analyze-gap/               # Gap analysis endpoint
│   │   └── enhance-cv/                # CV enhancement endpoint
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

2. **Extract Skills**
   - **Option A**: Upload your resume (PDF, DOCX, or TXT)
   - **Option B**: Paste your resume text directly
   - Wait for AI processing (10-30 seconds)
   - Review extracted skills with confidence scores

3. **Manage Your Skills**
   - View skills categorized as explicit or implicit
   - Click skill cards to see evidence quotes
   - Confirm accurate skills (green checkmark)
   - Remove irrelevant skills (red X)
   - Export your skill profile as JSON

4. **Analyze Skill Gaps**
   - Navigate to "Gap Analysis" tab
   - Enter target job title and description
   - Click "Analyze Gap"
   - Review matching and missing skills
   - Explore learning recommendations with resources

5. **Enhance Your CV**
   - Go to "CV Enhancement" tab
   - Click "Generate Suggestions"
   - Review AI-generated improvements:
     - Professional summary
     - Enhanced skills section
     - Experience bullet improvements
     - Additional CV tips

## 🔧 Backend Architecture

### Edge Functions

All backend logic runs as serverless Supabase Edge Functions with AI-powered processing:

#### 1. **extract-skills**
- **Purpose**: Extract skills from resume text
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
        evidence: string[]
      }
    ]
  }
  ```

#### 2. **analyze-gap**
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

#### 3. **enhance-cv**
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
- `is_confirmed` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

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

#### Row Level Security (RLS)

All tables have RLS policies ensuring users can only:
- View their own data
- Create their own records
- Update their own records
- Delete their own records

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

### 5. **Error Handling**
- Added logging throughout all edge functions
- Implemented graceful error responses
- User-friendly error messages in UI

## 📊 Performance Optimizations

- Client-side document parsing (reduces backend load)
- Tanstack Query caching (reduces database queries)
- Optimistic UI updates (instant feedback)
- Lazy loading components (faster initial load)
- Structured AI responses (faster parsing)

## 🎨 Design System

- Semantic color tokens (HSL-based)
- Dark/light mode support
- Responsive design (mobile-first)
- Accessible components (ARIA labels)
- Consistent spacing and typography

## 📝 Environment Variables

The following environment variables are automatically configured:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Backend secrets (managed in Supabase):
- `LOVABLE_API_KEY` - AI gateway access

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
