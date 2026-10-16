import { expect, test } from '@playwright/test';
import { createProjectViaUi, signUpViaUi, uniqueUser } from './helpers';

test.describe('Phase names and chrome', () => {
  test('an empty required field names itself, and a create is confirmed', async ({ page }) => {
    const user = uniqueUser('chrome');
    await signUpViaUi(page, user.username, user.password);

    await page.goto('/create/project', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Continue/i }).last().click();
    await page.getByRole('button', { name: /Continue/i }).last().click();
    await expect(page.getByText('Title, Description are required.')).toBeVisible();

    const title = `E2E Chrome ${Date.now()}`;
    await createProjectViaUi(page, {
      title,
      description: 'Checks confirmations and icon tooltips.',
      modeLabel: /Productive/i
    });
    await expect(page.getByText('Project created')).toBeVisible();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });

    const join = page.locator('#participation-join');
    if (await join.count()) {
      await expect(join.first()).toHaveAttribute('title', /.+/);
    }
  });
});
