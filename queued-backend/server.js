const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow all Vercel preview deployments automatically
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  })
);
app.use(express.json());

// Routes (ALL ROUTES BEFORE app.listen!)
app.get('/', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.get('/movies/search', async (req, res) => {
  const query = req.query.query;
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY missing on server.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter.' });
  }

  try {
    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: apiKey, query }
    });
    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

app.get('/movies/trending', async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY missing on server.' });
  }

  try {
    const response = await axios.get('https://api.themoviedb.org/3/trending/movie/week', {
      params: { api_key: apiKey }
    });
    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

app.get('/movies/:id/credits', async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  const { id } = req.params;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY missing on server.' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/credits`, {
      params: { api_key: apiKey }
    });
    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

app.get('/movies/:id', async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  const { id } = req.params;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY missing on server.' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing movie id.' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
      params: { api_key: apiKey }
    });
    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'TMDB request failed.' });
  }
});

app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error'});
  }
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  console.log('Register endpoint hit!');
  console.log('Request body:', req.body);
  
  try {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); 
    const user = await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword
      }
    });

    res.json({
      message: 'User created successfully',
      userId: user.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed'});
  }
});

app.post('/auth/login', async (req, res) => {
  console.log('Login endpoint hit!');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials'});
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d'}
    );

    res.json({
      token,
      username: user.username,
      userId: user.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed'});
  }
});

// Test routes
app.post('/test-post', (req, res) => {
  console.log('Test POST endpoint hit!');
  res.json({ message: 'POST request works!' });
});

app.get('/test-protected', authenticateToken, (req, res) => {
  res.json({ message: 'You are authenticated!', userId: req.userId });
});

// Watchlist routes
// Add movie to watchlist 
app.post('/watchlist', authenticateToken, async (req, res) => {  // ✅ ADDED authenticateToken
  console.log('Add to watchlist endpoint hit.');
  console.log('User ID:', req.userId);
  console.log('Request body:', req.body);

  try {
    const { tmdbMovieId, title, posterPath } = req.body;
    const userId = req.userId;

    const item = await prisma.watchlist_items.create({
      data: {
        user_id: userId,
        tmdb_movie_id: tmdbMovieId,
        title,
        poster_path: posterPath
      }
    });
    
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
}); 

// Get user watchlist 
app.get('/watchlist', authenticateToken, async (req, res) => {
  console.log('Get watchlist endpoint hit.');
  console.log('User ID:', req.userId);

  try {
    const userId = req.userId;

    const watchlist = await prisma.watchlist_items.findMany({
      where: { user_id: userId },
      orderBy: { added_at: 'desc' }
    });
    res.json(watchlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Update watchlist item 
app.patch('/watchlist/:id', authenticateToken, async (req, res) => {
  console.log('Update watchlist endpoint hit!');
  console.log('User ID:', req.userId);
  console.log('Item ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const { id } = req.params;
    const { isWatched, rating } = req.body;
    const userId = req.userId;
    
    // Make sure the item belongs to this user
    const item = await prisma.watchlist_items.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const updatedItem = await prisma.watchlist_items.update({
      where: { id: parseInt(id) },
      data: { 
        is_watched: isWatched, 
        rating 
      }
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Delete from watchlist
app.delete('/watchlist/:id', authenticateToken, async (req, res) => {
  console.log('Delete watchlist endpoint hit!');
  console.log('User ID:', req.userId);
  console.log('Item ID:', req.params.id);
  
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Make sure the item belongs to this user
    const item = await prisma.watchlist_items.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    await prisma.watchlist_items.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

const logRegisteredRoutes = () => {
  console.log('=== Registered Routes ===');
  const router = app._router || app.router;
  if (router && router.stack) {
    router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        const methods = Object.keys(r.route.methods)
          .map((method) => method.toUpperCase())
          .join(', ');
        console.log(`${methods} ${r.route.path}`);
      }
    });
  } else {
    console.log('No routes registered yet.');
  }
  console.log('========================');
};

// Start server (ALWAYS LAST!)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Ensure Express has finished wiring routes before logging.
  setImmediate(logRegisteredRoutes);
});