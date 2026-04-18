# SensAI

An AI-powered career coaching platform built with Next.js. It helps professionals prepare for interviews, build optimized resumes, generate cover letters, and stay informed with industry-specific insights — all driven by Google's Gemini AI.

## Features

- **Industry Insights Dashboard** — View salary ranges, growth rates, demand levels, top skills, market outlook, and key trends for your selected industry. Data is refreshed periodically via background jobs (Inngest).
- **AI Mock Interviews** — Practice with AI-generated interview questions tailored to your industry and role. Get scored and receive improvement tips after each quiz.
- **Resume Builder** — Create and edit your resume in a Markdown editor. Get an ATS compatibility score and AI-generated feedback.
- **AI Cover Letter Generator** — Generate tailored cover letters by providing a job title, company name, and job description.
- **User Onboarding** — New users select their industry, experience level, and skills during onboarding to personalize the platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | JavaScript (React 18) |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI, shadcn/ui |
| Authentication | Clerk |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| AI | Google Gemini API |
| Background Jobs | Inngest |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (for authentication)
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)
- An [Inngest](https://www.inngest.com) account (for background job scheduling)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ZaidKhan26/sensai.git
cd sensai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

DATABASE_URL="postgresql://user:password@host/sensai?sslmode=require"

GEMINI_API_KEY=your_gemini_api_key
```

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
sensai/
├── app/
│   ├── (auth)/            # Sign-in / Sign-up pages (Clerk)
│   ├── (main)/            # Authenticated pages
│   │   ├── dashboard/     # Industry insights dashboard
│   │   ├── interview/     # AI mock interview & quiz
│   │   ├── resume/        # Resume builder
│   │   ├── ai-cover-letter/ # Cover letter generator
│   │   └── onboarding/    # User onboarding flow
│   ├── api/inngest/       # Inngest webhook endpoint
│   └── page.jsx           # Landing page
├── actions/               # Server actions (data mutations)
├── components/            # Reusable UI components
├── data/                  # Static data (features, FAQs, industries, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and Prisma client
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Database Schema

The app uses the following main models:

- **User** — Stores profile info, industry, experience, and skills (linked to Clerk).
- **Assessment** — Records quiz scores, questions, answers, and AI improvement tips.
- **Resume** — Stores Markdown resume content, ATS score, and feedback (one per user).
- **CoverLetter** — Stores generated cover letters with job details.
- **IndustryInsight** — Caches industry data like salary ranges, growth rate, demand level, top skills, and market outlook.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
