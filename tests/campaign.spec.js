import { expect, test } from '@playwright/test';

test('Marketing Digital demonstra a campanha e pré-seleciona o serviço no contato', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    document.addEventListener('click', event => {
      if (event.target.closest('[data-draft]')) event.preventDefault();
    });
  });
  await page.goto('/');
  const showcase = page.locator('#marketing');
  await expect(showcase.getByText('Campanha-conceito', { exact: true })).toBeVisible();
  await expect(showcase.getByRole('heading', { level: 3 })).toHaveText([
    'Anúncio', 'Página da campanha', 'Pedido de orçamento'
  ]);
  const image = showcase.locator('img').first();
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);

  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });

  const contact = page.locator('#contato');
  const service = contact.getByLabel('Serviço de interesse');
  await page.locator('#servicos').getByRole('link', { name: /Marketing Digital/ }).click();
  await expect(page).toHaveURL(/#contato$/);
  await expect(service).toHaveValue('Marketing Digital');
  await contact.getByLabel('Seu nome').fill('Pessoa Teste');
  await contact.getByLabel('Seu e-mail').fill('teste@example.com');
  await contact.getByLabel('Sobre o projeto').fill('Quero divulgar os meus serviços na cidade.');
  await service.selectOption('Site institucional');

  await showcase.getByRole('link', { name: 'Quero planejar uma campanha' }).click();
  await expect(page).toHaveURL(/#contato$/);
  await expect(service).toHaveValue('Marketing Digital');
  await expect(contact.getByLabel('Seu nome')).toHaveValue('Pessoa Teste');
  await contact.getByRole('button', { name: 'Abrir no e-mail' }).click();
  const draft = new URL(await contact.getByRole('link', { name: 'Reabrir rascunho' }).getAttribute('href'));
  expect(draft.searchParams.get('subject')).toBe('Novo projeto | Marketing Digital');
  expect(draft.searchParams.get('body')).toContain('Serviço: Marketing Digital');
});
