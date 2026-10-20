import type { User } from './types.ts';

const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
      credentials: 'include', // Ensure cookies are sent and received
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: json.error || `Request failed with status ${res.status}` };
    }

    return { data: json };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { error: message };
  }
}

export const api = {
  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return request<{ user: User }>('/auth/me', { method: 'GET' });
  },

  async login(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<ApiResponse<{ user: User }>> {
    return request<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};
