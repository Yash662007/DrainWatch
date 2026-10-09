# DrainWatch AI

An AI-assisted drain monitoring and civic-response platform for Indian cities. DrainWatch follows one operational loop end to end:

**Detect → Report → AI Assess → Prioritize → Assign → Resolve → Verify → Reward**

It supports four roles with distinct experiences:

| Role | Core abilities |
|---|---|
| Citizen | View nearby drains, report issues with photo + location, track status, earn Civic Credits, badges, and leaderboard rank |
| Field Worker | View assigned tasks, start inspections, capture before/after photos, submit for AI verification |
| Municipal Officer | Monitor drains and reports, review AI assessments, assign work orders, track SLAs, view analytics |
| Administrator | Full visibility across wards, users, performance, and configuration |

## Tech stack

- **Frontend**: Static HTML/CSS/vanilla JS (ES modules) served from `public/`, styled with Tailwind (CDN) and a hand-built claymorphism layer, Leaflet.js for maps, Chart.js for analytics
- **Backend**: Next.js API routes (`src/app/api/**`)
- **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com)), accessed via [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: Cookie-based sessions (`src/lib/auth.ts`)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

This project uses a PostgreSQL database — any Postgres instance works, but it's built against [Supabase](https://supabase.com)'s free tier:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, click **Connect** → choose the **Transaction pooler** connection string (port `6543`). Direct connections (port `5432`) require IPv6 and will hang on many networks.
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL` with that connection string (with your real password substituted in):

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

4. Push the schema to your database:

```bash
npx drizzle-kit push
```

5. (Optional) Seed sample data — demo users, drains, teams, and badges:

```bash
npm run db:seed
```

> `db:seed` is not idempotent — running it twice creates duplicate rows. Clear the tables first if you need to reseed.

### 3. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Demo accounts

After seeding, these accounts are available (password for all: `password123`):

| Role | Email |
|---|---|
| Citizen | `citizen@drainwatch.demo` |
| Field Worker | `worker@drainwatch.demo` |
| Officer | `officer@drainwatch.demo` |
| Admin | `admin@drainwatch.demo` |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session tokens |
| `AI_VISION_PROVIDER` | No | Enables real AI vision analysis of uploaded photos; falls back to a deterministic mock in `src/lib/ai/vision.ts` when unset |
| `AI_VISION_API_KEY` | No | API key for the configured vision provider |

## Project structure

```
public/              Static frontend (HTML/CSS/vanilla JS)
  js/pages/           One module per route (dashboard, map, report, work-orders, field, ...)
  js/api/             fetch-based client for the backend API
src/app/api/         Next.js API routes (auth, drains, reports, inspections, work-orders, rewards, analytics, ...)
src/db/              Drizzle schema, DB client, and seed script
src/lib/             Shared backend logic (auth, credits, badges, geo, notifications)
drizzle.config.ts    Drizzle Kit configuration (reads DATABASE_URL from .env)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm run db:seed` | Seed the database with demo data |
| `npx drizzle-kit push` | Push the Drizzle schema to the database |
