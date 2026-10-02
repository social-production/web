import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from './OnboardingPage.svelte';

vi.mock('$lib/config/env', () => ({
  SIGNUP_ENABLED: false,
  PWA_ENABLED: false,
  PUSH_ENABLED: false,
  TURNSTILE_SITE_KEY: '',
  parseFlag: (value: string | undefined, fallback: boolean) => fallback
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: unknown) => void) {
      run({
        url: new URL('http://localhost/onboarding?mode=signup'),
        data: { bootstrap: { viewer: null } }
      });
      return () => {};
    }
  }
}));

afterEach(() => {
  cleanup();
});

describe('OnboardingPage when signup is closed', () => {
  it('hides signup and explains that new accounts are closed', () => {
    render(OnboardingPage, {
      props: {
        data: {
          title: 'Sign in or create an account',
          intro: 'Sign in to take part.',
          accountModes: [
            { value: 'signup', label: 'Sign up', description: 'Create a new account.' },
            { value: 'login', label: 'Log in', description: 'Use an existing account.' }
          ],
          starterChannels: [],
          starterCommunities: []
        }
      }
    });

    expect(screen.queryByRole('tab', { name: 'Sign up' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByText('Signups are currently closed. Log in if you already have an account.')).toBeTruthy();
  });
});
