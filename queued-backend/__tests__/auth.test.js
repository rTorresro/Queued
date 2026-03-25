const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

const authRouter = require('../routes/auth');

// Mock prisma
const mockPrisma = {
  users: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

const app = express();
app.use(express.json());
app.use('/auth', authRouter(mockPrisma));

beforeEach(() => jest.clearAllMocks());

describe('POST /auth/register', () => {
  it('creates a user and returns 200', async () => {
    mockPrisma.users.create.mockResolvedValue({ id: 1, username: 'testuser' });

    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User created successfully');
    expect(res.body.userId).toBe(1);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/);
  });

  it('returns 409 when email or username is already taken', async () => {
    const prismaError = new Error('Unique constraint');
    prismaError.code = 'P2002';
    mockPrisma.users.create.mockRejectedValue(prismaError);

    const res = await request(app).post('/auth/register').send({
      email: 'existing@example.com',
      username: 'existinguser',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already taken/);
  });
});

describe('POST /auth/login', () => {
  it('returns a JWT token on valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    mockPrisma.users.findUnique.mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: hashedPassword,
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe('testuser');

    const decoded = jwt.verify(res.body.token, 'test-secret');
    expect(decoded.userId).toBe(1);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('returns 400 on wrong password', async () => {
    const hashedPassword = await bcrypt.hash('correctpassword', 10);
    mockPrisma.users.findUnique.mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: hashedPassword,
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials.');
  });

  it('returns 400 when user does not exist', async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials.');
  });
});
