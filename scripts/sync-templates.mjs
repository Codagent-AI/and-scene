#!/usr/bin/env node
// Refresh the bootstrap template snapshot from the canonical sources:
//   node scripts/sync-templates.mjs          # copy files
//   node scripts/sync-templates.mjs --lock   # also regenerate the template's package-lock.json
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const templateRoot = path.join(root, 'skills/presentation/templates/bootstrap')
const presentationTemplates = path.join(root, 'skills/presentation/templates/presentation')

const TEST_ONLY_DEV_DEPENDENCIES = /^(vitest|jsdom|@testing-library\/.+)$/
const TEMPLATE_SCRIPTS = ['dev', 'build', 'lint', 'preview', 'verify', 'inspect']

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

/** Files that must stay byte-identical between the repository and the template: [source, destination]. */
export function syncedFiles() {
  const pairs = []
  const add = (rel) => pairs.push([path.join(root, rel), path.join(templateRoot, rel)])
  for (const file of walk(path.join(root, 'src/presentation-kit'))) add(path.relative(root, file))
  for (const file of walk(path.join(root, 'scripts'))) {
    const rel = path.relative(root, file)
    if (rel === 'scripts/verify.expectations.mjs' || rel === 'scripts/sync-templates.mjs') continue
    add(rel)
  }
  for (const rel of [
    'index.html', 'vite.config.ts', 'tsconfig.app.json', 'tsconfig.node.json', 'public/favicon.svg',
    'src/main.tsx', 'src/Root.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/index.css',
  ]) add(rel)
  return pairs
}

/** The starter presentation is the presentation template with placeholders filled in. */
export function renderTemplate(content, { slug, title }) {
  return content.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title)
}

export function starterFiles() {
  return walk(presentationTemplates).map((file) => [
    path.join(templateRoot, 'src/presentations/starter', path.relative(presentationTemplates, file)),
    renderTemplate(readFileSync(file, 'utf8'), { slug: 'starter', title: 'Starter presentation' }),
  ])
}

export function templatePackage() {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  return {
    name: 'presentations',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: Object.fromEntries(TEMPLATE_SCRIPTS.map((name) => [name, pkg.scripts[name]])),
    dependencies: pkg.dependencies,
    devDependencies: Object.fromEntries(
      Object.entries(pkg.devDependencies).filter(([name]) => !TEST_ONLY_DEV_DEPENDENCIES.test(name)),
    ),
  }
}

const STATIC = {
  'tsconfig.json': `${JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }, null, 2)}\n`,
  '.gitignore': 'node_modules\ndist\nartifacts\n*.log\n.DS_Store\n',
  'src/presentations/index.ts': `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line. */
export const presentations: readonly PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk'),
  },
]
`,
  'scripts/verify.expectations.mjs': `// Normative content verify must find, keyed by registered slug. Add an entry to
// pin a presentation's eras, titles and captions; presentations listed in the
// registry are always rendered through every step regardless.
export const expectations = []
`,
}

export function sync() {
  mkdirSync(templateRoot, { recursive: true })
  rmSync(path.join(templateRoot, 'src/presentation-kit'), { recursive: true, force: true })
  rmSync(path.join(templateRoot, 'scripts'), { recursive: true, force: true })
  rmSync(path.join(templateRoot, 'src/presentations'), { recursive: true, force: true })
  const put = (dest, content) => {
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, content)
  }
  for (const [src, dest] of syncedFiles()) {
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest)
  }
  for (const [rel, content] of Object.entries(STATIC)) put(path.join(templateRoot, rel), content)
  for (const [dest, content] of starterFiles()) put(dest, content)
  const eslint = readFileSync(path.join(root, 'eslint.config.js'), 'utf8')
  put(
    path.join(templateRoot, 'eslint.config.js'),
    eslint
      .replace("globalIgnores(['dist', 'artifacts', 'skills/presentation/templates'])", "globalIgnores(['dist', 'artifacts'])")
      .replace(/ {2}\{\n {4}files: \['tests\/\*\*\/\*\.\{ts,tsx\}'\],\n {4}rules: \{[^}]*\},\n {2}\},\n/, ''),
  )
  put(path.join(templateRoot, 'package.json'), `${JSON.stringify(templatePackage(), null, 2)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  sync()
  if (process.argv.includes('--lock')) {
    rmSync(path.join(templateRoot, 'package-lock.json'), { force: true })
    const result = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: templateRoot, stdio: 'inherit' })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  console.log(`synced ${existsSync(templateRoot) ? templateRoot : ''}`)
}
