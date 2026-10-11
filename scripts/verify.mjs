import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

// Portable scaffold entry point: project-specific expectations belong in JSON.
const root = process.cwd();
let browser;
let preview;
let build;
let cleanupPromise;
let context = { phase: 'build' };
const describe = ({ phase, slug, index, id }, reason) =>
  `verify: FAIL [${phase}]${slug ? ` ${slug}` : ''}${index === undefined ? '' : ` step ${index + 1} (${id ?? 'unavailable'})`}: ${reason}`;
const pause = ms => new Promise(done => setTimeout(done, ms));
function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(done => {
    const kill = signal => {
      try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal); }
      catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
    };
    const timer = setTimeout(() => kill('SIGKILL'), 2000);
    child.once('close', () => { clearTimeout(timer); done(); });
    kill('SIGTERM');
  });
}
function cleanup() {
  return cleanupPromise ??= (async () => {
    await browser?.close().catch(() => {});
    await Promise.all([stop(preview), stop(build)]);
  })();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await cleanup();
    console.error(describe(context, `interrupted by ${signal}`));
    process.exit(1);
  });
}
async function freePort() {
  const server = createServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  return port;
}
async function ready(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (preview.exitCode !== null || preview.signalCode !== null) throw new Error('preview exited before readiness; check the Vite preview output');
    try { if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return; } catch { /* retry until preview is ready */ }
    await pause(100);
  }
  throw new Error('preview did not become ready within 10 seconds');
}
async function readExpectations() {
  try { return JSON.parse(await readFile(resolve(root, 'scripts/verify.expectations.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}
try {
  build = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root, stdio: 'inherit', detached: process.platform !== 'win32' });
  const code = await new Promise((done, reject) => { build.once('error', reject); build.once('close', done); });
  if (code !== 0) throw new Error(`npm run build exited ${code}; fix the type/build errors above`);
  console.log('verify: build PASS');

  context = { phase: 'sample' };
  const expectations = await readExpectations();
  const registry = await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8');
  // Ignore comments so commented-out registrations cannot satisfy this check.
  const literals = registry.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const slugs = [...new Set([...literals.matchAll(/\bslug\s*:\s*(['"])([^'"]+)\1/g)].map(match => match[2]))];
  const reference = expectations?.referenceSample;
  if (reference && !slugs.includes(reference.slug)) throw new Error(`required reference slug "${reference.slug}" is missing from src/presentations/index.ts`);
  console.log(reference ? `verify: sample ${reference.slug} registered PASS` : 'verify: sample: SKIP (no expectations file)');

  context = { phase: 'render' };
  const targets = process.argv.slice(2).length ? [...new Set(process.argv.slice(2))] : slugs;
  if (!targets.length) throw new Error('no registered presentation targets; add a literal slug to src/presentations/index.ts');
  for (const slug of targets) {
    if (!slugs.includes(slug)) throw new Error(`requested slug "${slug}" is not registered`);
  }
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  preview.stdout.on('data', data => process.stdout.write(data));
  preview.stderr.on('data', data => process.stderr.write(data));
  let previewError;
  preview.once('error', error => { previewError = error; });
  console.log(`verify: preview ${url} (pid ${preview.pid})`);
  await ready(`${url}/`);
  if (previewError) throw previewError;
  try { browser = await chromium.launch({ headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false }); }
  catch (error) { throw new Error(`Chromium could not launch. Run npx playwright install chromium. ${error.message}`); }

  for (const slug of targets) {
    context = { phase: 'render', slug, index: 0 };
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`); });
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    const presentation = page.locator('[data-presentation-root]');
    const refreshId = async () => {
      try { context.id = await presentation.getAttribute('data-step-id', { timeout: 1000 }) ?? context.id; } catch { /* preserve last known identity when rendering crashes */ }
    };
    try {
      await page.goto(`${url}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' });
      await presentation.waitFor({ timeout: 5000 });
      await refreshId();
      const count = Number(await presentation.getAttribute('data-step-count'));
      if (!Number.isInteger(count) || count < 1) throw new Error('data-step-count must be a positive integer');
      const sample = reference?.slug === slug ? reference : undefined;
      if (sample) {
        context.phase = 'sample';
        if (count !== sample.steps.length) throw new Error(`expected ${sample.steps.length} steps, rendered ${count}`);
        if (await presentation.getAttribute('data-presentation-mode') !== 'browse') await page.keyboard.press('p');
      }
      for (let index = 0; index < count; index++) {
        context = { phase: 'render', slug, index, id: context.id };
        if (index > 0) {
          const previousId = context.id;
          await page.keyboard.press('ArrowRight');
          try {
            await page.waitForFunction(expected => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 3000 });
          } catch {
            await refreshId();
            if (errors.length) throw new Error(errors.join('; '));
            context.index = index - 1;
            context.id = previousId;
            throw new Error(`ArrowRight did not advance data-step-index to ${index}; check keyboard handlers and the step transition`);
          }
        }
        await refreshId();
        // Let layout/newcomer motion and effects settle before declaring a step clean.
        await page.waitForTimeout(850);
        if (errors.length) throw new Error(errors.join('; '));
        if (Number(await presentation.getAttribute('data-step-index')) !== index) throw new Error(`expected data-step-index ${index}`);
        if (sample) {
          context.phase = 'sample';
          const expected = sample.steps[index];
          const title = await page.locator('[data-presentation-title]').innerText();
          const caption = await page.locator('[data-presentation-caption]').innerText();
          if (title !== expected.title) throw new Error(`title mismatch: expected ${JSON.stringify(expected.title)}, got ${JSON.stringify(title)}`);
          if (caption !== expected.caption) throw new Error(`caption mismatch: expected ${JSON.stringify(expected.caption)}, got ${JSON.stringify(caption)}`);
          console.log(`verify: sample ${slug} step ${index + 1} (${context.id}) title + caption PASS`);
        }
        context.phase = 'render';
        console.log(`verify: render ${slug} step ${index + 1} (${context.id}) PASS`);
      }
    } catch (error) {
      await refreshId();
      if (errors.length) { context.phase = 'render'; throw new Error(errors.join('; ')); }
      throw error;
    } finally { await page.close(); }
  }
  await cleanup();
  console.log('verify: PASS');
} catch (error) {
  await cleanup();
  console.error(describe(context, error.message));
  process.exitCode = 1;
}
