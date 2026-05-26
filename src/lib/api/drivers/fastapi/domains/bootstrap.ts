import { apiClient } from '../client';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import type { OnboardingPageData } from '$lib/types/account';

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  return apiClient.get<BootstrapPayload>('/bootstrap');
}

export async function fetchOnboarding(): Promise<OnboardingPageData> {
  return apiClient.get<OnboardingPageData>('/onboarding');
}
