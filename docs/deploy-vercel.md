# Deploy to Vercel (Frontend) + Backend

## Frontend (Vercel)

1. Create a Vercel project and set the **Root Directory** to `queued-frontend`.
2. Add environment variable:
   - `REACT_APP_API_BASE_URL` = your backend URL (example: `https://queued-backend.onrender.com`)
3. Deploy.

## Backend (Render/Railway/Fly)

Set these environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `TMDB_API_KEY`
- `FRONTEND_URL` (comma-separated if multiple, example: `https://queued.vercel.app,https://queued-git-main.vercel.app`)

Make sure Prisma migrations are applied in production.
