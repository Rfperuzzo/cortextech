import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('o arrasto horizontal gira o cérebro e o gesto vertical rola a página', async ({ page, context }) => {
  test.skip(process.env.PLAYWRIGHT_SOFTWARE_WEBGL !== '1', 'Requer WebGL no navegador de teste.');
  await page.goto('/');
  await expect(page.locator('.brain-canvas')).toHaveAttribute('data-ready', 'true');
  const target = page.locator('.brain-target');
  const { x, y, width, height } = await target.boundingBox();
  const cdp = await context.newCDPSession(page);
  const point = { x: Math.round(x + width * .44), y: Math.round(y + height * .55) };
  const dispatch = (type, touchPoints = []) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await dispatch('touchStart', [point]);
  await expect(target).toHaveClass(/dragging/);
  await dispatch('touchMove', [{ x: point.x + 72, y: point.y }]);
  await expect(target).toHaveClass(/dragging/);
  await dispatch('touchEnd');
  await expect(target).not.toHaveClass(/dragging/);
  await dispatch('touchStart', [point]);
  for (const offset of [27, 57, 95, 147]) {
    await dispatch('touchMove', [{ x: point.x, y: point.y - offset }]);
  }
  await dispatch('touchEnd');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(30);
});
