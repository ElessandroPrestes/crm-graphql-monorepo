import { expect, test } from '@playwright/test';
import { gotoAuthenticated, login, USERS } from './helpers/auth';

test.describe('fluxos críticos', () => {
  test('login, contato, negócio, kanban, inbox e dashboard', async ({ page }, testInfo) => {
    const unique = Date.now();
    const stamp = `${testInfo.project.name}-${unique}`;
    const contactName = `E2E ${stamp}`;
    const dealTitle = `Negócio ${stamp}`;
    const phone = `+55 11 9${String(unique).slice(-8)}`;

    await login(page);

    await expect(page.getByText('Negócios abertos')).toBeVisible();
    await expect(page.getByText('Negócios ganhos')).toBeVisible();

    await gotoAuthenticated(page, '/contacts');
    await expect(page.getByRole('heading', { level: 1, name: 'Contatos' })).toBeVisible();

    await page.getByRole('button', { name: 'Novo contato' }).click();
    await page.getByLabel('Nome', { exact: true }).fill('E2E');
    await page.getByLabel('Sobrenome').fill(stamp);
    await page.getByLabel('E-mail').fill(`e2e-${stamp}@example.com`);
    await page.getByLabel('Telefone').fill(phone);
    await page.getByRole('button', { name: 'Criar contato' }).click();
    await expect(page.getByText('Contato criado com sucesso.')).toBeVisible();

    await page.getByLabel('Buscar contatos').fill(stamp);
    const contactLink = page.getByRole('link', { name: `Abrir contato ${contactName}` });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page.getByRole('heading', { level: 1, name: contactName })).toBeVisible();

    await page.getByRole('button', { name: 'Novo negócio' }).first().click();
    await page.getByLabel('Título do negócio').fill(dealTitle);
    await page.getByLabel('Valor (R$)').fill('1.500,00');
    await page.getByRole('button', { name: 'Criar negócio' }).click();
    await expect(page.getByText(dealTitle)).toBeVisible();

    await gotoAuthenticated(page, '/pipeline');
    const card = page.locator('li').filter({ hasText: dealTitle });
    await expect(card).toBeVisible();
    await card.locator('summary').click();
    await card.getByRole('button', { name: 'Mover para Qualificado' }).click();
    await expect(page.getByText('Negócio movido para Qualificado.')).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Qualificado' }).getByText(dealTitle),
    ).toBeVisible();

    await gotoAuthenticated(page, '/inbox');
    await expect(page.getByRole('heading', { level: 1, name: 'Inbox' })).toBeVisible();
    const conversationLink = page.getByRole('list', { name: 'Inbox' }).getByRole('link').first();
    await expect(conversationLink).toBeVisible();
    await conversationLink.click();
    await expect(page.getByLabel('Mensagem')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Conversa' })).toBeVisible();

    await gotoAuthenticated(page, '/');
    await expect(page.getByText('Negócios abertos')).toBeVisible();
    await page.getByLabel('Período').selectOption('30');
    await expect(page.getByRole('heading', { name: 'Negócios por etapa' })).toBeVisible();
  });

  test('login inválido mantém mensagem genérica', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(USERS.admin.email);
    await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');
    await expect(page).toHaveURL(/\/login$/);
  });
});
