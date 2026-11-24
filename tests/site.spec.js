import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function fillIdea(page) {
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Nome da empresa').fill('Estúdio Mosaico');
  await page.getByLabel('Ramo de atuação').fill('Arquitetura');
  await page.getByLabel('Principal objetivo').selectOption('Mostrar meus serviços');
  await page.getByLabel('Descrição da ideia').fill('Quero apresentar projetos de arquitetura.');
  await page.getByRole('button', { name: 'Continuar' }).click();
}

async function fillContact(page) {
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Nome do responsável').fill('Pessoa Teste');
  await page.getByLabel('E-mail', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Prazo desejado').selectOption('Entre 1 e 3 meses');
  await page.getByRole('checkbox', { name: 'Autorizo o contato', exact: false }).check();
}

test('carrega a página, o cérebro e a navegação sem erros de página e assets', async ({ page }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('response', res => { if (res.status() >= 400) failures.push(res.status() + ' ' + res.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ganhar vida.');
  const canvas = page.locator('.brain-canvas');
  await expect(canvas).toHaveAttribute('data-ready', /^(true|fallback)$/);
  if (process.env.PLAYWRIGHT_SOFTWARE_WEBGL === '1') {
    await expect(canvas).toHaveAttribute('data-ready', 'true');
    const drag = page.locator('.brain-target');
    const bounds = await drag.boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .45);
    await page.mouse.down();
    await expect(drag).toHaveClass(/dragging/);
    await page.mouse.move(bounds.x + bounds.width * .66, bounds.y + bounds.height * .48, { steps: 6 });
    await page.mouse.up();
    await expect(drag).not.toHaveClass(/dragging/);
    await page.getByRole('button', { name: 'Girar o cérebro para a direita' }).press('Enter');
  }
  await page.getByRole('link', { name: 'Explorar projetos' }).click();
  await expect(page).toHaveURL(/#projetos$/);
  await expect(page.locator('.project img').last()).toBeVisible();
  expect(failures).toEqual([]);
});

test('usa a imagem estática se WebGL estiver indisponível', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.brain-canvas')).toHaveAttribute('data-ready', 'fallback');
  const image = page.getByAltText('Cérebro em grafite com conexões em laranja');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.brain-controls')).toBeHidden();
});

test('em celular o menu funciona por teclado e as seções não criam rolagem lateral', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.press('Enter');
  const panel = page.getByRole('navigation', { name: 'Navegação móvel' });
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await panel.getByRole('link', { name: 'Contato' }).click();
  await expect(page).toHaveURL(/#contato$/);
  await expect(panel).toBeHidden();
  await expect(page.locator('#contato')).toBeFocused();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 667 : 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await expect(page.locator('.brain-controls')).toBeHidden();
});

test('valida etapas, atualiza a prévia, edita o resumo e conclui a demonstração', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: /Lojas Virtuais/ }).click();
  await expect(page.getByRole('radio', { name: /Loja Virtual/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByLabel('Nome da empresa')).toBeFocused();
  await expect(page.getByText('Informe o nome da empresa.')).toBeVisible();
  await page.getByRole('button', { name: /Voltar/ }).click();
  await fillIdea(page);
  await page.getByRole('checkbox', { name: 'Portfólio' }).check();
  await page.getByRole('checkbox', { name: 'Galeria' }).check();
  await page.getByLabel('Preferência visual').selectOption('Criativo');
  await page.getByLabel('Cor de destaque').fill('#50ad87');
  await expect(page.locator('[data-preview-style]')).toHaveAttribute('data-preview-style', 'Criativo');
  await expect(page.locator('[data-preview-name]')).toHaveText('Estúdio Mosaico');
  await expect(page.locator('[data-preview-pages]')).toContainText('Portfólio');
  await fillContact(page);
  await page.getByRole('textbox', { name: /^WhatsApp/ }).fill('123');
  await page.getByRole('button', { name: 'Copiar resumo' }).click();
  await expect(page.getByText(/Informe o DDD/)).toBeVisible();
  await page.getByRole('textbox', { name: /^WhatsApp/ }).fill('(11) 98765-4321');
  await page.getByRole('button', { name: 'Editar ideia' }).click();
  await expect(page.getByLabel('Nome da empresa')).toHaveValue('Estúdio Mosaico');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Modo demonstração.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Copiar resumo' }).click();
  await expect(page.locator('#briefing').getByRole('status')).toHaveText('Resumo copiado.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Cor de destaque: #50ad87');
  expect(text).toContain('WhatsApp: (11) 98765-4321');
  expect(text).toContain('Páginas: Início, Sobre, Portfólio');
});

test('envio configurado exibe falha e confirma recebimento só depois do aceite', async ({ page }) => {
  const attempts = [];
  await page.route('**/api/briefings', async route => {
    attempts.push(route.request().postDataJSON());
    await route.fulfill(attempts.length === 1
      ? { status: 200, json: { accepted: false } }
      : { status: 201, json: { accepted: true, id: 'receipt-demo' } });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:5191/#briefing');
  await fillIdea(page);
  await fillContact(page);
  const send = page.getByRole('button', { name: 'Enviar briefing' });
  await send.click();
  await expect(page.locator('#briefing').getByRole('status')).toContainText('O recebimento não foi confirmado.');
  await send.click();
  await expect(page.locator('#briefing').getByRole('status')).toContainText('Briefing enviado.');
  expect(attempts[0]).toEqual(attempts[1]);
  expect(attempts[1]).toMatchObject({ company: 'Estúdio Mosaico', email: 'demo@example.com', consent: true });
  await send.click();
  await expect(page.locator('#briefing').getByRole('status')).toHaveText('Este briefing já foi enviado.');
  expect(attempts).toHaveLength(2);
});

test('audita WCAG A e AA na landing e no briefing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
