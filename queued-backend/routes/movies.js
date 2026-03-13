const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';

const GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Science Fiction': 878,
  'Thriller': 53, 'War': 10752, 'Western': 37
};

router.use((req, res, next) => {
  if (!process.env.TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY missing on server.' });
  }
  next();
});

async function tmdbGet(path, params = {}) {
  const response = await axios.get(`${TMDB_BASE}${path}`, {
    params: { api_key: process.env.TMDB_API_KEY, ...params }
  });
  return response.data;
}

function tmdbHandler(buildPath, buildParams = () => ({})) {
  return async (req, res) => {
    try {
      return res.json(await tmdbGet(buildPath(req), buildParams(req)));
    } catch {
      return res.status(502).json({ error: 'TMDB request failed.' });
    }
  };
}

router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter.' });
  try {
    return res.json(await tmdbGet('/search/movie', { query }));
  } catch {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

router.get('/trending', tmdbHandler(() => '/trending/movie/week'));

router.get('/recommend', async (req, res) => {
  const { genres } = req.query;
  const genreIds = genres
    ? genres.split(',').map((g) => GENRE_IDS[g.trim()]).filter(Boolean).join(',')
    : '';
  try {
    return res.json(await tmdbGet('/discover/movie', {
      with_genres: genreIds || undefined,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      page: 1
    }));
  } catch {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

// Batch streaming providers — must be before /:id routes
router.get('/providers/batch', async (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'Missing ids parameter.' });

  const idList = ids.split(',').map(Number).filter(Boolean).slice(0, 50);
  const results = await Promise.all(
    idList.map(async (id) => {
      try {
        const data = await tmdbGet(`/movie/${id}/watch/providers`);
        const us = data.results?.US;
        return { id, providers: [...(us?.flatrate || []), ...(us?.rent || [])] };
      } catch {
        return { id, providers: [] };
      }
    })
  );

  const map = {};
  results.forEach(({ id, providers }) => { map[id] = providers; });
  return res.json(map);
});

// Director filmography — must be before /:id routes
router.get('/director', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing name parameter.' });
  try {
    const searchData = await tmdbGet('/search/person', { query: name });
    const person = searchData.results?.[0];
    if (!person) return res.status(404).json({ error: 'Director not found.' });

    const creditsData = await tmdbGet(`/person/${person.id}/movie_credits`);
    const directed = (creditsData.crew || [])
      .filter((m) => m.job === 'Director')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return res.json({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path || null,
      directed
    });
  } catch {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

router.get('/:id/providers', tmdbHandler((req) => `/movie/${req.params.id}/watch/providers`));
router.get('/:id/similar',   tmdbHandler((req) => `/movie/${req.params.id}/similar`));
router.get('/:id/videos',    tmdbHandler((req) => `/movie/${req.params.id}/videos`));
router.get('/:id/credits',   tmdbHandler((req) => `/movie/${req.params.id}/credits`));
router.get('/:id',           tmdbHandler((req) => `/movie/${req.params.id}`));

module.exports = router;
