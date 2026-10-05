import { expect, test, type Page } from '@playwright/test';
import { routes } from './routes';

/**
 * Checks that do not depend on a baseline image: code is highlighted in both appearances, nothing is
 * wider than the screen, the page has the same height on every capture, and the live examples do not
 * move when their values arrive.
 */
const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.toast').waitFor({ state: 'attached' });
};

/** Distinct token colours of every code block that has more than a few tokens. */
const tokenColours = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('pre'))
      .map((pre) => {
        const spans = Array.from(pre.querySelectorAll('span')).filter((span) => span.children.length === 0 && span.textContent?.trim());

        return {
          label: pre.closest('.code-block')?.querySelector('.code-head span')?.textContent?.trim() ?? pre.className,
          tokens: spans.length,
          colours: new Set(spans.map((span) => getComputedStyle(span).color)).size,
        };
      })
      .filter((block) => block.tokens > 6),
  );

const bodyHeight = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight);

for (const route of routes()) {
  test.describe(route.name, () => {
    test('code is highlighted in the light and in the dark appearance', async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'load' });
      await settle(page);

      for (const appearance of ['light', 'dark'] as const) {
        await page.evaluate((dark) => {
          document.documentElement.classList.toggle('dark', dark);
          document.documentElement.dataset.codeTheme = dark ? 'palette-dark' : 'vscode-light';
        }, appearance === 'dark');

        const plain = (await tokenColours(page)).filter((block) => block.colours < 2);

        expect(plain, `${route.path} (${appearance}): code blocks painted with a single colour`).toEqual([]);
      }
    });

    test('nothing is wider than the screen and the height is stable', async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'load' });
      await settle(page);

      const widths = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);

      expect(widths[0], `${route.path}: horizontal overflow`).toBe(widths[1]);

      const before = await bodyHeight(page);

      await page.screenshot({ fullPage: true });

      const after = await bodyHeight(page);

      await page.reload({ waitUntil: 'load' });
      await settle(page);

      expect([after, await bodyHeight(page)], `${route.path}: the height of the page changed between captures`).toEqual([before, before]);
    });
  });
}

/** Position and size of every box of the examples on the page. */
const boxes = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.demo, .demo-card, .demo-stat, .demo-lane, .demo-progress, .demo-actions, .workbench')).map((element) => {
      const { width, height } = element.getBoundingClientRect();

      return `${element.className.split(' ')[0]} ${Math.round(width * 10) / 10}x${Math.round(height * 10) / 10}`;
    }),
  );

/** Values that do not fit in their box. */
const clipped = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.demo dt, .demo dd, .demo-lane > span'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent),
  );

const examples = [
  { path: 'examples/stop-the-work/', stop: true, done: 'native-status' },
  { path: 'examples/progress-through-the-promise/', stop: false, done: 'native-found' },
  { path: 'examples/cancel-a-group/', stop: true, done: 'native-status' },
];

for (const example of examples) {
  test(`${example.path} keeps its layout while the values arrive`, async ({ page }) => {
    await page.goto(example.path, { waitUntil: 'load' });
    await settle(page);
    await page.getByRole('button', { name: 'Start both' }).waitFor();

    const idle = await boxes(page);

    expect(await clipped(page), 'idle: text that does not fit').toEqual([]);

    await page.getByRole('radio', { name: '2 s', exact: true }).check();
    await page.getByRole('button', { name: 'Start both' }).click();
    await page.waitForTimeout(500);

    expect(await boxes(page), 'running').toEqual(idle);
    expect(await clipped(page), 'running: text that does not fit').toEqual([]);

    if (example.stop) {
      await page.getByRole('button', { name: 'Stop both' }).click();
      await page.waitForTimeout(100);

      expect(await boxes(page), 'stopped').toEqual(idle);
      expect(await clipped(page), 'stopped: text that does not fit').toEqual([]);
    }

    await expect(page.getByTestId(example.done)).toHaveText(example.stop ? 'finished' : /\d/, { timeout: 15_000 });

    expect(await boxes(page), 'finished').toEqual(idle);
    expect(await clipped(page), 'finished: text that does not fit').toEqual([]);
  });
}
