import { expect, test, type Page } from '@playwright/test';

/**
 * The live examples, exercised for real: every test runs the library in the browser, against the
 * built site and the built package. These are behavior checks, not screenshots.
 */
const collectErrors = (page: Page) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  return errors;
};

/** The number shown by a measured value, for example `1,204 ms` or `12`. */
const number = async (page: Page, testId: string) => Number((await page.getByTestId(testId).textContent())?.replace(/[^\d]/g, ''));

/** The steps completed of a value such as `17 / 40`. */
const stepsRun = async (page: Page, testId: string) => Number((await page.getByTestId(testId).textContent())?.split('/')[0]);

/** Primes below 800,000: the result of the 40 steps of the search. */
const PRIMES = '63,951';

/** Primes below 1,200,000: the result of the 6 tasks of the group. */
const GROUP_PRIMES = '92,938';

async function stopTheWork(page: Page, scope = page.locator('body')) {
  await scope.getByRole('radio', { name: '2 s', exact: true }).check();
  await scope.getByRole('button', { name: 'Start both' }).click();

  // the page keeps updating while the work runs
  await expect(page.getByTestId('cancelable-steps')).not.toHaveText('0 / 40');
  await expect(page.getByTestId('cancel-elapsed')).not.toHaveText('0 ms');
  await expect.poll(() => stepsRun(page, 'native-steps')).toBeGreaterThan(3);

  await scope.getByRole('button', { name: 'Stop both' }).click();

  // the CancelablePromise stopped its work at once
  await expect(page.getByTestId('cancelable-status')).toHaveText('canceled');
  await expect(page.getByTestId('native-status')).toHaveText('still running');

  // the native promise runs every remaining step
  await expect(page.getByTestId('native-status')).toHaveText('finished', { timeout: 15_000 });
  await expect(page.getByTestId('native-steps')).toHaveText('40 / 40');
  await expect(page.getByTestId('native-found')).toHaveText(PRIMES);

  expect(await number(page, 'native-after-stop')).toBeGreaterThan(0);
  expect(await number(page, 'native-wasted')).toBeGreaterThan(0);

  await expect(page.getByTestId('cancelable-after-stop')).toHaveText('0');
  await expect(page.getByTestId('cancelable-wasted')).toHaveText('0 ms');
  expect(await stepsRun(page, 'cancelable-steps')).toBeLessThan(40);
}

