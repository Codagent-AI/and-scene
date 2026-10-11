import { cp, mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { expect, it } from 'vitest';
const checkout = resolve(import.meta.dirname, '../..');
const skill = join(checkout, 'skills/presentation');
const bootstrap = join(skill, 'templates/bootstrap');
async function run(cwd: string, command: string, args: string[]) {
  const result = await new Promise<{ code: number | null; output: string }>((done, reject) => {
    const child = spawn(command, args, { cwd }); let output = '';
    child.stdout.on('data', data => output += data); child.stderr.on('data', data => output += data);
    const timer = setTimeout(() => child.kill('SIGTERM'), 150000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); done({ code, output }); });
  });
  expect(result.code, result.output).toBe(0); return result.output;
}
async function tree(dir: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) for (const [file, value] of Object.entries(await tree(join(dir, entry.name)))) result[entry.name + '/' + file] = value;
    else result[entry.name] = (await readFile(join(dir, entry.name))).toString('base64');
  }
  return result;
}
async function addPresentation(dir: string) {
  await cp(join(skill, 'templates/presentation'), join(dir, 'src/presentations/starter'), { recursive: true });
  const talkPath = join(dir, 'src/presentations/starter/Talk.tsx');
  let talk = await readFile(talkPath, 'utf8');
  talk = talk.replace('const STEPS = [step];', `const STEPS = [step, { ...step, id: 'finish', title: 'The next beat', caption: 'The subject evolves in place.', payload: { label: 'An evolved subject' } }];`);
  await writeFile(talkPath, talk);
  const path = join(dir, 'src/presentations/index.ts');
  await writeFile(path, (await readFile(path, 'utf8')).replace('= [];', `= [{ slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') }];`));
}
it('INT-001 bootstraps outside caller cwd from the committed lock and renders every starter step', async () => {
  const before = await tree(join(checkout, 'src/presentation-kit'));
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'));
  try {
    const output = await run(tmpdir(), process.execPath, [join(skill, 'scripts/scaffold.mjs'), '--target', dir]);
    expect(output).toContain('build: created'); expect(output).toContain('kit: created'); expect(output).toContain('index: created');
    expect(await tree(join(dir, 'src/presentation-kit'))).toEqual(before);
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
    expect({ ...pkg.dependencies, ...pkg.devDependencies }).toEqual({ ...JSON.parse(await readFile(join(bootstrap, 'package.json'), 'utf8')).dependencies, ...JSON.parse(await readFile(join(bootstrap, 'package.json'), 'utf8')).devDependencies });
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /tailwind|bootstrap|bulma/.test(name))).toBe(false);
    await addPresentation(dir);
    await run(dir, 'npm', ['ci', '--ignore-scripts', '--prefer-offline']);
    await run(dir, 'npm', ['run', 'build']);
    const verify = await run(dir, 'npm', ['run', 'verify']);
    expect(verify).toContain('127.0.0.1'); expect(verify).toContain('starter'); expect(verify).toContain('PASS');
    expect(verify).toContain('step 2');
    expect(await tree(join(checkout, 'src/presentation-kit'))).toEqual(before);
  } finally { await rm(dir, { recursive: true, force: true }); }
}, 180000);
it('adds routes to a build-only host while preserving original root and build configuration', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-partial-'));
  let preview: ReturnType<typeof spawn> | undefined;
  try {
    await mkdir(join(dir, 'src'));
    const configuration = ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
    for (const file of configuration) await cp(join(bootstrap, file), join(dir, file));
    const originalConfigs = await Promise.all(configuration.map(file => readFile(join(dir, file), 'utf8')));
    const base = JSON.parse(await readFile(join(bootstrap, 'package.json'), 'utf8'));
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'partial-host', type: 'module', scripts: { build: base.scripts.build }, dependencies: { react: base.dependencies.react, 'react-dom': base.dependencies['react-dom'] }, devDependencies: { vite: base.devDependencies.vite, typescript: base.devDependencies.typescript, '@vitejs/plugin-react': base.devDependencies['@vitejs/plugin-react'] } }));
    await writeFile(join(dir, 'src/main.tsx'), `import { createRoot } from 'react-dom/client';\ncreateRoot(document.getElementById('root')!).render(<main data-host-original>Original host content</main>);\n`);
    expect(await run(tmpdir(), process.execPath, [join(skill, 'scripts/scaffold.mjs'), '--target', dir])).toContain('entry-point edit:');
    expect(await Promise.all(configuration.map(file => readFile(join(dir, file), 'utf8')))).toEqual(originalConfigs);
    await addPresentation(dir);
    await run(dir, 'npm', ['install', '--ignore-scripts', '--prefer-offline']);
    await run(dir, 'npm', ['run', 'build']);
    expect(await run(dir, 'npm', ['run', 'verify'])).toContain('PASS');
    const server = createServer(); await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
    const port = address.port; await new Promise<void>(done => server.close(() => done()));
    preview = spawn(process.execPath, [join(dir, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: dir, stdio: 'ignore' });
    const url = `http://127.0.0.1:${port}`;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(url)).ok) break; } catch { /* wait for preview */ }
      await new Promise(done => setTimeout(done, 100));
    }
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage(); const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(url); expect(await page.locator('[data-host-original]').textContent()).toBe('Original host content');
      await page.goto(url + '/starter'); await page.locator('[data-step-index="0"]').waitFor();
      expect(await page.locator('[data-presentation-attribution]').textContent()).toBe('made by and-scene');
      await page.keyboard.press('ArrowRight'); await page.locator('[data-step-index="1"]').waitFor();
      expect(errors).toEqual([]);
    } finally { await browser.close(); }
    expect(await Promise.all(configuration.map(file => readFile(join(dir, file), 'utf8')))).toEqual(originalConfigs);
  } finally {
    if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await new Promise(done => preview!.once('close', done)); }
    await rm(dir, { recursive: true, force: true });
  }
}, 180000);
