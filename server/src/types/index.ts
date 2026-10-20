export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface SessionWithUser extends Session {
  user: SafeUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      sessionId?: string;
    }
  }
}
