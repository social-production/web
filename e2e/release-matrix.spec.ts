import { expect, test } from '@playwright/test';
import { createProjectViaUi, signUpViaUi, uniqueUser } from './helpers';

test.describe('Release readiness browser matrix', () => {
  test('auth signup lands on app shell', async ({ page }) => {
    const user = uniqueUser('auth');
    await signUpViaUi(page, user.username, user.password);
    await expect(page.getByText(user.username, { exact: true }).first()).toBeVisible({
      timeout: 20_000
    });
  });

  test('create productive project through UI and open detail', async ({ page }) => {
    const user = uniqueUser('proj');
    await signUpViaUi(page, user.username, user.password);
    const title = `E2E Productive ${Date.now()}`;
    await createProjectViaUi(page, {
      title,
      description: 'Browser-created productive project for release readiness.',
      modeLabel: /Productive/i
    });
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });
  });

  test('messages and platform pages load for signed-in user', async ({ page }) => {
    const user = uniqueUser('shell');
    await signUpViaUi(page, user.username, user.password);
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.locator('body')).toContainText(/message|conversation|chat|inbox/i);
    await page.goto('/platform');
    await expect(page).toHaveURL(/\/platform/);
    await expect(page.locator('body')).toContainText(/platform|moderator|board|volunteer/i);
  });

  test('create event and help-request pages are reachable', async ({ page }) => {
    const user = uniqueUser('forms');
    await signUpViaUi(page, user.username, user.password);
    await page.goto('/create/event');
    await expect(page.locator('body')).toContainText(/private|public|invite|event/i);
    await page.goto('/create/help-request');
    await expect(page.locator('body')).toContainText(/help|role|request/i);
  });
});
