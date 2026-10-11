// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '../../..');
const script = join(root, 'skills/presentation/scripts/scaffold.mjs');
const temps: string[] = [];
afterEach(async () => { await Promise.all(temps.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function target() { const dir = await mkdtemp(join(tmpdir(), 'scene-scaffold-')); temps.push(dir); return dir; }
function run(dir: string) { const result = spawnSync(process.execPath, [script, '--target', dir], { cwd: tmpdir(), encoding: 'utf8' }); expect(result.status, result.stderr).toBe(0); return result.stdout; }
it('scaffolds empty targets independent of cwd and is idempotent', async () => {
  const dir = await target();
  expect(run(dir)).toContain('build: created');
  expect(await readFile(join(dir, 'src/presentations/index.ts'), 'utf8')).toContain('PresentationEntry');
  const pkg = await readFile(join(dir, 'package.json'), 'utf8');
  expect(run(dir)).toContain('index: skipped');
  expect(await readFile(join(dir, 'package.json'), 'utf8')).toBe(pkg);
});
it.each(['workspaces', 'pnpm', 'packages', 'apps'])('resolves %s monorepos without modifying their root', async signal => {
  const dir = await target();
  const pkg = JSON.stringify({ name: 'host', ...(signal === 'workspaces' ? { workspaces: ['apps/*'] } : {}) });
  await writeFile(join(dir, 'package.json'), pkg);
  if (signal === 'pnpm') await writeFile(join(dir, 'pnpm-workspace.yaml'), 'packages: []');
  if (['packages', 'apps'].includes(signal)) await mkdir(join(dir, signal));
  expect(run(dir)).toContain(join(dir, 'presentations'));
  expect(await readFile(join(dir, 'package.json'), 'utf8')).toBe(pkg);
  expect(JSON.parse(await readFile(join(dir, 'presentations/package.json'), 'utf8')).dependencies.motion).toBeTruthy();
});
it('preserves existing entries and config and adds presentation routing around host JSX', async () => {
  const dir = await target();
  await mkdir(join(dir, 'src'), { recursive: true });
  const pkg = { name: 'host', type: 'module', scripts: { build: 'custom build', dev: 'custom dev' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' } };
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg));
  const main = `import {createRoot} from 'react-dom/client';\ncreateRoot(document.getElementById('root')!).render(<main>Original host (content)</main>);\n`;
  await writeFile(join(dir, 'src/main.tsx'), main);
  await writeFile(join(dir, 'vite.config.ts'), '// host config\n');
  const output = run(dir);
  expect(output).toContain('build: skipped');
  expect(output).toContain('entry-point edit');
  const next = await readFile(join(dir, 'src/main.tsx'), 'utf8');
  expect(next).toContain('<main>Original host (content)</main>');
  expect(next).toContain('PresentationHost');
  expect(await readFile(join(dir, 'vite.config.ts'), 'utf8')).toBe('// host config\n');
  const actual = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  expect(actual.scripts.build).toBe(pkg.scripts.build);
  expect(actual.dependencies.react).toBe(pkg.dependencies.react);
  expect(actual.scripts.verify).toBeTruthy();
  expect(run(dir)).toContain('index: skipped');
  expect(await readFile(join(dir, 'src/main.tsx'), 'utf8')).toBe(next);
});
it('recognizes compatible renamed exported kit modules and skips them', async () => {
  const dir = await target(); run(dir);
  await writeFile(join(dir, 'src/presentation-kit/index.ts'), `export { Presentation } from './custom';\nexport type { Step } from './contract';`);
  await writeFile(join(dir, 'src/presentation-kit/custom.tsx'), 'export function Presentation() { return null; }');
  await writeFile(join(dir, 'src/presentation-kit/contract.ts'), 'export interface Step { id: string; Scene: unknown; }');
  expect(run(dir)).toContain('kit: skipped');
  expect(await readFile(join(dir, 'src/presentation-kit/index.ts'), 'utf8')).toContain('./custom');
});
it('fills partial anchors without overwriting unrelated or existing files', async () => {
  const dir = await target();
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(root, 'src/presentation-kit'), join(dir, 'src/presentation-kit'), { recursive: true });
  await writeFile(join(dir, 'index.html'), '<!-- preserve me -->');
  const kit = await readFile(join(dir, 'src/presentation-kit/index.ts'), 'utf8');
  expect(run(dir)).toContain('kit: skipped');
  expect(await readFile(join(dir, 'index.html'), 'utf8')).toBe('<!-- preserve me -->');
  expect(await readFile(join(dir, 'src/presentation-kit/index.ts'), 'utf8')).toBe(kit);
});
it('recognizes a differently named routed slug-loader registry without cosmetic rewrites', async () => {
  const dir = await target(); run(dir);
  await writeFile(join(dir, 'src/presentations/index.ts'), `export const talks = [{slug: 'custom', title: 'Custom', load: () => import('./custom/Talk')}];`);
  const main = `import { lazy } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { talks } from './presentations';\nconst entry = talks.find(item => '/' + item.slug === window.location.pathname);\nconst Component = entry ? lazy(entry.load) : () => <p>Host</p>;\ncreateRoot(document.getElementById('root')!).render(<Component />);\n`;
  await writeFile(join(dir, 'src/main.tsx'), main);
  expect(run(dir)).toContain('index: skipped');
  expect(await readFile(join(dir, 'src/main.tsx'), 'utf8')).toBe(main);
});
