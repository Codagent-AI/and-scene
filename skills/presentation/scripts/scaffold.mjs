import { readFile, readdir, mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const bootstrap = resolve(dirname(fileURLToPath(import.meta.url)), '../templates/bootstrap');
const exists = path => access(path).then(() => true, () => false);
const text = path => readFile(path, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
async function packageAt(dir) { const contents = await text(join(dir, 'package.json')); return contents ? JSON.parse(contents) : {}; }
async function copyMissing(relative, target) {
  const source = join(bootstrap, relative), destination = join(target, relative);
  const entries = await readdir(source, { withFileTypes: true }).catch(error => { if (error.code === 'ENOTDIR') return null; throw error; });
  if (entries) { await mkdir(destination, { recursive: true }); for (const entry of entries) await copyMissing(join(relative, entry.name), target); }
  else if (!await exists(destination)) { await mkdir(dirname(destination), { recursive: true }); await copyFile(source, destination); }
}
// Follow local imports/reexports rather than comparing formatting or filenames.
async function moduleFile(base) {
  for (const suffix of ['', '.tsx', '.ts', '.jsx', '.js', '/index.ts', '/index.tsx']) if (await exists(base + suffix)) {
    try { await readFile(base + suffix); return base + suffix; } catch (error) { if (error.code !== 'EISDIR') throw error; }
  }
}
async function moduleGraph(entry, seen = new Set(), sources = []) {
  const file = await moduleFile(entry); if (!file || seen.has(file)) return '';
  seen.add(file); const source = (await text(file)).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  sources.push(source);
  let result = source;
  for (const match of source.matchAll(/(?:from\s*|import\s*\()(['"])(\.[^'"]+)\1/g)) result += '\n' + await moduleGraph(resolve(dirname(file), match[2]), seen, sources);
  return result;
}
async function anchors(target) {
  const pkg = await packageAt(target), deps = { ...pkg.devDependencies, ...pkg.dependencies };
  const kit = await moduleGraph(join(target, 'src/presentation-kit/index'));
  const html = await text(join(target, 'index.html'));
  const entry = html.match(/<script\b[^>]*\bsrc=["']([^"']+)["']/)?.[1] ?? '/src/main.tsx';
  const entryPath = resolve(target, entry.replace(/^\//, ''));
  const sources = [], graph = await moduleGraph(entryPath, new Set(), sources);
  // Any routed module exporting slug/load entries is the registry, whatever its filename.
  const registry = sources.some(source => /\bexport\b/.test(source) && /\bslug\s*\??:/.test(source) && /\bload\s*\??:/.test(source));
  return { build: Boolean(pkg.scripts?.build && deps.vite && deps.react && deps.typescript), kit: /export[\s\S]*\bPresentation\b/.test(kit) && /export[\s\S]*\bStep\b/.test(kit), index: registry && /(?:pathname|location)/.test(graph), entryPath };
}
async function wireHost(target, entryPath) {
  const original = await text(entryPath);
  if (!original) { await copyMissing('src/main.tsx', target); await copyMissing('src/PresentationRoute.tsx', target); await copyMissing('src/Landing.tsx', target); return; }
  // The only host edit wraps its existing root expression, retaining all imports/content.
  const match = /\.render\s*\(([\s\S]*)\)\s*;?\s*$/.exec(original);
  if (!match || [...original.matchAll(/\.render\s*\(/g)].length !== 1 || entryPath.endsWith('.js') || entryPath.endsWith('.ts')) {
    console.log(`entry-point edit required in ${entryPath}: mount registry routes at /<slug> with React.lazy + Suspense; keep the existing root expression as the fallback at / and all previous routes. Do this before authoring/verification.`);
    return;
  }
  const routerPath = join(dirname(entryPath), 'AndSceneHost.tsx');
  if (await exists(routerPath)) throw new Error(`${routerPath} exists; refusing to overwrite host infrastructure`);
  // Entry points may live elsewhere: compute their relative registry path.
  const { relative } = await import('node:path');
  let importPath = relative(dirname(entryPath), join(target, 'src/presentations')).replace(/\\/g, '/');
  if (!importPath.startsWith('.')) importPath = './' + importPath;
  await writeFile(routerPath, `import { lazy, Suspense } from 'react';\nimport type { ReactNode } from 'react';\nimport { presentations } from '${importPath}';\nconst routes = presentations.map(entry => ({ path: '/' + entry.slug, Component: lazy(entry.load) }));\nexport function PresentationHost({ children }: { children: ReactNode }) {\n  const Route = routes.find(route => route.path === window.location.pathname)?.Component;\n  return Route ? <Suspense fallback={<p>Loading presentation…</p>}><Route /></Suspense> : <>{children}</>;\n}\n`);
  const start = match.index + match[0].indexOf('(') + 1;
  const next = `import { PresentationHost } from './AndSceneHost';\n` + original.slice(0, start) + `<PresentationHost>${match[1]}</PresentationHost>` + original.slice(start + match[1].length);
  await writeFile(entryPath, next);
  console.log(`entry-point edit: ${entryPath}: added import './AndSceneHost' and wrapped the existing render argument in <PresentationHost>; / and previous host routes remain the fallback`);
}
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--target') throw new Error('usage: node scaffold.mjs --target <directory> (invoke after target approval when required)');
  let target = resolve(args[1]); const initial = await anchors(target); const pkg = await packageAt(target);
  if (!initial.index && (pkg.workspaces || await exists(join(target, 'pnpm-workspace.yaml')) || await exists(join(target, 'packages')) || await exists(join(target, 'apps')))) target = join(target, 'presentations');
  await mkdir(target, { recursive: true }); console.log(`target: ${target}`);
  const before = await anchors(target);
  const fresh = !await exists(join(target, 'package.json'));
  if (!before.build) for (const file of ['package.json', ...(fresh ? ['package-lock.json'] : []), 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'src/index.css']) await copyMissing(file, target);
  if (!before.kit) await copyMissing('src/presentation-kit', target);
  if (!before.index) {
    await copyMissing('src/presentations/index.ts', target);
    if (before.build || await exists(before.entryPath)) await wireHost(target, before.entryPath);
    else for (const file of ['src/main.tsx', 'src/PresentationRoute.tsx', 'src/Landing.tsx']) await copyMissing(file, target);
  }
  for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib']) await copyMissing(file, target);
  const actual = await packageAt(target), template = await packageAt(bootstrap); let changed = false;
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    actual[section] ??= {};
    for (const [name, version] of Object.entries(template[section])) {
      if (section !== 'scripts' && (actual.dependencies?.[name] || actual.devDependencies?.[name])) continue;
      if (!(name in actual[section])) { actual[section][name] = version; changed = true; }
    }
  }
  if (changed) await writeFile(join(target, 'package.json'), JSON.stringify(actual, null, 2) + '\n');
  for (const anchor of ['build', 'kit', 'index']) console.log(`${anchor}: ${before[anchor] ? 'skipped (contract present)' : 'created (missing contract; existing files preserved)'}`);
  console.log('next: run npm install in the resolved target; install Playwright Chromium when missing; author/register a presentation, then build, verify and inspect');
} catch (error) { console.error(`scaffold: FAIL: ${error.message}`); process.exitCode = 1; }
