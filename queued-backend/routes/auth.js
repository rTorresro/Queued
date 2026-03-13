const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = (prisma) => {
  router.post('/register', authLimiter, async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.users.create({
        data: { email, username, password: hashedPassword }
      });
      return res.json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Email or username already taken.' });
      }
      return res.status(500).json({ error: 'Registration failed.' });
    }
  });

  router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ token, username: user.username, userId: user.id });
    } catch {
      return res.status(500).json({ error: 'Login failed.' });
    }
  });

  return router;
};
