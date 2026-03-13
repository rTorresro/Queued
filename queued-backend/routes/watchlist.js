const express = require('express');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

module.exports = (prisma) => {
  // Add movie to watchlist
  router.post('/', authenticateToken, async (req, res) => {
    const { tmdbMovieId, title, posterPath, runtime, genres, releaseYear, director, isWatched } = req.body;

    if (!tmdbMovieId || !title) {
      return res.status(400).json({ error: 'tmdbMovieId and title are required.' });
    }

    try {
      const item = await prisma.watchlist_items.create({
        data: {
          user_id: req.userId,
          tmdb_movie_id: tmdbMovieId,
          title,
          poster_path: posterPath || null,
          runtime: runtime || null,
          genres: genres || null,
          release_year: releaseYear || null,
          director: director || null,
          is_watched: isWatched || false
        }
      });
      return res.json(item);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Movie already in watchlist.' });
      }
      return res.status(500).json({ error: 'Failed to add to watchlist.' });
    }
  });

  // Get user's watchlist
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const watchlist = await prisma.watchlist_items.findMany({
        where: { user_id: req.userId },
        orderBy: { added_at: 'desc' }
      });
      return res.json(watchlist);
    } catch {
      return res.status(500).json({ error: 'Failed to get watchlist.' });
    }
  });

  // Update watchlist item
  router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { isWatched, rating, notes, rewatchCount, mood } = req.body;

    try {
      const item = await prisma.watchlist_items.findFirst({
        where: { id: parseInt(id), user_id: req.userId }
      });

      if (!item) return res.status(404).json({ error: 'Item not found.' });

      const updateData = {};
      if (isWatched !== undefined) updateData.is_watched = isWatched;
      if (rating !== undefined) updateData.rating = rating;
      if (notes !== undefined) updateData.notes = notes;
      if (rewatchCount !== undefined) updateData.rewatch_count = rewatchCount;
      if (mood !== undefined) updateData.mood = mood;

      const updated = await prisma.watchlist_items.update({
        where: { id: parseInt(id) },
        data: updateData
      });
      return res.json(updated);
    } catch {
      return res.status(500).json({ error: 'Failed to update.' });
    }
  });

  // Delete from watchlist
  router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      const item = await prisma.watchlist_items.findFirst({
        where: { id: parseInt(id), user_id: req.userId }
      });

      if (!item) return res.status(404).json({ error: 'Item not found.' });

      await prisma.watchlist_items.delete({ where: { id: parseInt(id) } });
      return res.json({ message: 'Deleted successfully.' });
    } catch {
      return res.status(500).json({ error: 'Failed to delete.' });
    }
  });

  return router;
};
