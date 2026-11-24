import { expect, test } from '@playwright/test';

test('Contato mostra o e-mail oficial, permite copiar e prepara um rascunho válido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: async value => { window.copiedEmail = value; }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-draft]')) return;
      event.preventDefault();
    });
  });

  await page.goto('/');
  await page.locator('.nav--right').getByRole('link', { name: 'Contato' }).click();
  await expect(page).toHaveURL(/#contato$/);
  const contact = page.locator('#contato');
  const address = 'cortextechfloripa@gmail.com';
  await expect(contact.getByRole('link', { name: address })).toHaveAttribute('href', 'mailto:' + address);
  await contact.getByRole('button', { name: 'Copiar e-mail' }).click();
  await expect(contact.getByRole('status')).toHaveText('E-mail copiado.');
  expect(await page.evaluate(() => window.copiedEmail)).toBe(address);

  const send = contact.getByRole('button', { name: 'Abrir no e-mail' });
  const draft = contact.getByRole('link', { name: 'Reabrir rascunho' });
  await send.click();
  await expect(contact.getByLabel('Seu nome')).toBeFocused();
  await expect(draft).toBeHidden();
  await contact.getByLabel('Seu nome').fill('Pessoa Teste');
  await contact.getByLabel('Seu e-mail').fill('teste@example.com');
  await contact.getByLabel('Serviço de interesse').selectOption('Sistema web');
  await contact.getByLabel('Sobre o projeto').fill('   ');
  await send.click();
  await expect(draft).toBeHidden();
  await expect(contact.getByLabel('Sobre o projeto')).toBeFocused();
  await contact.getByLabel('Sobre o projeto').fill('Vamos integrar CRM & vendas?');
  await send.click();
  await expect(draft).toBeVisible();
  const url = new URL(await draft.getAttribute('href'));
  expect(url.pathname).toBe(address);
  expect(url.searchParams.get('subject')).toBe('Novo projeto | Sistema web');
  expect(url.searchParams.get('body')).toContain('Vamos integrar CRM & vendas?');
  expect(url.searchParams.get('body')).toContain('E-mail para retorno: teste@example.com');
});

test('Equipe mantém dez retratos, permite navegar por botão ou teclado e respeita movimento reduzido', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#equipe');
  const team = page.locator('#equipe');
  const track = team.locator('#team-track');
  const images = await track.locator('img').evaluateAll(elements => elements.map(element => element.src));
  expect(images).toHaveLength(10);
  const responses = await Promise.all(images.map(src => request.get(src)));
  expect(responses.every(response => response.ok() && response.headers()['content-type'] === 'image/webp')).toBe(true);
  await expect(team.getByRole('heading', { name: 'Henrique Vasconcelos' })).toBeVisible();
  await expect(team.getByRole('heading', { name: 'Clara Montenegro' })).toBeVisible();
  await expect(team.getByRole('button', { name: 'Movimento automático' })).toBeHidden();

  const next = team.getByRole('button', { name: 'Próximo perfil' });
  const previous = team.getByRole('button', { name: 'Perfil anterior' });
  const offset = () => track.evaluate(element => element.scrollLeft);
  await expect(previous).toBeDisabled();
  await next.click();
  await expect.poll(offset).toBeGreaterThan(0);
  await track.press('ArrowLeft');
  await expect.poll(offset).toBe(0);
});

test('Equipe se move em tela e oferece controle para pausar', async ({ page }) => {
  await page.clock.install();
  await page.goto('/#equipe');
  const track = page.locator('#team-track');
  await track.scrollIntoViewIfNeeded();
  const auto = page.getByRole('button', { name: 'Movimento automático' });
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await page.clock.fastForward(5800);
  const offset = () => track.evaluate(element => element.scrollLeft);
  await expect.poll(offset).toBeGreaterThan(0);
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await auto.blur();
  const paused = await offset();
  await page.clock.fastForward(5800);
  expect(await offset()).toBe(paused);
});