test.describe('live examples', () => {
  test('stop the work: the CancelablePromise stops, the native promise runs to the end', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/stop-the-work/');
    await stopTheWork(page);

    await expect(page.locator('.workbench').getByRole('status')).toContainText('finished anyway');

    // without Stop both promises do the same work and find the same primes
    await page.getByRole('button', { name: 'Start both' }).click();

    await expect(page.getByTestId('cancelable-status')).toHaveText('resolved', { timeout: 15_000 });
    await expect(page.getByTestId('native-status')).toHaveText('resolved');
    await expect(page.getByTestId('cancelable-found')).toHaveText(PRIMES);
    await expect(page.getByTestId('native-found')).toHaveText(PRIMES);
    await expect(page.getByTestId('cancelable-after-stop')).toHaveText('—');
    expect(errors).toEqual([]);
  });

  test('progress through the promise: every step is reported, also through a chain', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/progress-through-the-promise/');
    await page.getByRole('radio', { name: '2 s', exact: true }).check();
    await page.getByRole('button', { name: 'Start both' }).click();

    // while it runs: the CancelablePromise reports, the native promise has said nothing
    await expect.poll(() => number(page, 'cancelable-updates')).toBeGreaterThan(2);
    await expect(page.getByTestId('native-updates')).toHaveText('0');
    await expect(page.getByTestId('native-first-feedback')).toHaveText('none yet');
    await expect(page.getByTestId('native-progress')).toHaveText('unknown');
    await expect(page.getByTestId('cancelable-progress')).not.toHaveText('0%');

    await expect(page.getByTestId('native-found')).toHaveText(PRIMES, { timeout: 15_000 });
    await expect(page.getByTestId('cancelable-found')).toHaveText(PRIMES);
    await expect(page.getByTestId('cancelable-updates')).toHaveText('40');
    await expect(page.getByTestId('cancelable-chained')).toHaveText('40');
    await expect(page.getByTestId('cancelable-progress')).toHaveText('100%');
    await expect(page.getByTestId('native-updates')).toHaveText('0');

    // the first feedback of the CancelablePromise arrived long before the only one of the native promise
    expect(await number(page, 'cancelable-first-feedback')).toBeLessThan(500);
    expect(await number(page, 'native-first-feedback')).toBeGreaterThan(1500);
    await expect(page.locator('.workbench').getByRole('status')).toContainText('40 progress updates');
    expect(errors).toEqual([]);
  });

  test('cancel a group: one cancel stops the running tasks and the queue', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/cancel-a-group/');
    await page.getByRole('radio', { name: '2 s', exact: true }).check();
    await page.getByRole('button', { name: 'Start both' }).click();

    // stop while the first two tasks run
    await expect(page.getByTestId('cancelable-task-1')).toHaveText('running');
    await expect(page.getByTestId('group-elapsed')).not.toHaveText('0 ms');
    await page.getByRole('button', { name: 'Stop both' }).click();

    await expect(page.getByTestId('cancelable-status')).toHaveText('canceled');
    await expect(page.getByTestId('cancelable-task-1')).toHaveText('canceled');
    await expect(page.getByTestId('cancelable-task-2')).toHaveText('canceled');

    for (const task of [3, 4, 5, 6]) {
      await expect(page.getByTestId(`cancelable-task-${task}`)).toHaveText('never started');
    }

    await expect(page.getByTestId('cancelable-started-after-stop')).toHaveText('0');
    await expect(page.getByTestId('cancelable-after-stop')).toHaveText('0');
    await expect(page.getByTestId('cancelable-done')).toHaveText('0 / 6');

    // the queue written with native promises starts and finishes every task
    await expect(page.getByTestId('native-status')).toHaveText('finished', { timeout: 15_000 });
    await expect(page.getByTestId('native-done')).toHaveText('6 / 6');
    await expect(page.getByTestId('native-started-after-stop')).toHaveText('4');
    await expect(page.getByTestId('native-total')).toHaveText(GROUP_PRIMES);
    expect(await number(page, 'native-after-stop')).toBeGreaterThan(40);

    // without Stop the group resolves with the same primes, in the order of the tasks
    await page.getByRole('button', { name: 'Start both' }).click();

    await expect(page.getByTestId('cancelable-status')).toHaveText('resolved', { timeout: 15_000 });
    await expect(page.getByTestId('cancelable-total')).toHaveText(GROUP_PRIMES);
    await expect(page.getByTestId('native-total')).toHaveText(GROUP_PRIMES);
    await expect(page.getByTestId('cancelable-done')).toHaveText('6 / 6');
    expect(errors).toEqual([]);
  });

  test('home: the three live demos run on the landing page', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('');

    const cancel = page.locator('#live');
    const progress = page.locator('#progress');
    const group = page.locator('#group');

    await cancel.getByRole('radio', { name: '2 s', exact: true }).check();
    await cancel.getByRole('button', { name: 'Start both' }).click();
    await expect.poll(async () => Number((await cancel.getByTestId('cancelable-steps').textContent())?.split('/')[0])).toBeGreaterThan(2);
    await cancel.getByRole('button', { name: 'Stop both' }).click();
    await expect(cancel.getByTestId('cancelable-status')).toHaveText('canceled');
    await expect(cancel.getByTestId('cancelable-after-stop')).toHaveText('0');
    await expect(cancel.getByTestId('native-status')).toHaveText('finished', { timeout: 15_000 });
    await expect(cancel.getByTestId('native-found')).toHaveText(PRIMES);

    await progress.getByRole('radio', { name: '2 s', exact: true }).check();
    await progress.getByRole('button', { name: 'Start both' }).click();
    await expect(progress.getByTestId('cancelable-updates')).toHaveText('40', { timeout: 15_000 });
    await expect(progress.getByTestId('native-updates')).toHaveText('0');
    await expect(progress.getByTestId('cancelable-found')).toHaveText(PRIMES);

    await group.getByRole('radio', { name: '2 s', exact: true }).check();
    await group.getByRole('button', { name: 'Start both' }).click();
    await expect(group.getByTestId('cancelable-task-1')).toHaveText('running');
    await group.getByRole('button', { name: 'Stop both' }).click();
    await expect(group.getByTestId('cancelable-status')).toHaveText('canceled');
    await expect(group.getByTestId('cancelable-task-6')).toHaveText('never started');
    await expect(group.getByTestId('native-status')).toHaveText('finished', { timeout: 15_000 });
    await expect(group.getByTestId('native-total')).toHaveText(GROUP_PRIMES);
    expect(errors).toEqual([]);
  });
});

test.describe('search', () => {
  test('finds a documentation page in the built index and opens it', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('docs/');
    const dialog = page.getByRole('dialog', { name: /search/i });

    // the dialog is an island: a click that arrives before it hydrates opens nothing, so try until it opens
    await expect(async () => {
      await page.getByRole('button', { name: 'Search documentation' }).click();
      await expect(dialog).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });

    await dialog.getByRole('searchbox').fill('groupAsCancelablePromise');
    await expect(dialog.getByRole('link', { name: /Groups and concurrency/ }).first()).toBeVisible({ timeout: 15_000 });

    await dialog.getByRole('link', { name: /Groups and concurrency/ }).first().click();
    await expect(page).toHaveURL(/docs\/groups-and-concurrency\//);
    expect(errors).toEqual([]);
  });
});
