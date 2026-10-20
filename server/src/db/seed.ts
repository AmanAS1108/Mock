import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export const DEMO_USER = {
  name: 'Aman',
  email: 'aman@gmail.com',
  // Documented local demonstration password only - not for production use
  password: '123456',
};

export function seedDemoUser(db: Database.Database): void {
  const normalizedEmail = DEMO_USER.email.trim().toLowerCase();
  
  // Check if the user already exists (idempotent check)
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    // Already seeded - do not overwrite or reset password
    return;
  }

  // Hash demo password securely with bcrypt
  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(DEMO_USER.password, saltRounds);

  const userId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insert.run(userId, DEMO_USER.name, normalizedEmail, passwordHash, createdAt);
}
