import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Adjust this value based on the actual app title.
    await expect(page).toHaveTitle(/Bozorchi/);
});
