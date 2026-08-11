import { apiClient, extractErrorMessage, authSignIn, authSignOut, authSignUp } from '../client';
import { clearAuthenticatedSession, usernameToAuthEmail } from '../authSession';
import type { AuthResult, SignInInput, SignUpInput } from '$lib/types/account';
import type { AppAdapter } from '$lib/services/adapters/types';

export async function fetchSignIn(input: SignInInput): Promise<AuthResult> {
  try {
    await authSignIn(usernameToAuthEmail(input.username), input.password);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Sign in failed') };
  }
}

export async function fetchSignUp(input: SignUpInput): Promise<AuthResult> {
  try {
    await authSignUp(usernameToAuthEmail(input.username), input.password, {
      username: input.username.trim(),
      profile_bio: input.profileBio ?? null
    });
    // Ensure app profile username is set (trigger may race / use email local-part).
    try {
      await apiClient.patch('/users/me/settings', {
        username: input.username.trim(),
        bio: input.profileBio ?? null
      });
    } catch {
      // Non-fatal: trigger handle_new_auth_user should still create the row.
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Sign up failed') };
  }
}

export async function fetchSignOut(): Promise<void> {
  try {
    await authSignOut();
  } finally {
    clearAuthenticatedSession();
  }
}

export const authDomain: Partial<AppAdapter> = {
  signIn: fetchSignIn,
  signUp: fetchSignUp,
  signOut: fetchSignOut
};
