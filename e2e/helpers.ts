import { expect, type Page } from '@playwright/test';

export function uniqueUser(prefix = 'e2e'): { username: string; password: string } {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `${prefix}${stamp}`.replace(/[^a-z0-9]/gi, '').slice(0, 20),
    password: 'password123'
  };
}

async function waitForOnboardingForm(page: Page) {
  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 45_000 });
}

export async function signUpViaUi(page: Page, username: string, password: string) {
  await waitForOnboardingForm(page);
  await page.getByRole('tab', { name: 'Sign up', exact: true }).click();
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 45_000 });
}

export async function signInViaUi(page: Page, username: string, password: string) {
  await waitForOnboardingForm(page);
  await page.getByRole('tab', { name: 'Log in', exact: true }).click();
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 45_000 });
}

async function clickWizardContinue(page: Page) {
  const next = page.getByRole('button', { name: /Continue|Next/i }).last();
  await expect(next).toBeEnabled({ timeout: 10_000 });
  await next.click();
}

export async function createProjectViaUi(
  page: Page,
  opts: { title: string; description: string; modeLabel?: RegExp }
) {
  await page.goto('/create/project', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Create project' })).toBeVisible();

  if (opts.modeLabel) {
    const modeOption = page.locator('main').getByText(opts.modeLabel).first();
    if (await modeOption.isVisible().catch(() => false)) {
      await modeOption.click();
    }
  }
  await clickWizardContinue(page);

  // Basics
  await page.locator('main label').filter({ hasText: /^Title/ }).locator('input').fill(opts.title);
  await page
    .locator('main label')
    .filter({ hasText: /Proposal description|Description/i })
    .locator('textarea')
    .fill(opts.description);
  await clickWizardContinue(page);

  // Location — accept default / online / TBD
  const online = page.getByRole('button', { name: /^Online$/i });
  if (await online.isVisible().catch(() => false)) {
    await online.click();
  }
  await clickWizardContinue(page);

  // Scope — tag Platform channel
  const channelInput = page
    .locator('main')
    .getByPlaceholder(/search channels|Type to search channels/i)
    .first();
  await channelInput.fill('platform');
  const suggestion = page.locator('main').getByRole('button', { name: /^Platform$/i }).first();
  await expect(suggestion).toBeVisible({ timeout: 10_000 });
  await suggestion.click();
  await expect(channelInput).toHaveValue('');
  await clickWizardContinue(page);

  // Overview → submit
  await page.getByRole('button', { name: /Create Project/i }).click();
  await page.waitForURL(/\/projects\//, { timeout: 60_000 });
}
