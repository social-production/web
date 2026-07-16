import { apiClient, extractErrorMessage } from '../client';
import { markAuthenticatedSession, clearAuthenticatedSession } from '../auth';
import type { AuthResult, SignInInput, SignUpInput } from '$lib/types/account';

interface BackendAuthResponse {
  access_token: string;
  token_type: string;
}

export async function fetchSignIn(input: SignInInput): Promise<AuthResult> {
  try {
    await apiClient.post<BackendAuthResponse>('/auth/login', {
      username: input.username,
      password: input.password
    });
    markAuthenticatedSession();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Sign in failed') };
  }
}

export async function fetchSignUp(input: SignUpInput): Promise<AuthResult> {
  try {
    await apiClient.post<BackendAuthResponse>('/auth/register', {
      username: input.username,
      password: input.password,
      profile_bio: input.profileBio ?? null
    });
    markAuthenticatedSession();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Sign up failed') };
  }
}

export async function fetchSignOut(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearAuthenticatedSession();
  }
}
