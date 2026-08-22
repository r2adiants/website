# The Aldervale Hotel — Roleplay Management Site

A hotel roleplay site with reservations, an AI concierge (in-site inbox, no real emails sent), and a staff-only dashboard.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Visit http://localhost:3000

## Default staff login

- Email: `manager@hotel.rp`
- Password: `admin123`

Change this in production by editing the seed logic in `lib/db.ts` or adding an admin UI to manage staff accounts.

## How it works

- **Guests** book without an account on the homepage. They get a confirmation code and a link to `/confirmation/[code]`, where they can view their reservation and message the AI concierge — replies appear directly in that page's inbox (no real email is sent).
- **Staff** log in at `/staff/login` and manage all reservations + guest mail threads from `/staff/dashboard`.
- **AI concierge** uses the Anthropic API (Claude) to write in-character replies. Without an `ANTHROPIC_API_KEY` set, it falls back to a simple template so the site still works.

## Data storage

Uses SQLite via `better-sqlite3` — a single file at `data/hotel.db`, created automatically on first run. No external database needed. For production deployment on serverless platforms (like Vercel), note that SQLite on ephemeral filesystems won't persist between deploys — consider swapping to a hosted Postgres (e.g. Neon, Supabase) for a permanent production database if that matters for your use case.

## Customizing

- Room types: edit the seed data in `lib/db.ts`
- Hotel name/branding: `lib/concierge.ts` (HOTEL_NAME), and colors in `app/globals.css`
- Fonts: currently using system font stacks for portability. If deploying somewhere with normal internet access, you can swap back to `next/font/google` (e.g. Fraunces + Inter) in `app/layout.tsx` for a more distinctive look.
