import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type { SafeUser, User } from '../types/index.js';

export class AuthService {
  constructor(private db: Database.Database) {}

  /**
   * Normalizes an email address consistently.
   */
  normalizeEmail(email: string): string {
    return email.trim();
  }

  /**
   * Finds a user by normalized email.
   */
  getUserByEmail(email: string): User | null {
    const normalized = this.normalizeEmail(email);
    const user = this.db.prepare('SELECT * FROM users WHERE email = ?').get(normalized) as User | undefined;
    return user || null;
  }

  /**
   * Finds a safe user by ID.
   */
  getUserById(id: string): SafeUser | null {
    const user = this.db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(id) as SafeUser | undefined;
    return user || null;
  }

  /**
   * Hashes a password using bcrypt.
   */
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies a plain password against a bcrypt hash.
   */
  verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Registers a new user.
   */
  registerUser(name: string, email: string, password: string): { user?: SafeUser; error?: string } {
    const normalizedEmail = this.normalizeEmail(email);

    // Check for existing account
    const existing = this.getUserByEmail(normalizedEmail);
    if (existing) {
      return { error: 'An account with this email already exists' };
    }

    const id = crypto.randomUUID();
    const password_hash = this.hashPassword(password);
    const created_at = new Date().toISOString();

    const insert = this.db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(id, name.trim(), normalizedEmail, password_hash, created_at);

    return {
      user: {
        id,
        name: name.trim(),
        email: normalizedEmail,
        created_at,
      },
    };
  }

  /**
   * Authenticates user credentials.
   * Returns generic failure for security.
   */
  authenticate(email: string, password: string): { user?: SafeUser; error?: string } {
    const normalizedEmail = this.normalizeEmail(email);
    const user = this.getUserByEmail(normalizedEmail);

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const isValid = this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }
}
