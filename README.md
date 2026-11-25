# Suraksha AI

Map-first navigation with a community road-hazard layer.
React + TypeScript + Tailwind frontend, FastAPI backend, SQLite (default) or PostgreSQL/PostGIS.

## What works, what does not

| State | Features |
|---|---|
| Working | Map and GPS location, destination autocomplete, routes and alternatives, hazard markers, category filters, hazard details, report form with photo, confirm / flag as resolved, community page, admin dashboard |
| Rule-based (not AI) | In-app proximity alerts, duplicate warning (same type within 50 m in 14 days), freshness label, maintenance priority |
| Demo data | `seed_demo.py` adds hazards labelled DEMO DATA |
| Optional AI integration | Photo-based road-hazard suggestions through Google Gemini Vision. Requires a server-side `GEMINI_API_KEY`; without it, AI reports not configured. Suggestions are unverified and never auto-confirm hazards. |
| Future | Native turn-by-turn navigation (needs Android/iOS Navigation SDK), background push notifications |

This is a web prototype. It has no government partnership, no satellite data and no traffic source of its own (traffic-aware times come from Google Routes).

## Requirements

Node.js 20.19+ (or 22), Python 3.11+, a Google Cloud project.

## 1. Google keys (billing required)

Google Maps Platform needs a billing account. Each API has some free monthly usage, but check current prices at https://mapsplatform.google.com/pricing/ and set a budget alert before you start.

In Google Cloud Console, enable: **Maps JavaScript API**, **Places API (New)**, **Routes API**.

Create two keys:
1. **Browser key** (frontend). Restrict by HTTP referrer (`http://localhost:5173/*`) and to Maps JavaScript API + Places API (New).
2. **Server key** (backend). Restrict to Routes API (and to your server IP when deployed).

Also create a **Map ID** (Google Maps Platform, Map Management) for advanced markers. `DEMO_MAP_ID` works while testing.

## 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate        Mac/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `backend/.env`: set `GOOGLE_ROUTES_API_KEY` (server key) and `ADMIN_TOKEN` (any long random string). For optional AI photo analysis, add `GEMINI_API_KEY` from Google AI Studio. Keep this key only in `backend/.env` — never put it in frontend files or commit it.

```bash
python seed_demo.py                 # optional DEMO hazards (python seed_demo.py --clear removes them)
python -m uvicorn app.main:app --reload --port 8000
```

Check http://localhost:8000/api/health and http://localhost:8000/docs.

Run backend tests: `python -m pytest` (inside `backend/`).

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `frontend/.env`: set `VITE_GOOGLE_MAPS_API_KEY` (browser key), `VITE_GOOGLE_MAP_ID`, `VITE_CONTACT_EMAIL`. Then:

```bash
npm run dev
```

Open http://localhost:5173. Keep the backend running in a second terminal.

## 4. Try it

1. `/app`: allow location, search a destination, pick a route, click markers.
2. Press **Report a hazard**, fill the form, submit. It appears on the map as Unverified.
3. Open a marker and press **Still there, confirm** 3 times: it becomes Community confirmed.
4. `/admin`: enter your `ADMIN_TOKEN`, change statuses.

## PostgreSQL + PostGIS (optional)

```bash
docker compose up -d
# set DATABASE_URL in backend/.env (see docker-compose.yml), start the API once, then:
docker compose exec -T db psql -U suraksha -d suraksha < backend/sql/postgis_setup.sql
```

The API stores plain latitude/longitude and works without PostGIS. The SQL file adds a geography column and spatial index for future spatial queries.

## Project layout

```
backend/app/        FastAPI app: routers (hazards, admin, routing, ai), models, schemas
backend/app/ai/     Optional Gemini Vision image-analysis integration
backend/tests/      API tests
frontend/src/pages  Landing, NavApp, Community, HazardDetail, Admin, About
frontend/src/components  MapView, SearchBox, ReportModal, HazardPanel, Navbar, Badges
frontend/src/lib    api client, geometry, constants, Google Maps loader
```

## Known limits

- AI image analysis requires a Gemini API key and internet access; results are advisory and can be wrong.
- No user accounts. Confirm / flag use a browser-side marker to discourage repeat clicks and can be bypassed. Add authentication and rate limiting before public use.
- Admin uses one shared token. Replace with real login for production.
- Photos are saved on local disk in `backend/uploads/`.
- Route hazard counts only include reports in this app. They are not a safety score.
