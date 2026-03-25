# Queued

A full-stack movie tracking app. Search films, build a watchlist, log what you've watched, and get AI-powered recommendations based on your actual taste.

**Live demo:** [queued.vercel.app](https://queued.vercel.app) <!-- update with your real URL -->

---

## Features

- **Watchlist** — Add movies, filter by genre/streaming service/runtime, pin your next watch
- **Watch Diary** — Chronological log of every film you've seen, grouped by month
- **Ratings & Notes** — Rate on a 1–10 scale, attach notes and mood tags
- **Director Deep Dive** — Explore a director's full filmography and see which films are on your list
- **AI Recommendations** — Claude analyzes your watch history and taste profile to suggest films you'll actually like
- **AI Film Personality** — Get a custom "film personality" type (e.g. "The Melancholic Auteur") based on your data
- **AI Pick for Me** — Tell it your mood and available time; it picks the best unwatched film from your list
- **AI Rating Prediction** — Before watching, see a predicted rating based on your history
- **Profile Stats** — Genre breakdown, decade distribution, top directors, ratings distribution, year-in-review
- **Monthly Goal** — Set and track a monthly watch goal

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL (via Prisma ORM) |
| AI | Anthropic Claude API |
| Movie Data | TMDB API |
| Auth | JWT + bcrypt |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Local Setup

**Prerequisites:** Node.js, PostgreSQL

### 1. Clone and install

```bash
git clone https://github.com/rTorresro/Queued.git
cd Queued
```

```bash
# Backend
cd queued-backend
npm install

# Frontend
cd ../queued-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your values in `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — any random string
- `TMDB_API_KEY` — get one free at [themoviedb.org](https://www.themoviedb.org/settings/api)
- `ANTHROPIC_API_KEY` — get one at [console.anthropic.com](https://console.anthropic.com)

### 3. Set up the database

```bash
cd queued-backend
npx prisma db push
```

### 4. Run

```bash
# Backend (from queued-backend/)
npm start

# Frontend (from queued-frontend/)
npm start
```

App runs at `http://localhost:3000`, API at `http://localhost:5001`.

---

## Running Tests

```bash
cd queued-backend
npm test
```

---

## Project Structure

```
queued-backend/
  routes/         # Express route handlers (auth, watchlist, movies, recommendations)
  middleware/     # JWT auth middleware
  prisma/         # Database schema
  __tests__/      # Backend tests (Jest + Supertest)

queued-frontend/
  src/
    pages/        # Route-level components
    components/   # Reusable UI components
    hooks/        # Custom React hooks
    services/     # API call functions
    contexts/     # Auth context
```
