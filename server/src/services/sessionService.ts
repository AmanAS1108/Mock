import type Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { config } from '../config.js';
import type { SafeUser, Session } from '../types/index.js';

export class SessionService {
  constructor(private db: Database.Database) {}

  /**
   * Generates a cryptographically random session identifier.
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Creates a new session for the given user ID.
   */
  createSession(userId: string): { sessionId: string; expiresAt: Date } {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000);
    const createdAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, userId, expiresAt.toISOString(), createdAt);

    return { sessionId, expiresAt };
  }

  /**
   * Finds a session and returns the associated safe user.
   * If the session is expired or not found, cleans it up and returns null.
   */
  getSessionUser(sessionId: string): SafeUser | null {
    if (!sessionId) return null;

    const row = this.db.prepare(`
      SELECT 
        s.id as session_id,
        s.expires_at as session_expires_at,
        u.id,
        u.name,
        u.email,
        u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionId) as {
      session_id: string;
      session_expires_at: string;
      id: string;
      name: string;
      email: string;
      created_at: string;
    } | undefined;

    if (!row) {
      return null;
    }

    const expiresAt = new Date(row.session_expires_at).getTime();
    if (Date.now() > expiresAt) {
      // Session has expired - clean it up
      this.invalidateSession(sessionId);
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
    };
  }

  /**
   * Regenerates a session to prevent session fixation attacks.
   * Invalidates old session if present and creates a brand new one.
   */
  regenerateSession(oldSessionId: string | undefined, userId: string): { sessionId: string; expiresAt: Date } {
    if (oldSessionId) {
      this.invalidateSession(oldSessionId);
    }
    return this.createSession(userId);
  }

  /**
   * Invalidates (deletes) a specific session upon logout.
   */
  invalidateSession(sessionId: string): void {
    if (!sessionId) return;
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  /**
   * Cleans up all expired sessions.
   */
  cleanupExpiredSessions(): void {
    const nowIso = new Date().toISOString();
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso);
  }
}
