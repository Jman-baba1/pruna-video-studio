# Pruna Video Studio

A simple Next.js web app powered by Pruna P-Video-2-Pro.

## 1. Install

```bash
npm install
```

## 2. Configure your API key

Create `.env.local` in the project root:

```env
PRUNA_API_KEY=YOUR_PRUNA_API_KEY
```

Never put this key in `app/page.tsx` or any client-side code.

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 4. Deploy

The easiest route is Vercel:

1. Create a GitHub repository and upload this project.
2. Import the repository into Vercel.
3. Add `PRUNA_API_KEY` under Project Settings → Environment Variables.
4. Deploy.

## Notes

The app uses the asynchronous Pruna workflow:
- upload reference files when supplied
- create a P-Video-2-Pro prediction
- poll `/v1/predictions/status/:id`
- show the returned `generation_url`

This is an MVP. For a public product, add authentication, usage limits, billing/credits, persistent generation history, abuse controls, and server-side job management.
