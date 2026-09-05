export type Profile = {
  id: number;
  userId: string;
  role: 'elder' | 'caregiver';
  fullName: string;
  email: string;
  preferredLanguage: 'English' | 'Hindi';
  caregiverName: string | null;
  relationship: string | null;
  shareMemory: boolean;
  connectionCode: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiMe = {
  profile: Profile | null;
  results: Array<Record<string, unknown>>;
  memories: Array<Record<string, unknown>>;
  stories: Array<Record<string, unknown>>;
  routines: Array<Record<string, unknown>>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function getMe() {
  return request<ApiMe>('/api/me');
}

export function createProfile(data: {
  fullName: string;
  email: string;
  role: 'elder' | 'caregiver';
  preferredLanguage: 'English' | 'Hindi';
  caregiverName?: string;
  relationship?: string;
}) {
  return request<Profile>('/api/me/profile', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProfile(data: Partial<Pick<Profile, 'preferredLanguage' | 'shareMemory'>>) {
  return request<Profile>('/api/me/profile', { method: 'PATCH', body: JSON.stringify(data) });
}

export function saveResult(result: Record<string, unknown>) {
  return request<Record<string, unknown>>('/api/me/results', { method: 'POST', body: JSON.stringify(result) });
}

export function saveMemory(memory: Record<string, unknown>) {
  return request<Record<string, unknown>>('/api/me/memories', { method: 'POST', body: JSON.stringify(memory) });
}

export function deleteMemory(id: string) {
  return request<void>(`/api/me/memories/${id}`, { method: 'DELETE' });
}

export function saveStory(story: Record<string, unknown>) {
  return request<Record<string, unknown>>('/api/me/stories', { method: 'POST', body: JSON.stringify(story) });
}

export function saveRoutine(routine: Record<string, unknown>) {
  return request<Record<string, unknown>>('/api/me/routines', { method: 'POST', body: JSON.stringify(routine) });
}

export function updateRoutine(id: string, completed: boolean) {
  return request<Record<string, unknown>>(`/api/me/routines/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
}

export function deleteRoutine(id: string) {
  return request<void>(`/api/me/routines/${id}`, { method: 'DELETE' });
}

export function connectCaregiver(code: string) {
  return request<{ connected: boolean; elder: { userId: string; fullName: string } }>('/api/caregiver/connections', { method: 'POST', body: JSON.stringify({ code }) });
}

export function getCaregiverOverview() {
  return request<{ connected: boolean; isDemo: boolean; profile: Profile | null; results: Array<Record<string, unknown>>; routines: Array<Record<string, unknown>>; memories: Array<Record<string, unknown>> }>('/api/caregiver/overview');
}