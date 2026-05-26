import { apiClient } from '../client';
import { storeToken, clearToken } from '../auth';
import type { AuthResult, SignInInput, SignUpInput } from '$lib/types/account';

interface BackendAuthResponse {
  access_token: string;
  token_type: string;
}

export async function fetchSignIn(input: SignInInput): Promise<AuthResult> {
  try {
    const res = await apiClient.post<BackendAuthResponse>('/auth/login', {
      username: input.username,
      password: input.password
    });
    storeToken(res.access_token);
    return { ok: true };
  } catch (err) {
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Sign in failed';
    return { ok: false, error: message };
  }
}

export async function fetchSignUp(input: SignUpInput): Promise<AuthResult> {
  try {
    const res = await apiClient.post<BackendAuthResponse>('/auth/register', {
      username: input.username,
      password: input.password,
      profile_bio: input.profileBio ?? null
    });
    storeToken(res.access_token);
    return { ok: true };
  } catch (err) {
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Sign up failed';
    return { ok: false, error: message };
  }
}

export async function fetchSignOut(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearToken();
  }
}
