import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('tests/e2e/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

test.describe('KIMOVOLT LAB Full-Stack E2E & Visual Verification', () => {
  test('1. Home hero circuit toggles live via MNA, captures desktop & mobile screenshots with zero console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Не просто изучай электронику');
    await expect(page.getByTestId('hero-current-readout')).toContainText('0.00 A');

    // Click switch button / circuit switch to close loop
    await page.getByRole('button', { name: /Замкнуть SW1/i }).click();
    await expect(page.getByTestId('hero-circuit-status')).toContainText(
      'Только что ты замкнул свою первую электрическую цепь.'
    );
    await expect(page.getByTestId('hero-current-readout')).toContainText('9.08 mA');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home-desktop-1440.png'), fullPage: true });

    // Responsive check: Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home-tablet-768.png'), fullPage: false });

    // Responsive check: Mobile 390x844 (check zero horizontal overflow)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home-mobile-390.png'), fullPage: false });

    expect(errors).toEqual([]);
  });

  test('2. Guest mode -> Lesson 1 end-to-end (mistake coaching, slider, build circuit, completion & reload persistence)', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/learn');
    await expect(page.locator('h1')).toContainText('Карта обучения');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'learn-map-1440.png'), fullPage: false });

    await page.goto('/learn/m0-first-led');
    await expect(page.locator('h1')).toContainText('Зажги первый светодиод');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'lesson1-scene1-1440.png'), fullPage: false });

    // Scene 1 -> Scene 2 (Close SW1)
    await page.getByTestId('lesson-next-btn').click();
    // Try checking before closing SW1 -> must fail!
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Проверь решение');

    // Toggle SW1 directly on SVG schematic
    await page.locator('[data-toggle-id="sw1"]').click();
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Верно');
    await page.getByTestId('lesson-next-btn').click();

    // Scene 3 -> Scene 4 (Tune resistance slider)
    await page.getByTestId('lesson-next-btn').click();
    const slider = page.getByLabel('Parameter tuner');
    await slider.fill('330');
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Верно');
    await page.getByTestId('lesson-next-btn').click();

    // Scene 5 (Polarity fault: test misconception feedback first, then correct option)
    await page.getByLabel(/Сопротивление 330 Ω слишком велико/).check();
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Ошибочная связь R и I');

    await page.getByLabel(/Светодиод включён в обратной полярности/).check();
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Верно');
    await page.getByTestId('lesson-next-btn').click();

    // Scene 6: Build circuit from scratch via clickable terminal pins!
    // Terminals: v1:pos -> sw1:a, sw1:b -> r1:a, r1:b -> d1:anode, d1:cathode -> v1:neg
    await page.getByRole('button', { name: '5 V +' }).click();
    await page.getByRole('button', { name: 'SW1 1' }).click();
    await page.getByRole('button', { name: 'SW1 2' }).click();
    await page.getByRole('button', { name: 'R1 1' }).click();
    await page.getByRole('button', { name: 'R1 2' }).click();
    await page.getByRole('button', { name: 'LED1 A (+)' }).click();
    await page.getByRole('button', { name: 'LED1 K (-)' }).click();
    await page.getByRole('button', { name: '5 V -' }).click();

    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByTestId('exercise-feedback')).toContainText('Верно');
    await page.getByTestId('lesson-next-btn').click();

    // Scene 7 -> Complete Lesson
    await page.getByTestId('lesson-next-btn').click();
    await expect(page.getByText('УЗЕЛ ПЛАТЫ АКТИВИРОВАН')).toBeVisible();

    // Reload and confirm XP & Notebook persisted in guest storage
    await page.goto('/progress');
    await expect(page.getByText('120 XP').first()).toBeVisible();
    await expect(page.getByText('Зажги первый светодиод').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('3. Sandbox 42 Ohm easter egg, Reference live demo, Projects, Profile account migration & Blueprint Light theme', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Sandbox + X-Ray + 42 Ohm Easter Egg + Multimeter
    await page.goto('/lab');
    await page.getByRole('button', { name: 'X-Ray' }).click();
    // Select resistor R1 on canvas and change to 42 Ohm
    await page.locator('[data-comp-id="r1"]').click();
    const rInput = page.getByLabel('Сопротивление (Ω)');
    await expect(rInput).toBeVisible();
    await rInput.fill('42');
    await expect(page.getByText(/42 Ω — найден ответ/)).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sandbox-1440.png'), fullPage: false });

    // Reference & Projects
    await page.goto('/reference');
    await expect(page.locator('h1')).toContainText('Интерактивный справочник');

    await page.goto('/projects');
    await page.getByRole('button', { name: 'ESP32-S3-DevKitC-1' }).click();
    await expect(page.getByText(/Dual-core Xtensa LX7/)).toBeVisible();

    // Profile: Register live account on Go + SQLite backend & switch Blueprint Light theme
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Профиль');
    await page.getByTestId('theme-light').click();
    await page.waitForTimeout(220);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'profile-light-1440.png'), fullPage: false });

    const uniqueEmail = `e2e-${Date.now()}@kimovolt.lab`;
    await page.getByLabel('Имя в лаборатории').fill('E2E Engineer');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Пароль').fill('StrongPass123');
    await page.getByRole('button', { name: /Создать аккаунт и перенести прогресс/ }).click();
    await expect(page.getByText('АККАУНТ СИНХРОНИЗИРОВАН')).toBeVisible();

    // 404 Open Circuit Easter Egg
    await page.goto('/no-such-route-404');
    await expect(page.getByText('ERROR 404')).toBeVisible();
    await page.getByRole('button', { name: 'Замкнуть цепь 404' }).click();
    await expect(page.getByText('CONTINUITY OK')).toBeVisible();

    expect(errors).toEqual([]);
  });
});
