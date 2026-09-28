# Customer Chat Bot

A Next.js customer-service chatbot foundation with a public chat UI, admin dashboard foundation, and Groq-powered API route.

## Current structure

- `/` — public customer-service chatbot
- `/admin` — knowledge-base management dashboard foundation
- `/admin/login` — authentication placeholder
- `/api/chat` — Groq chat endpoint with a safe human-support fallback

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your `GROQ_API_KEY` when ready.

## Next setup

1. Create the new Supabase project.
2. Connect Supabase Auth and database tables for the knowledge base.
3. Add FAQ, About Us, custom content, PDF/DOCX ingestion, search and publish controls.
4. Add human-support routing and optional Messenger integration.
5. Deploy the finished app to Vercel.

Never commit real API keys or Supabase service-role secrets to GitHub.
