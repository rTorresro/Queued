const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseClaudeJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

async function tmdbSearch(title, year) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return { tmdb_id: null, poster_path: null };
  try {
    const res = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: key, query: title, year }
    });
    const match = res.data.results?.[0];
    return { tmdb_id: match?.id || null, poster_path: match?.poster_path || null };
  } catch {
    return { tmdb_id: null, poster_path: null };
  }
}

module.exports = (prisma) => {
  // AI recommendations based on watch history
  router.post('/ai', authenticateToken, async (req, res) => {
    try {
      const items = await prisma.watchlist_items.findMany({
        where: { user_id: req.userId }
      });

      if (items.length === 0) {
        return res.status(400).json({ error: 'Add some movies to your watchlist first.' });
      }

      const watched = items.filter((i) => i.is_watched);
      const topRated = [...watched]
        .filter((i) => i.rating !== null)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);

      const genreCounts = {};
      watched.filter((i) => i.genres).forEach((i) => {
        i.genres.split(',').forEach((g) => {
          const genre = g.trim();
          if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g);

      const avgRating = topRated.length
        ? (topRated.reduce((s, i) => s + (i.rating || 0), 0) / topRated.length).toFixed(1)
        : null;

      const prompt = `You are a film expert giving personalized movie recommendations.

Here is this user's taste profile:
- Top rated movies: ${topRated.map((i) => `"${i.title}" (${i.rating}/10)`).join(', ') || 'none yet'}
- Favorite genres: ${topGenres.join(', ') || 'varied'}
- Average rating they give: ${avgRating || 'n/a'} out of 10
- Movies already in their list (do NOT recommend these): ${items.map((i) => i.title).join(', ')}

Recommend exactly 6 movies they haven't seen. For each one, write a single sentence explaining WHY it fits their specific taste — mention something concrete from their profile (a movie they liked, a genre they love, a director, etc.).

Respond ONLY with valid JSON in this exact format, no other text:
[
  { "title": "Movie Title", "year": 2001, "reason": "One sentence explanation." },
  ...
]`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const recommendations = parseClaudeJson(message.content[0].text);

      const enriched = await Promise.all(
        recommendations.map(async (rec) => ({
          ...rec,
          ...(await tmdbSearch(rec.title, rec.year))
        }))
      );

      return res.json({ recommendations: enriched });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return res.status(502).json({ error: 'Failed to parse AI response.' });
      }
      return res.status(500).json({ error: 'Failed to get recommendations.' });
    }
  });

  // AI film personality based on full watch history
  router.post('/personality', authenticateToken, async (req, res) => {
    try {
      const items = await prisma.watchlist_items.findMany({
        where: { user_id: req.userId, is_watched: true }
      });

      if (items.length < 5) {
        return res.status(400).json({
          error: 'Watch at least 5 movies before generating your film personality.'
        });
      }

      const rated = items.filter((i) => i.rating !== null);
      const avgRating = rated.length
        ? (rated.reduce((s, i) => s + (i.rating || 0), 0) / rated.length).toFixed(1)
        : null;

      const genreCounts = {};
      items.filter((i) => i.genres).forEach((i) => {
        i.genres.split(',').forEach((g) => {
          const genre = g.trim();
          if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g);

      const decadeCounts = {};
      items.filter((i) => i.release_year).forEach((i) => {
        const decade = Math.floor(i.release_year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      });
      const favDecade = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      const directorCounts = {};
      items.filter((i) => i.director).forEach((i) => {
        directorCounts[i.director] = (directorCounts[i.director] || 0) + 1;
      });
      const favDirector = Object.entries(directorCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([, c]) => c >= 2)[0]?.[0];

      const topRated = [...rated]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      const moodCounts = {};
      items.filter((i) => i.mood).forEach((i) => {
        moodCounts[i.mood] = (moodCounts[i.mood] || 0) + 1;
      });
      const favMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      const ratingStyle = avgRating > 7 ? 'a generous rater' : avgRating < 6 ? 'a tough critic' : 'a balanced rater';

      const prompt = `You are a sharp, witty film critic writing a brief "film personality" profile for a cinephile.

Their data:
- Movies watched: ${items.length}
- Top genres: ${topGenres.join(', ') || 'varied'}
- Average rating: ${avgRating || 'n/a'}/10 (${ratingStyle})
- Favorite decade: ${favDecade ? `${favDecade}s` : 'varies'}
${favDirector ? `- Favorite director: ${favDirector} (multiple films watched)` : ''}
${favMood ? `- Most common viewing mood: ${favMood}` : ''}
- Top rated films: ${topRated.map((i) => `"${i.title}" (${i.rating}/10)`).join(', ')}

Write a punchy film personality profile. Give them a creative "type" name (e.g., "The Melancholic Auteur"), then 2 sentences about their taste that feel insightful, not generic. Reference specific data points.

Respond ONLY with valid JSON:
{ "type": "The [creative name]", "description": "2 sentences about their taste." }`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const personality = parseClaudeJson(message.content[0].text);
      return res.json(personality);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return res.status(502).json({ error: 'Failed to parse AI response.' });
      }
      return res.status(500).json({ error: 'Failed to generate personality.' });
    }
  });

  // AI mood-based pick from unwatched list
  router.post('/pick', authenticateToken, async (req, res) => {
    try {
      const { mood, runtime } = req.body;

      const unwatched = await prisma.watchlist_items.findMany({
        where: { user_id: req.userId, is_watched: false }
      });

      if (unwatched.length === 0) {
        return res.status(400).json({ error: 'No unwatched movies in your list.' });
      }

      let pool = unwatched;
      if (runtime === 'short') pool = unwatched.filter((i) => i.runtime && i.runtime < 90);
      if (runtime === 'medium') pool = unwatched.filter((i) => i.runtime && i.runtime >= 90 && i.runtime <= 120);
      if (runtime === 'long') pool = unwatched.filter((i) => i.runtime && i.runtime > 120);
      if (pool.length === 0) pool = unwatched;

      const topRated = await prisma.watchlist_items.findMany({
        where: { user_id: req.userId, is_watched: true, rating: { not: null } },
        orderBy: { rating: 'desc' },
        take: 5
      });

      const runtimeLabel = {
        short: 'under 90 minutes',
        medium: '90–120 minutes',
        long: 'over 2 hours',
        any: 'any length'
      }[runtime || 'any'];

      const movieList = pool
        .map((i) => `- "${i.title}" (${i.release_year || '?'}, ${i.runtime || '?'} min, ${i.genres || 'unknown genre'})`)
        .join('\n');

      const prompt = `You are helping pick the perfect movie for tonight.

User's mood: ${mood || 'no preference'}
Available time: ${runtimeLabel}
Their top-rated movies (for taste context): ${topRated.map((i) => `"${i.title}" (${i.rating}/10)`).join(', ') || 'none yet'}

Movies to choose from (pick exactly ONE):
${movieList}

Pick the single best movie given the mood and time constraint. Consider genre, tone, and pacing.

Respond ONLY with valid JSON:
{ "title": "exact title from the list above", "reason": "One vivid sentence explaining why this is perfect for tonight." }`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      });

      const pick = parseClaudeJson(message.content[0].text);
      const picked =
        pool.find((i) => i.title.toLowerCase() === pick.title.toLowerCase()) || pool[0];

      return res.json({ item: picked, reason: pick.reason });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return res.status(502).json({ error: 'Failed to parse AI response.' });
      }
      return res.status(500).json({ error: 'Failed to get a pick.' });
    }
  });

  return router;
};
