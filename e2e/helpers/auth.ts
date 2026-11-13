import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'NexoDemo!2026';
export const USERS = {
  admin: { email: 'admin@nexo.local', name: 'Ana Admin' },
  sellerOne: { email: 'vendedor1@nexo.local', name: 'Vera Vendas' },
  sellerTwo: { email: 'vendedor2@nexo.local', name: 'Vitor Vendas' },
} as const;

export async function login(page: Page, email: string = USERS.admin.email): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
}

export async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
