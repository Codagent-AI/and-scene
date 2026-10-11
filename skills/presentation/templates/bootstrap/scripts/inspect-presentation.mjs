import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { stop, freePort, ready } from './lib/browser-preview.mjs';
import { resolve, relative, join } from 'node:path';
import { chromium } from 'playwright';
import { inspectVisuals } from './lib/visual-diagnostics.mjs';
const root = process.cwd();
let browser, preview, build, cleanupPromise;
function cleanup() {
  return cleanupPromise ??= (async () => {
    await browser?.close().catch(() => {});
    await Promise.all([stop(preview), stop(build)]);
  })();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await cleanup();
    console.error(`inspect: FAIL: interrupted by ${signal}`);
    process.exit(1);
  });
}
function options(args) {
  const slug = args.shift();
  if (!slug || slug.startsWith('--')) throw new Error('usage: inspect-presentation.mjs <slug> [--viewport WxH] [--settle ms] [--out dir] [--no-build]');
  const result = { slug, viewport: { width: 1440, height: 900 }, settle: 850, build: true };
  while (args.length) {
    const flag = args.shift();
    if (flag === '--no-build') { result.build = false; continue; }
    const value = args.shift();
    if (!value) throw new Error(`missing value for ${flag}`);
    if (flag === '--viewport') {
      const match = value.match(/^(\d+)x(\d+)$/);
      if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) throw new Error('viewport must be positive WxH');
      result.viewport = { width: Number(match[1]), height: Number(match[2]) };
    } else if (flag === '--settle') {
      if (!/^\d+$/.test(value)) throw new Error('settle must be a non-negative integer in milliseconds');
      result.settle = Number(value);
    } else if (flag === '--out') result.out = value;
    else throw new Error(`unknown option ${flag}`);
  }
  result.out = resolve(root, result.out ?? `artifacts/inspect/${slug}/${result.viewport.width}x${result.viewport.height}`);
  return result;
}
try {
  const config = options(process.argv.slice(2));
  const registry = (await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const slugs = [...registry.matchAll(/\bslug\s*:\s*(['"])([^'"]+)\1/g)].map(match => match[2]);
  if (!slugs.includes(config.slug)) throw new Error(`requested slug "${config.slug}" is not registered`);
  if (config.build) {
    build = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root, stdio: 'inherit', detached: process.platform !== 'win32' });
    const code = await new Promise((done, reject) => { build.once('error', reject); build.once('close', done); });
    if (code !== 0) throw new Error(`npm run build exited ${code}`);
  }
  const url = `http://127.0.0.1:${await freePort()}`;
  preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', url.split(':').at(-1), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let previewError;
  preview.once('error', error => { previewError = error; });
  preview.stdout.on('data', data => process.stdout.write(data));
  preview.stderr.on('data', data => process.stderr.write(data));
  console.log(`inspect: preview ${url} (pid ${preview.pid})`);
  await ready(`${url}/`, preview);
  if (previewError) throw previewError;
  try { browser = await chromium.launch({ headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false }); }
  catch (error) { throw new Error(`Chromium could not launch. Run npx playwright install chromium. ${error.message}`); }
  const page = await browser.newPage({ viewport: config.viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${url}/${encodeURIComponent(config.slug)}`, { waitUntil: 'networkidle' });
  const presentation = page.locator('[data-presentation-root]');
  await presentation.waitFor({ timeout: 5000 });
  const count = Number(await presentation.getAttribute('data-step-count'));
  if (!Number.isInteger(count) || count < 1) throw new Error('data-step-count must be a positive integer');
  await mkdir(config.out, { recursive: true });
  const report = { slug: config.slug, viewport: config.viewport, settle: config.settle, steps: [], warningCount: 0 };
  for (let index = 0; index < count; index++) {
    if (index) await page.keyboard.press('ArrowRight');
    await page.waitForFunction(expected => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 3000 });
    await page.waitForTimeout(config.settle); // Default exceeds ENTER_DELAY + ENTER_T (700ms).
    await page.evaluate(() => document.fonts.ready);
    if (errors.length) throw new Error(`step ${index + 1}: ${errors.join('; ')}`);
    const id = await presentation.getAttribute('data-step-id');
    const diagnostics = await page.evaluate(inspectVisuals);
    const path = join(config.out, `step-${String(index + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path });
    report.steps.push({ index, id, screenshot: relative(root, path), ...diagnostics });
    for (const warning of diagnostics.warnings) console.log(`WARN step ${index + 1} (${id}) ${warning.kind}: ${warning.detail}`);
    report.warningCount += diagnostics.warnings.length;
  }
  await writeFile(join(config.out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`inspect: ${count} screenshots; ${report.warningCount} advisory warnings; report ${relative(root, join(config.out, 'report.json'))}`);
} catch (error) {
  console.error(`inspect: FAIL: ${error.message}`);
  process.exitCode = 1;
} finally { await cleanup(); }
