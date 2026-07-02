# Asdify — Frontend

React + Vite single-page app for **Asdify**, an AI-assisted Autism Spectrum Disorder (ASD) screening platform for young children (ages 2–8). Parents run a guided screening questionnaire or upload a photo/short video for an AI-assisted risk assessment; doctors review assigned families and attach clinical notes; admins manage doctor approvals, care assignments, and platform analytics.

**Live**: https://asdify-frontend.vercel.app
**Backend API**: [asdify-backend](https://github.com/HuzaifaNaseem/asdify-backend)

> Asdify provides a screening-style risk summary to support early conversations with healthcare professionals. It is **not** a clinical diagnosis.

## Stack

- React 19 + Vite
- React Router
- Axios
- Deployed on Vercel

## Local development

```bash
npm install
cp .env.example .env   # optional — see below
npm run dev
```

By default the Vite dev server proxies `/api/*` to `http://127.0.0.1:5000` (the Flask backend running locally — see [asdify-backend](https://github.com/HuzaifaNaseem/asdify-backend)). Override with `VITE_API_PROXY_TARGET` in `.env` if your backend runs elsewhere.

## Production build

```bash
npm run build
```

Requires `VITE_API_URL` to be set (the deployed backend's origin, no trailing slash) — the build fails intentionally without it, since a missing API URL would silently break every request in production. See `vercel.json` for the deployed routing config.

## Key user flows

- **Guest**: take the screening questionnaire with no account.
- **Parent**: register → screening / image / behavior / video assessments → history → PDF reports → share links.
- **Doctor**: pending until admin-approved → assigned-patient dashboard → clinical notes → PDF export.
- **Admin**: dashboard, doctor approvals, care assignments, user management, analytics, anonymized CSV export, audit trail.
