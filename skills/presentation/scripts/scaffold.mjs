#!/usr/bin/env node
// Deterministic helpers behind the presentation skill: anchor detection,
// scaffold target resolution, non-destructive scaffolding, registration.
//
//   node scaffold.mjs plan [dir]
//   node scaffold.mjs apply [dir] [--install]
//   node scaffold.mjs create <slug> "<Title>" [appDir]
//
// Templates are always resolved from this file's location, never from the cwd.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATES_DIR = path.join(SKILL_DIR, 'templates')

export function templatePath(name) {
  return path.join(TEMPLATES_DIR, name)
}

/** Template files, by the contract anchor they provide. */
const ANCHOR_FILES = {
  index: [
    'src/main.tsx',
    'src/AppRouter.tsx',
    'src/Landing.tsx',
    'src/route.ts',
    'src/presentations/',
  ],
  kit: ['src/presentation-kit/'],
}
// everything else in the bootstrap template belongs to the build anchor
const MONOREPO_DIRS = ['packages', 'apps']
const SAVED_AS = { _gitignore: '.gitignore' }
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'inspection'])

export const REQUIRED_DEPENDENCIES = ['react', 'react-dom', 'motion', 'lucide-react']
export const REQUIRED_DEV_DEPENDENCIES = [
  'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
  'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh',
  'globals', 'playwright',
]

const exists = (...p) => fs.existsSync(path.join(...p))
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function listFiles(root, rel = '') {
  const out = []
  for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue
    const next = path.join(rel, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(root, next))
    else out.push(next.split(path.sep).join('/'))
  }
  return out
}

function sourceFiles(dir) {
  return exists(dir) ? listFiles(dir).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f)).map((f) => path.join(dir, f)) : []
}

export function isEmptyDir(dir) {
  return !exists(dir) || fs.readdirSync(dir).filter((n) => n !== '.git').length === 0
}

/** Contract-level detection: file names, formatting and extra dependencies do not matter. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const hasVite = fs.existsSync(dir) && fs.readdirSync(dir).some((n) => /^vite\.config\./.test(n))
  const build = Boolean(pkg?.scripts?.build) && hasVite && exists(dir, 'tsconfig.json')

  const srcDirs = exists(dir, 'src')
    ? fs.readdirSync(path.join(dir, 'src'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(dir, 'src', e.name))
    : []
  const kit = srcDirs.some((d) => {
    const text = sourceFiles(d).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    return /export[^;]*\bPresentation\b|function Presentation\b/.test(text) && /\bStage\b/.test(text) && /\bStep\b/.test(text) && /\bScene(Props)?\b/.test(text)
  })

  const registry = ['index.ts', 'index.tsx', 'index.js', 'index.mjs']
    .map((n) => path.join(dir, 'src', 'presentations', n))
    .find((f) => fs.existsSync(f))
  const index = Boolean(registry) && /\bslug\b/.test(fs.readFileSync(registry, 'utf8')) && /\bload\b|import\(/.test(fs.readFileSync(registry, 'utf8'))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || exists(dir, 'pnpm-workspace.yaml') || MONOREPO_DIRS.some((d) => exists(dir, d))
}

const hasApp = (a) => a.kit || a.index

/**
 * Where the presentation app lives. An existing presentation app wins over any
 * monorepo signal; a monorepo gets its own app under `presentations/`.
 */
export function resolveTarget(dir) {
  const root = path.resolve(dir)
  const here = detectAnchors(root)
  const nested = path.join(root, 'presentations')
  const inNested = detectAnchors(nested)
  const nonEmpty = !isEmptyDir(root)
  if (hasApp(here)) return { target: root, kind: 'existing-app', anchors: here, needsConfirmation: nonEmpty }
  if (hasApp(inNested)) return { target: nested, kind: 'existing-app', anchors: inNested, needsConfirmation: nonEmpty }
  if (isMonorepo(root)) return { target: nested, kind: 'monorepo', anchors: inNested, needsConfirmation: nonEmpty }
  return { target: root, kind: isEmptyDir(root) ? 'empty' : 'standalone', anchors: here, needsConfirmation: nonEmpty }
}

function anchorOf(rel) {
  for (const [anchor, prefixes] of Object.entries(ANCHOR_FILES)) {
    if (prefixes.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p))) return anchor
  }
  return 'build'
}

function destName(rel) {
  const parts = rel.split('/')
  parts[parts.length - 1] = SAVED_AS[parts[parts.length - 1]] ?? parts[parts.length - 1]
  return parts.join('/')
}

