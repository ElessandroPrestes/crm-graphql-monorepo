import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const PUBLIC_ROUTES = [{ path: '/login', heading: 'Nexo CRM', readyText: 'E-mail' }] as const;

const PROTECTED_ROUTES = [
  { path: '/', heading: 'Dashboard', readyText: 'Negócios abertos' },
  { path: '/contacts', heading: 'Contatos', readyText: 'Buscar contatos' },
  { path: '/pipeline', heading: 'Pipeline', readyText: 'Valor em aberto' },
  { path: '/inbox', heading: 'Inbox', readyText: 'Buscar conversas' },
] as const;

const ALL_ROUTES = [...PUBLIC_ROUTES, ...PROTECTED_ROUTES];

async function analyzeAxe(page: Page, name: string, testInfo: TestInfo): Promise<void> {
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
            .join(', ')} on ${page.url()}`,
      )
      .join('\n'),
  ).toEqual([]);
}

async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto('/');
  const signOut = page.getByRole('button', { name: /Sair/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await expect(page).toHaveURL(/\/login$/);
  }
}

async function ensureLoggedIn(page: Page): Promise<void> {
  await page.goto('/login');
  const heading = await page.getByRole('heading', { level: 1 });
  if (await heading.isVisible().catch(() => false)) {
    await page.getByLabel('E-mail').fill('admin@nexo.local');
    await page.getByLabel('Senha', { exact: true }).fill('NexoDemo!2026');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  }
}

test.describe('AC-612 — acessibilidade automatizada (projeto a11y)', () => {
  test.describe('axe-core nas rotas públicas e protegidas', () => {
    for (const route of ALL_ROUTES) {
      test(`axe: ${route.path} (tema claro)`, async ({ page }, testInfo) => {
        if (route.path === '/login') {
          await ensureLoggedOut(page);
          await page.goto('/login');
          await expect(page.getByLabel('E-mail')).toBeVisible();
          await ensureLoggedIn(page);
        } else {
          await ensureLoggedIn(page);
          await page.goto(route.path);
          await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        }
        await analyzeAxe(page, `${route.path.replace(/\//g, '-')}-light`, testInfo);
      });

      test(`axe: ${route.path} (tema escuro)`, async ({ page }, testInfo) => {
        if (route.path === '/login') {
          await ensureLoggedOut(page);
          await page.evaluate(() => localStorage.setItem('nexo.theme', 'dark'));
          await page.goto('/login');
          await expect(page.getByLabel('E-mail')).toBeVisible();
          await page.reload();
          await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
          await analyzeAxe(page, `${route.path.replace(/\//g, '-')}-dark`, testInfo);
          await ensureLoggedIn(page);
          return;
        }
        await ensureLoggedIn(page);
        await page.goto(route.path);
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        await page.evaluate(() => localStorage.setItem('nexo.theme', 'dark'));
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await analyzeAxe(page, `${route.path.replace(/\//g, '-')}-dark`, testInfo);
      });
    }
  });

  test.describe('axe-core com conteúdos abertos (modais e menus)', () => {
    test('diálogo "Novo contato" aberto em /contacts', async ({ page }, testInfo) => {
      await ensureLoggedIn(page);
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Novo contato' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await analyzeAxe(page, 'contacts-novo-contato-dialog', testInfo);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('menu "Mover para…" aberto em /pipeline', async ({ page }, testInfo) => {
      await ensureLoggedIn(page);
      await page.goto('/pipeline');
      const card = page
        .locator('li')
        .filter({ hasText: /Renovação Acme/ })
        .first();
      await expect(card).toBeVisible();
      const summary = card.locator('summary');
      await summary.click();
      await expect(card.getByRole('button', { name: 'Mover para Qualificado' })).toBeVisible();
      await analyzeAxe(page, 'pipeline-mover-para-menu', testInfo);
      await summary.click();
      await expect(card.getByRole('button', { name: 'Mover para Qualificado' })).not.toBeVisible();
    });
  });

  test.describe('zoom 200% (viewport 640x400)', () => {
    for (const route of PROTECTED_ROUTES) {
      test(`sem scroll horizontal e main visível: ${route.path}`, async ({ page }) => {
        await ensureLoggedIn(page);
        await page.setViewportSize({ width: 640, height: 400 });
        await page.goto(route.path);
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route.path} não deve exigir rolagem horizontal a 200%`).toBeLessThan(2);
        await expect(page.getByRole('main')).toBeVisible();
      });
    }
  });

  test.describe('reflow WCAG 1.4.10 (viewport 320x256)', () => {
    for (const route of PROTECTED_ROUTES) {
      test(`sem scroll horizontal: ${route.path}`, async ({ page }) => {
        await ensureLoggedIn(page);
        await page.setViewportSize({ width: 320, height: 256 });
        await page.goto(route.path);
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route.path} não deve exigir rolagem horizontal a 320px`).toBeLessThan(
          2,
        );
      });
    }
  });

  test.describe('navegação por teclado', () => {
    test('login: foco visível por Tab, sem armadilha', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto('/login');
      await expect(page.getByLabel('E-mail')).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('E-mail')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
      await ensureLoggedIn(page);
    });

    test('páginas protegidas: link pular para conteúdo, menu mobile, foco visível', async ({
      page,
    }) => {
      await ensureLoggedIn(page);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeVisible();

      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
      const menuButton = page.getByRole('button', { name: 'Abrir menu' });
      await menuButton.click();
      await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeFocused();
    });

    test('modal de contato: abre, fecha com Esc e devolve foco ao gatilho', async ({ page }) => {
      await ensureLoggedIn(page);
      await page.goto('/contacts');
      const trigger = page.getByRole('button', { name: 'Novo contato' });
      await trigger.focus();
      await trigger.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });

    test('dropdown do pipeline: abre, fecha com clique e devolve foco ao gatilho', async ({
      page,
    }) => {
      await ensureLoggedIn(page);
      await page.goto('/pipeline');
      const card = page
        .locator('li')
        .filter({ hasText: /Renovação Acme/ })
        .first();
      await expect(card).toBeVisible();
      const summary = card.locator('summary');
      await summary.focus();
      await summary.click();
      await expect(card.getByRole('button', { name: 'Mover para Qualificado' })).toBeVisible();
      await summary.click();
      await expect(card.getByRole('button', { name: 'Mover para Qualificado' })).not.toBeVisible();
      await expect(summary).toBeFocused();
    });
  });

  test.describe('árvore de acessibilidade (landmarks e títulos via getByRole)', () => {
    for (const route of PROTECTED_ROUTES) {
      test(`landmarks e títulos: ${route.path}`, async ({ page }) => {
        await ensureLoggedIn(page);
        await page.goto(route.path);
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
        await expect(page.getByRole('banner')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      });
    }
  });
});
