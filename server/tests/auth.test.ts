import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { initializeSchema } from '../src/db/schema.js';
import { seedDemoUser, DEMO_USER } from '../src/db/seed.js';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';

describe('Authentication & Database Tests', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Isolated in-memory database for each test run
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    seedDemoUser(db);
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Database and Seeding', () => {
    it('initializes schema and creates tables', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('sessions');
    });

    it('idempotently seeds the default user without duplicates', () => {
      // Re-run seeding multiple times
      seedDemoUser(db);
      seedDemoUser(db);

      const users = db.prepare('SELECT * FROM users WHERE email = ?').all(DEMO_USER.email) as any[];
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('Aman');
      expect(users[0].email).toBe('aman@gmail.com');
    });

    it('stores the seeded password as a bcrypt hash, never plaintext', () => {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(DEMO_USER.email) as any;
      expect(user.password_hash).not.toBe(DEMO_USER.password);
      expect(user.password_hash.startsWith('$2')).toBe(true);
      expect(bcrypt.compareSync(DEMO_USER.password, user.password_hash)).toBe(true);
    });

    it('enforces email uniqueness constraint in database', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, name, email, password_hash, created_at)
          VALUES ('id-dup', 'Another User', 'aman@gmail.com', 'dummyhash', '2026-01-01')
        `).run();
      }).toThrow();
    });
  });

  describe('Sign Up (/api/auth/signup)', () => {
    it('successfully registers a new user with valid details and sets session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'securePassword123',
          confirmPassword: 'securePassword123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Sarah Connor');
      expect(res.body.user.email).toBe('sarah@example.com');
      expect(res.body.user.password_hash).toBeUndefined();

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(config.sessionCookieName);
      expect(cookies[0]).toContain('HttpOnly');

      // Verify database record
      const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get('sarah@example.com') as any;
      expect(dbUser).toBeDefined();
      expect(bcrypt.compareSync('securePassword123', dbUser.password_hash)).toBe(true);
    });

    it('normalizes email during registration (lowercase and trim)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: '  JOHN.DOE@Example.COM  ',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('john.doe@example.com');

      const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get('john.doe@example.com') as any;
      expect(dbUser).toBeDefined();
    });

    it('rejects registration if password and confirm password do not match', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password456',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Passwords do not match');
    });

    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email');
    });

    it('rejects registration with short password (< 6 characters)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
          confirmPassword: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 6 characters');
    });

    it('rejects registration if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Duplicate Aman',
          email: 'aman@gmail.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists');
    });
  });

  describe('Sign In (/api/auth/login)', () => {
    it('succeeds with default seeded demo credentials (aman@gmail.com / 123456)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'aman@gmail.com',
          password: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Aman');
      expect(res.body.user.email).toBe('aman@gmail.com');
      expect(res.body.user.password_hash).toBeUndefined();

      // Session cookie is present
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(config.sessionCookieName);
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('fails with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'aman@gmail.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('fails with unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: '123456',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('fails safely with invalid input structure', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: '',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Session Management & Protected Profile (/api/auth/me & logout)', () => {
    it('blocks access to /api/auth/me without a session cookie', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('allows access to /api/auth/me with valid session cookie and returns user profile', async () => {
      // 1. Log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'aman@gmail.com', password: '123456' });

      const cookie = loginRes.headers['set-cookie'][0];

      // 2. Access /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.name).toBe('Aman');
      expect(meRes.body.user.email).toBe('aman@gmail.com');
      expect(meRes.body.user.password_hash).toBeUndefined();
    });

    it('regenerates session identifier on login to prevent fixation', async () => {
      // Pre-existing session
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Session Fixation Test',
          email: 'fixation@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      const firstCookie = signupRes.headers['set-cookie'][0];
      const firstSessionId = firstCookie.split(';')[0].split('=')[1];

      // Re-login with the same account
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Cookie', firstCookie)
        .send({
          email: 'fixation@example.com',
          password: 'password123',
        });

      const secondCookie = loginRes.headers['set-cookie'][0];
      const secondSessionId = secondCookie.split(';')[0].split('=')[1];

      expect(firstSessionId).not.toBe(secondSessionId);

      // Old session is removed from database
      const oldSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(firstSessionId);
      expect(oldSession).toBeUndefined();
    });

    it('invalidates session on logout and rejects subsequent /api/auth/me calls', async () => {
      // 1. Log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'aman@gmail.com', password: '123456' });

      const cookie = loginRes.headers['set-cookie'][0];

      // 2. Log out
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logged out successfully');

      // 3. Try to access /api/auth/me with old cookie
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error).toBe('Unauthorized');
    });
  });
});
