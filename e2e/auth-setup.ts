import { test as setup } from '@playwright/test';
import { login, USERS } from './helpers/auth';

const authFile = 'e2e/.auth/user.json';

setup('faz login com usuário do seed e salva storageState', async ({ page }) => {
  await login(page, USERS.admin.email);
  await page.context().storageState({ path: authFile });
});
