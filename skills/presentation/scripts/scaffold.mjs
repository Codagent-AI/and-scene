#!/usr/bin/env node
// Scaffolding helper for the presentation skill. Templates are resolved relative to this file, never the cwd.
//   node scaffold.mjs detect <dir>                   anchors, monorepo signal, resolved target
//   node scaffold.mjs plan <dir>                     what apply would write, and whether confirmation is required
//   node scaffold.mjs apply <dir> [--confirmed] [--install]
//   node scaffold.mjs new <dir> --slug <slug> --title <title>
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATES = {
  bootstrap: path.join(SKILL_DIR, 'templates', 'bootstrap'),
  presentation: path.join(SKILL_DIR, 'templates', 'presentation'),
}

const MONOREPO_DIRS = ['packages', 'apps']
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function walk(dir, base = dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, base))
    else out.push(path.relative(base, full))
  }
  return out.sort()
}

/** Empty means nothing but version-control metadata. */
export function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).every((n) => n === '.git')
}

export function detectMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) return 'package.json workspaces'
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return 'pnpm-workspace.yaml'
  for (const d of MONOREPO_DIRS) if (existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory()) return `${d}/ layout`
  return null
}

const KIT_SIGNALS = [
  /\b(interface|type)\s+Step\b/,
  /\b(interface|type)\s+SceneProps\b/,
  /\bexport\s+(default\s+)?(function|const)\s+Presentation\b/,
  /\bAnimatePresence\b/,
  /\bArrowRight\b/,
  /\bscale\s*\(/,
]

const REGISTRY_SIGNALS = [/\bslug\s*:/, /\bload\s*:/, /\bimport\s*\(/]

function sourceFiles(dir) {
  return walk(path.join(dir, 'src')).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
}

/** Contract-level detection: what the files do, not what they are called. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build) && 'vite' in deps && 'react' in deps && 'typescript' in deps
  const texts = sourceFiles(dir).map((f) => readFileSync(path.join(dir, 'src', f), 'utf8'))
  const kitText = texts.join('\n')
  const kit = KIT_SIGNALS.every((re) => re.test(kitText))
  const index = texts.some((t) => REGISTRY_SIGNALS.every((re) => re.test(t)))
  return { build, kit, index }
}

/** An existing presentation app (kit or index present) wins: the dir, its ancestors, or <dir>/presentations. */
export function findExistingApp(dir) {
  const candidates = [path.resolve(dir)]
  for (let d = path.dirname(candidates[0]), i = 0; i < 4 && d !== path.dirname(d); d = path.dirname(d), i++) candidates.push(d)
  candidates.push(path.join(path.resolve(dir), 'presentations'))
  return candidates.find((c) => existsSync(c) && (([, k, i]) => k || i)(Object.values(detectAnchors(c)))) ?? null
}

export function resolveTarget(dir) {
  const root = path.resolve(dir)
  const existing = findExistingApp(root)
  if (existing) return { target: existing, monorepo: detectMonorepo(root), reason: 'existing presentation app' }
  const monorepo = detectMonorepo(root)
  if (monorepo) return { target: path.join(root, 'presentations'), monorepo, reason: `monorepo (${monorepo}): self-contained app under presentations/` }
  return { target: root, monorepo: null, reason: isEmptyDir(root) ? 'empty directory: scaffold at the root' : 'standalone project: scaffold at the root' }
}

function groupOf(rel) {
  if (rel.startsWith(`src${path.sep}presentation-kit${path.sep}`)) return 'kit'
  if (rel.startsWith(`scripts${path.sep}`)) return 'tooling'
  const indexFiles = ['src/main.tsx', 'src/Router.tsx', 'src/routes.ts', 'src/Landing.tsx'].map((f) => f.split('/').join(path.sep))
  if (indexFiles.includes(rel) || rel.startsWith(`src${path.sep}presentations${path.sep}`)) return 'index'
  return 'build'
}

export function plan(dir) {
  const root = path.resolve(dir)
  const { target, monorepo, reason } = resolveTarget(root)
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  const wanted = new Set(missing)
  if (missing.length) wanted.add('tooling')
  const files = walk(TEMPLATES.bootstrap)
    .filter((rel) => wanted.has(groupOf(rel)))
    .filter((rel) => rel !== 'package.json' && !(rel === 'package-lock.json' && existsSync(path.join(target, 'package.json'))))
  return {
    root,
    target,
    monorepo,
    reason,
    anchors,
    missing,
    emptyProject: isEmptyDir(root),
    needsConfirmation: missing.length > 0 && !isEmptyDir(root),
    files: files.map((rel) => ({ rel, exists: existsSync(path.join(target, rel)) })),
    mergePackageJson: missing.length > 0,
  }
}

/** Adds missing dependencies and scripts to a package.json; existing entries are never changed. */
export function mergePackageJson(existing, template) {
  const merged = { ...existing }
  const added = []
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    merged[field] = { ...existing[field] }
    for (const [name, value] of Object.entries(template[field] ?? {})) {
      const taken = field === 'scripts' ? name in merged.scripts : name in { ...existing.dependencies, ...existing.devDependencies }
      if (!taken) {
        merged[field][name] = value
        added.push(`${field}.${name}`)
      }
    }
    if (!Object.keys(merged[field]).length) delete merged[field]
  }
  return { merged, added }
}

export function apply(dir, { confirmed = false, install = false } = {}) {
  const p = plan(dir)
  if (p.needsConfirmation && !confirmed) {
    const err = new Error(`confirmation required: scaffold into ${p.target} (missing: ${p.missing.join(', ')}); rerun with --confirmed after the user agrees`)
    err.code = 'NEEDS_CONFIRMATION'
    throw err
  }
  const written = []
  const skipped = []
  if (p.mergePackageJson) {
    const templatePkg = readJson(path.join(TEMPLATES.bootstrap, 'package.json'))
    const file = path.join(p.target, 'package.json')
    mkdirSync(p.target, { recursive: true })
    const existing = readJson(file)
    const { merged, added } = mergePackageJson(existing ?? { name: path.basename(p.target), private: true, version: '0.0.0', type: 'module' }, templatePkg)
    if (!existing || added.length) writeFileSync(file, JSON.stringify(merged, null, 2) + '\n')
    if (!existing || added.length) written.push('package.json')
  }
  for (const { rel, exists } of p.files) {
    if (exists) {
      skipped.push(rel)
      continue
    }
    const to = path.join(p.target, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(path.join(TEMPLATES.bootstrap, rel), to)
    written.push(rel)
  }
  if (install && p.mergePackageJson) {
    const hasLock = existsSync(path.join(p.target, 'package-lock.json'))
    spawnSync('npm', [hasLock ? 'ci' : 'install'], { cwd: p.target, stdio: 'inherit' })
  }
  return { ...p, written, skipped }
}

const render = (text, vars) => text.replaceAll('__SLUG__', vars.slug).replaceAll('__TITLE__', vars.title)

/** Adds one registry entry before the closing bracket; every existing line is preserved. */
export function registerPresentation(source, { slug, title }) {
  const entry = `  {\n    slug: ${JSON.stringify(slug)},\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk'),\n  },\n`
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`slug already registered: ${slug}`)
  const close = source.lastIndexOf('\n]')
  if (close < 0) throw new Error('cannot find the end of the presentations array in src/presentations/index.ts')
  return source.slice(0, close + 1) + entry + source.slice(close + 1)
}

export function createPresentation(dir, { slug, title }) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error(`invalid slug: ${slug}`)
  const { target } = resolveTarget(dir)
  const folder = path.join(target, 'src', 'presentations', slug)
  if (existsSync(folder)) throw new Error(`presentation folder already exists: ${folder}`)
  const indexFile = path.join(target, 'src', 'presentations', 'index.ts')
  const indexSource = readFileSync(indexFile, 'utf8')
  const updated = registerPresentation(indexSource, { slug, title })
  const written = []
  for (const rel of walk(TEMPLATES.presentation)) {
    const to = path.join(folder, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    writeFileSync(to, render(readFileSync(path.join(TEMPLATES.presentation, rel), 'utf8'), { slug, title }))
    written.push(path.relative(target, to))
  }
  writeFileSync(indexFile, updated)
  return { target, written, registered: slug }
}

function main(argv) {
  const [cmd, dir = process.cwd(), ...rest] = argv
  const flag = (n) => rest.includes(`--${n}`)
  const value = (n) => rest[rest.indexOf(`--${n}`) + 1]
  try {
    const result =
      cmd === 'detect' ? { anchors: detectAnchors(resolveTarget(dir).target), ...resolveTarget(dir), monorepo: detectMonorepo(dir) }
      : cmd === 'plan' ? plan(dir)
      : cmd === 'apply' ? apply(dir, { confirmed: flag('confirmed'), install: flag('install') })
      : cmd === 'new' ? createPresentation(dir, { slug: value('slug'), title: value('title') })
      : null
    if (!result) throw new Error('usage: scaffold.mjs detect|plan|apply|new <dir> [--confirmed] [--install] [--slug s --title t]')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error(err.message)
    process.exitCode = err.code === 'NEEDS_CONFIRMATION' ? 2 : 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