/** What would be written, without touching the disk. */
export function planScaffold(dir) {
  const resolved = resolveTarget(dir)
  const { target, anchors } = resolved
  const missing = Object.keys(anchors).filter((a) => !anchors[a])
  const bootstrap = templatePath('bootstrap')
  const files = listFiles(bootstrap)
    .map((rel) => ({ rel: destName(rel), from: path.join(bootstrap, rel), anchor: anchorOf(rel) }))
    .filter((f) => missing.includes(f.anchor))
    .map((f) => ({ ...f, to: path.join(target, f.rel), action: exists(target, f.rel) ? 'skip-existing' : 'create' }))
  const pkg = readJson(path.join(target, 'package.json'))
  const template = readJson(path.join(bootstrap, 'package.json'))
  const wantDeps = Object.fromEntries(REQUIRED_DEPENDENCIES.map((n) => [n, template.dependencies[n]]))
  const wantDev = Object.fromEntries(REQUIRED_DEV_DEPENDENCIES.map((n) => [n, template.devDependencies[n]]))
  const has = (n) => Boolean(pkg?.dependencies?.[n] ?? pkg?.devDependencies?.[n])
  const addDependencies = Object.fromEntries(Object.entries(wantDeps).filter(([n]) => !has(n)))
  const addDevDependencies = Object.fromEntries(Object.entries(wantDev).filter(([n]) => !has(n)))
  const addScripts = Object.fromEntries(Object.entries(template.scripts).filter(([n]) => !pkg?.scripts?.[n]))
  return {
    ...resolved,
    missingAnchors: missing,
    scaffold: missing.length > 0,
    files,
    addDependencies,
    addDevDependencies,
    addScripts: missing.length > 0 ? addScripts : {},
    needsInstall: Object.keys(addDependencies).length + Object.keys(addDevDependencies).length > 0 || (missing.length > 0 && !exists(target, 'node_modules')),
  }
}

/** Writes missing files and merges package.json. Existing files are never overwritten. */
export function applyScaffold(plan, { install = false } = {}) {
  fs.mkdirSync(plan.target, { recursive: true })
  const written = []
  const skipped = []
  for (const f of plan.files) {
    if (f.action === 'skip-existing' || fs.existsSync(f.to)) {
      skipped.push(f.rel)
      continue
    }
    fs.mkdirSync(path.dirname(f.to), { recursive: true })
    fs.copyFileSync(f.from, f.to)
    written.push(f.rel)
  }
  const pkgFile = path.join(plan.target, 'package.json')
  const pkg = readJson(pkgFile) ?? { name: path.basename(plan.target) || 'presentations', private: true, version: '0.0.0', type: 'module' }
  const merge = (key, add) => {
    if (Object.keys(add).length === 0) return
    pkg[key] = { ...pkg[key] }
    for (const [name, value] of Object.entries(add)) if (!(name in pkg[key])) pkg[key][name] = value
  }
  merge('dependencies', plan.addDependencies)
  merge('devDependencies', plan.addDevDependencies)
  merge('scripts', plan.addScripts)
  const sorted = (o) => (o ? Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))) : o)
  if (pkg.dependencies) pkg.dependencies = sorted(pkg.dependencies)
  if (pkg.devDependencies) pkg.devDependencies = sorted(pkg.devDependencies)
  fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
  if (install) execFileSync('npm', ['install'], { cwd: plan.target, stdio: 'inherit' })
  return { written, skipped, installed: install }
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Appends one registry entry; every existing entry is left byte-for-byte as it was. */
export function registerPresentation(appDir, { slug, title, dir = slug }) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const file = path.join(appDir, 'src', 'presentations', 'index.ts')
  const source = fs.readFileSync(file, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`slug "${slug}" is already registered`)
  const close = source.lastIndexOf('\n]')
  if (close === -1) throw new Error('cannot find the end of the presentations array in src/presentations/index.ts')
  const entry = `  {\n    slug: ${JSON.stringify(slug).replace(/"/g, "'")},\n    title: ${JSON.stringify(title)},\n    load: () => import('./${dir}/Talk.tsx'),\n  },`
  const before = source.slice(0, close)
  const glue = before.endsWith(',') || before.endsWith('[') ? '\n' : ',\n'
  fs.writeFileSync(file, `${before}${glue}${entry}${source.slice(close)}`)
}

function copyTemplate(from, to, vars) {
  for (const rel of listFiles(from)) {
    const dest = path.join(to, rel)
    if (fs.existsSync(dest)) throw new Error(`${path.relative(process.cwd(), dest)} already exists`)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    let text = fs.readFileSync(path.join(from, rel), 'utf8')
    for (const [k, v] of Object.entries(vars)) text = text.split(k).join(v)
    fs.writeFileSync(dest, text)
  }
}

/** New presentation folder from the presentation template, registered in the index. */
export function createPresentation(appDir, { slug, title }) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const dest = path.join(appDir, 'src', 'presentations', slug)
  if (fs.existsSync(dest)) throw new Error(`presentation folder src/presentations/${slug} already exists`)
  copyTemplate(templatePath('presentation'), dest, { __SLUG__: slug, __TITLE__: title.replace(/\\/g, '\\\\').replace(/'/g, "\\'") })
  registerPresentation(appDir, { slug, title })
  return dest
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [command, ...rest] = process.argv.slice(2)
  const flags = rest.filter((a) => a.startsWith('--'))
  const args = rest.filter((a) => !a.startsWith('--'))
  try {
    if (command === 'plan') {
      const plan = planScaffold(args[0] ?? '.')
      console.log(JSON.stringify({ ...plan, files: plan.files.map(({ rel, anchor, action }) => ({ rel, anchor, action })) }, null, 2))
    } else if (command === 'apply') {
      console.log(JSON.stringify(applyScaffold(planScaffold(args[0] ?? '.'), { install: flags.includes('--install') }), null, 2))
    } else if (command === 'create') {
      console.log(createPresentation(path.resolve(args[2] ?? '.'), { slug: args[0], title: args[1] }))
    } else {
      throw new Error('usage: scaffold.mjs plan|apply [dir] [--install] | create <slug> "<Title>" [appDir]')
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
