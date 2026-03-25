const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a temp DB for tests
process.env.DB_PATH = path.join('/tmp', 'frispchat-test.db');
process.env.JWT_SECRET = 'test-secret';

// Clean up before each test suite run
beforeAll(() => {
  if (fs.existsSync(process.env.DB_PATH)) {
    fs.unlinkSync(process.env.DB_PATH);
  }
});

afterAll(() => {
  const { closeDb } = require('../src/models/db');
  closeDb();
  if (fs.existsSync(process.env.DB_PATH)) {
    fs.unlinkSync(process.env.DB_PATH);
  }
});

const { createApp } = require('../src/app');
const app = createApp();

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

let authToken = '';

describe('POST /api/auth/signup', () => {
  it('should create a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser)
      .expect(201);

    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  it('should reject duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser)
      .expect(409);

    expect(res.body.error).toMatch(/already taken/i);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser2', email: 'new2@example.com', password: '123' })
      .expect(400);

    expect(res.body.error).toMatch(/password/i);
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser3', email: 'not-an-email', password: 'password123' })
      .expect(400);

    expect(res.body.error).toMatch(/email/i);
  });

  it('should reject username shorter than 3 chars', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'ab', email: 'ab@example.com', password: 'password123' })
      .expect(400);

    expect(res.body.error).toMatch(/username/i);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password })
      .expect(200);

    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('should reject unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'somepassword' })
      .expect(401);

    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('should reject missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.user.username).toBe(testUser.username);
  });

  it('should reject request without token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should clear the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout').expect(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});

describe('GET /api/rooms', () => {
  it('should return list of rooms when authenticated', async () => {
    const res = await request(app)
      .get('/api/rooms')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body.rooms)).toBe(true);
    expect(res.body.rooms.length).toBeGreaterThan(0);
    expect(res.body.rooms[0].name).toBe('general');
  });

  it('should require authentication', async () => {
    await request(app).get('/api/rooms').expect(401);
  });
});

describe('GET /api/rooms/:roomId/messages', () => {
  it('should return messages for an existing room', async () => {
    const res = await request(app)
      .get('/api/rooms/1/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('should return 404 for non-existent room', async () => {
    await request(app)
      .get('/api/rooms/999/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should require authentication', async () => {
    await request(app).get('/api/rooms/1/messages').expect(401);
  });
});
