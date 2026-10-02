import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from './OnboardingPage.svelte';

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

const data = {
  title: 'Sign in or create an account',
  intro: 'Sign in to take part.',
  accountModes: [
    { value: 'signup', label: 'Sign up', description: 'Create a new account.' },
    { value: 'login', label: 'Log in', description: 'Use an existing account.' }
  ],
  starterChannels: [],
  starterCommunities: []
};

describe('OnboardingPage signup', () => {
  it('shows the signup form when signup is enabled', () => {
    render(OnboardingPage, { props: { data } });
    expect(screen.getByRole('tab', { name: 'Sign up' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(screen.queryByText('Signups are currently closed. Log in if you already have an account.')).toBeNull();
  });
});
