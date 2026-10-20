export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export type AuthMode = 'signin' | 'signup';
