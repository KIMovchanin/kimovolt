import type { UserProgressState } from '@kimovolt/content';
import type { CircuitDocument } from '@kimovolt/simulation';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SavedCircuitRecord {
  id: string;
  name: string;
  document: CircuitDocument;
  updatedAt: string;
}

class ApiClient {
  private csrfToken = '';

  setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    const method = (init.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && this.csrfToken) {
      headers.set('X-CSRF-Token', this.csrfToken);
    }

    const res = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    });

    const newCsrf = res.headers.get('X-CSRF-Token');
    if (newCsrf) {
      this.csrfToken = newCsrf;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async health(): Promise<{ status: string; version: string }> {
    return this.request('/api/v1/health');
  }

  async me(): Promise<{ user: AuthUser | null; csrfToken?: string }> {
    const res = await this.request<{ user: AuthUser | null; csrfToken?: string }>('/api/v1/auth/me');
    if (res.csrfToken) this.csrfToken = res.csrfToken;
    return res;
  }

  async register(email: string, password: string, displayName: string): Promise<{ user: AuthUser; csrfToken: string }> {
    const res = await this.request<{ user: AuthUser; csrfToken: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    this.csrfToken = res.csrfToken;
    return res;
  }

  async login(email: string, password: string): Promise<{ user: AuthUser; csrfToken: string }> {
    const res = await this.request<{ user: AuthUser; csrfToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.csrfToken = res.csrfToken;
    return res;
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', { method: 'POST' });
    this.csrfToken = '';
  }

  async migrateGuest(
    progress: UserProgressState,
    circuits: SavedCircuitRecord[]
  ): Promise<{ progress: UserProgressState; circuits: SavedCircuitRecord[] }> {
    return this.request('/api/v1/sync/migrate-guest', {
      method: 'POST',
      body: JSON.stringify({ progress, circuits }),
    });
  }

  async fetchProgress(): Promise<{ progress: UserProgressState }> {
    return this.request('/api/v1/progress');
  }

  async saveProgress(progress: UserProgressState): Promise<{ ok: boolean }> {
    return this.request('/api/v1/progress', {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  async listCircuits(): Promise<{ circuits: SavedCircuitRecord[] }> {
    return this.request('/api/v1/circuits');
  }

  async upsertCircuit(record: SavedCircuitRecord): Promise<{ circuit: SavedCircuitRecord }> {
    return this.request('/api/v1/circuits', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async deleteCircuit(id: string): Promise<{ ok: boolean }> {
    return this.request(`/api/v1/circuits/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
