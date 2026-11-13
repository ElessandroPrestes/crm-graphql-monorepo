import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { gotoAuthenticated, login } from './helpers/auth';

const PAGES = [
  { path: '/', heading: 'Dashboard', readyText: 'Negócios abertos' },
  { path: '/contacts', heading: 'Contatos', readyText: 'Buscar contatos' },
  { path: '/pipeline', heading: 'Pipeline', readyText: 'Valor em aberto' },
  { path: '/inbox', heading: 'Inbox', readyText: 'Buscar conversas' },
] as const;

async function analyze(page: Page, name: string, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await testInfo.attach(`${name}-axe`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(
    blocking,
    blocking
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.help} -> ${violation.nodes
            .map((node) => node.target.join(' '))
            .join(', ')}`,
      )
      .join('\n'),
  ).toEqual([]);
}

test.describe('acessibilidade automatizada', () => {
  test('axe nas páginas principais nos temas claro e escuro', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('nexo.theme', 'light'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await analyze(page, 'login-light', testInfo);

    await login(page);
    await expect(page.getByText('Negócios abertos')).toBeVisible();
    await analyze(page, 'dashboard-light', testInfo);

    for (const item of PAGES.slice(1)) {
      await gotoAuthenticated(page, item.path);
      await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
      await expect(page.getByText(item.readyText)).toBeVisible();
      await analyze(page, `${item.heading.toLowerCase()}-light`, testInfo);
    }

    await page.evaluate(() => localStorage.setItem('nexo.theme', 'dark'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await analyze(page, 'dashboard-dark', testInfo);

    for (const item of PAGES.slice(1)) {
      await gotoAuthenticated(page, item.path);
      await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
      await expect(page.getByText(item.readyText)).toBeVisible();
      await analyze(page, `${item.heading.toLowerCase()}-dark`, testInfo);
    }
  });

  test('teclado e reflow em 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('E-mail')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeFocused();

    await login(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
    await page.keyboard.press('Enter');

    const menuButton = page.getByRole('button', { name: 'Abrir menu' });
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();

    for (const item of PAGES) {
      await gotoAuthenticated(page, item.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${item.path} não deve exigir rolagem horizontal em 320px`).toBeLessThan(2);
    }
  });
});
