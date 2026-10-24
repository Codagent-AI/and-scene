// Keeps skills/presentation/templates/bootstrap/ aligned with the canonical app files.
// Usage: node scripts/sync-template.mjs [--check]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')
const PRESENTATION_TEMPLATE = path.join(ROOT, 'skills', 'presentation', 'templates', 'presentation')

const COPIED = [
  'tsconfig.json',
  'tsconfig.app.json',
  'vite.config.ts',
  'eslint.config.js',
  'index.html',
  '.gitignore',
  'public/favicon.svg',
  'src/main.tsx',
  'src/Router.tsx',
  'src/route.ts',
  'src/Landing.tsx',
  'src/index.css',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
  'src/presentation-kit',
]
const NOT_SCAFFOLDED_SCRIPTS = new Set(['test', 'test:integration', 'test:e2e', 'sync:template'])
const TEST_ONLY_DEPS = /^(vitest|jsdom|@testing-library\/.*)$/

const STARTER_SLUG = 'hello-scene'
const STARTER_TITLE = 'Hello Scene'
const REGISTRY = `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line before the marker. */
export const presentations: PresentationEntry[] = [
  {
    slug: '${STARTER_SLUG}',
    title: '${STARTER_TITLE}',
    load: () => import('./${STARTER_SLUG}/Talk'),
  },
  // presentations:end
]
`

function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '__tests__' ? [] : listFiles(full, base)
    return [path.relative(base, full)]
  })
}

function derivedPackageJson() {
  const root = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const devDependencies = Object.fromEntries(
    Object.entries(root.devDependencies).filter(([name]) => !TEST_ONLY_DEPS.test(name)),
  )
  const scripts = Object.fromEntries(Object.entries(root.scripts).filter(([name]) => !NOT_SCAFFOLDED_SCRIPTS.has(name)))
  return `${JSON.stringify({ ...root, name: 'presentation-app', scripts, devDependencies }, null, 2)}\n`
}

function derivedTsconfigNode() {
  const text = fs.readFileSync(path.join(ROOT, 'tsconfig.node.json'), 'utf8')
  return text.replace(/"include": \[[^\]]*\]/, '"include": ["vite.config.ts"]')
}

function starterFiles() {
  const out = {}
  for (const rel of listFiles(PRESENTATION_TEMPLATE)) {
    const text = fs.readFileSync(path.join(PRESENTATION_TEMPLATE, rel), 'utf8')
    out[path.join('src', 'presentations', STARTER_SLUG, rel)] = text
      .replaceAll('__SLUG__', STARTER_SLUG)
      .replaceAll('__TITLE__', STARTER_TITLE)
  }
  return out
}

/** Every file the bootstrap snapshot must contain, as relative path -> expected content. */
export function expectedTemplateFiles() {
  const files = {}
  for (const entry of COPIED) {
    const full = path.join(ROOT, entry)
    const rels = fs.statSync(full).isDirectory() ? listFiles(full, ROOT) : [entry]
    for (const rel of rels) files[rel] = fs.readFileSync(path.join(ROOT, rel))
  }
  files['package.json'] = derivedPackageJson()
  files['tsconfig.node.json'] = derivedTsconfigNode()
  files[path.join('src', 'presentations', 'index.ts')] = REGISTRY
  Object.assign(files, starterFiles())
  return files
}

/** Relative paths whose content differs from, or is missing in, the template. */
export function templateDrift() {
  const drift = []
  for (const [rel, content] of Object.entries(expectedTemplateFiles())) {
    const file = path.join(BOOTSTRAP, rel)
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(Buffer.from(content))) drift.push(rel)
  }
  return drift
}

function sync() {
  const expected = expectedTemplateFiles()
  for (const [rel, content] of Object.entries(expected)) {
    fs.mkdirSync(path.dirname(path.join(BOOTSTRAP, rel)), { recursive: true })
    fs.writeFileSync(path.join(BOOTSTRAP, rel), content)
  }
  // Remove template kit/script files that no longer exist canonically.
  for (const dir of ['src/presentation-kit', 'scripts']) {
    const abs = path.join(BOOTSTRAP, dir)
    if (!fs.existsSync(abs)) continue
    for (const rel of listFiles(abs, BOOTSTRAP)) if (!(rel in expected)) fs.rmSync(path.join(BOOTSTRAP, rel))
  }
  const lock = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: BOOTSTRAP, stdio: 'inherit' })
  if (lock.status !== 0) throw new Error('could not refresh the template lockfile')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const drift = templateDrift()
    if (drift.length) {
      console.error(`bootstrap template drift:\n${drift.join('\n')}`)
      process.exitCode = 1
    }
  } else sync()
}
