import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page by default', async ({ page }) => {
        await page.goto('/');

        // Should see the login form with "Welcome Back" heading
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
        await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    });

    test('should have Google sign-in button on login page', async ({ page }) => {
        await page.goto('/');

        // Check for Google sign-in option
        await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
        await page.goto('/');

        // Click on signup link (it's a button-styled link saying "Sign up")
        await page.getByRole('button', { name: /sign up/i }).click();

        // Should see the signup form heading
        await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    });

    test('should have Sign In button on login form', async ({ page }) => {
        await page.goto('/');

        // Should have the submit button
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should update page title based on view', async ({ page }) => {
        await page.goto('/');

        // Login page should have 'Login' title
        await expect(page).toHaveTitle(/login/i);
    });
});
