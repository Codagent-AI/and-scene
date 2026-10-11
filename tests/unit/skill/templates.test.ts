// @vitest-environment node
import { expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '../../..');
const bootstrap = join(root, 'skills/presentation/templates/bootstrap');
async function files(dir: string, prefix = ''): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const path = join(prefix, entry.name);
    result.push(...(entry.isDirectory() ? await files(dir, path) : [path]));
  }
  return result.sort();
}
it('keeps kit and production browser tooling byte-identical with the same file sets', async () => {
  for (const folder of ['src/presentation-kit', 'scripts/lib']) {
    const canonical = await files(join(root, folder));
    expect(await files(join(bootstrap, folder))).toEqual(canonical);
    for (const file of canonical) expect(await readFile(join(bootstrap, folder, file))).toEqual(await readFile(join(root, folder, file)));
  }
  for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) expect(await readFile(join(bootstrap, file))).toEqual(await readFile(join(root, file)));
});
it('declares the complete matching dependency set and excludes sample/test/style infrastructure', async () => {
  const original = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(join(bootstrap, 'package.json'), 'utf8'));
  const runtime = ['react', 'react-dom', 'motion', 'lucide-react'];
  const dev = ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright'];
  expect(Object.keys(pkg.dependencies).sort()).toEqual(runtime.sort());
  expect(Object.keys(pkg.devDependencies).sort()).toEqual(dev.sort());
  for (const section of ['dependencies', 'devDependencies']) for (const name of Object.keys(pkg[section])) expect(pkg[section][name]).toBe(original[section][name]);
  expect(Object.keys(pkg.scripts).sort()).toEqual(['build', 'dev', 'inspect', 'lint', 'preview', 'verify']);
  const all = await files(bootstrap);
  expect(all.some(file => /expectations|how-to-make|vitest|^tests\//i.test(file))).toBe(false);
  const css = await readFile(join(bootstrap, 'src/index.css'), 'utf8');
  expect(css).not.toMatch(/(?:color|font|background|border|shadow|--[\w-]+)\s*:/);
  const starterCss = await readFile(join(root, 'skills/presentation/templates/presentation/presentation.css'), 'utf8');
  expect(starterCss.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/:/);
  const lock = JSON.parse(await readFile(join(bootstrap, 'package-lock.json'), 'utf8'));
  expect(lock.packages[''].dependencies).toEqual(pkg.dependencies);
  expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies);
});
it('publishes concise discoverable skill frontmatter', async () => {
  const skill = await readFile(join(root, 'skills/presentation/SKILL.md'), 'utf8');
  expect(skill).toMatch(/^---\nname: presentation\n/);
  const description = skill.match(/^description: (.+)$/m)?.[1] ?? '';
  expect(description.length).toBeGreaterThanOrEqual(50);
  expect(description.length).toBeLessThan(1024);
  expect(skill.split('\n').length).toBeLessThan(200);
});
