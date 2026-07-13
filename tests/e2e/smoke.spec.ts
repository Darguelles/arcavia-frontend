import { test, expect } from '@playwright/test'

/**
 * Public-surface smoke tests — these run WITHOUT a backend.
 * The full user flows in spec §14.2 (register→login→browse, scan-and-answer,
 * category-threshold completion, out-of-range scan, avatar upload, reward earned)
 * require the API on :8000 and belong in flows.spec.ts once seed data exists.
 */

test('home renders marketing CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /gamificación urbana/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Regístrate' }).first()).toBeVisible()
})

test('home → register navigates to the sign-up form', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Regístrate' }).first().click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByLabel('Correo')).toBeVisible()
  await expect(page.getByLabel('Fecha de nacimiento')).toBeVisible()
  await expect(page.getByText(/términos y condiciones/i).first()).toBeVisible()
})

test('unauthenticated access to /missions redirects to login with return-to', async ({ page }) => {
  await page.goto('/missions')
  await expect(page).toHaveURL(/\/login\?returnTo=/)
})

test('register form blocks submit without consent + shows validation', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByText('Ingresa tu nombre')).toBeVisible()
  await expect(page.getByText('Debes aceptar los términos y condiciones')).toBeVisible()
})
