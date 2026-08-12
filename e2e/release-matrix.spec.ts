import { expect, test } from '@playwright/test';
import { createProjectViaUi, signUpViaUi, uniqueUser } from './helpers';

test.describe('Release readiness browser matrix', () => {
  test('auth signup lands on app shell', async ({ page }, testInfo) => {
    const user = uniqueUser('auth');
    await signUpViaUi(page, user.username, user.password);
    if (testInfo.project.name === 'firefox-mobile') {
      await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
    } else {
      await expect(page.getByText(user.username, { exact: true }).first()).toBeVisible({
        timeout: 20_000,
      });
    }
  });

  test('create productive project through UI and open detail', async ({ page }) => {
    const user = uniqueUser('proj');
    await signUpViaUi(page, user.username, user.password);
    const title = `E2E Productive ${Date.now()}`;
    await createProjectViaUi(page, {
      title,
      description: 'Browser-created productive project for release readiness.',
      modeLabel: /Productive/i,
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

  test('Firefox mobile messages stay above the browser footer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'firefox-mobile');
    const user = uniqueUser('firefox-mobile');
    await signUpViaUi(page, user.username, user.password);
    await page.goto('/messages');
    await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('.messages-shell')).toBeVisible();

    const layout = await page.evaluate(() => {
      const shell = document.querySelector('.messages-shell')?.getBoundingClientRect();
      const nav = document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect();
      return {
        shellBottom: shell?.bottom ?? 0,
        navTop: nav?.top ?? 0,
        viewportHeight: window.visualViewport?.height ?? window.innerHeight,
        syncedHeight: getComputedStyle(document.documentElement)
          .getPropertyValue('--shell-visual-viewport-height')
          .trim(),
      };
    });

    expect(layout.syncedHeight).not.toBe('');
    expect(layout.shellBottom).toBeLessThanOrEqual(layout.navTop + 1);
    expect(layout.navTop).toBeLessThanOrEqual(layout.viewportHeight);
  });

  test('a second user receives a direct message without refreshing', async ({
    browser,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium');
    const sender = uniqueUser('rts');
    const recipient = uniqueUser('rtr');
    const recipientContext = await browser.newContext();
    const recipientPage = await recipientContext.newPage();

    try {
      await signUpViaUi(page, sender.username, sender.password);
      await signUpViaUi(recipientPage, recipient.username, recipient.password);
      await recipientPage.goto('/messages');

      await page.goto('/messages');
      await page.getByLabel('Start a new message').click();
      await page.getByPlaceholder('Type a username').fill(recipient.username);
      const body = `Realtime message ${Date.now()}`;
      await page.getByPlaceholder('Write a message...').fill(body);
      await page.locator('.new-conversation-card').getByRole('button', { name: 'Send' }).click();

      await expect(recipientPage.getByText(body, { exact: true })).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await recipientContext.close();
    }
  });
});
