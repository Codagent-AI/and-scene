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

// Each signal is one capability of the scene-kit contract; removing any one means the kit is incomplete.
export const KIT_SIGNALS = [
  /\b(interface|type)\s+Step\b/, // step contract
  /\b(interface|type)\s+SceneProps\b/,
  /\bexport\s+(default\s+)?(function|const)\s+Presentation\b/, // presentation host
  /\bAnimatePresence\b/, // stage / entity morphs
  /\bLayoutGroup\b/,
  /\bArrowRight\b/, // keyboard navigation
  /\bPageDown\b/,
  /\btouch(start|end)\b/i, // swipe
  /['"]present['"]/, // present mode
  /['"]browse['"]/, // browse mode
  /\bcaption\b/i, // chrome: captions
  /\btoc\b/i, // chrome: table of contents
  /\bscale\s*\(/, // fit-scale canvas
]

const REGISTRY_SIGNALS = [/\bslug\s*:/, /\bload\s*:/, /\bimport\s*\(/]
const ROUTING_SIGNALS = [/\bpathname\b/, /\b(lazy|Suspense)\b/]

function sourceFiles(dir) {
  return walk(path.join(dir, 'src')).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
}

function readSources(dir) {
  return sourceFiles(dir).map((f) => ({ rel: path.join('src', f), text: readFileSync(path.join(dir, 'src', f), 'utf8') }))
}

/** The file declaring the registry array (slug/load/import() entries), if any. */
export function findRegistryFile(dir) {
  return readSources(dir).find((f) => REGISTRY_SIGNALS.every((re) => re.test(f.text)))?.rel ?? null
}

/** Directory of the kit: the file exporting the Presentation component. */
export function findKitDir(dir) {
  const host = readSources(dir).find((f) => /\bexport\s+(default\s+)?(function|const)\s+Presentation\b/.test(f.text))
  return host ? path.dirname(host.rel) : null
}

/** Contract-level detection: what the files do, not what they are called. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    /\bvite\s+build\b/.test(pkg?.scripts?.build ?? '') &&
    ['vite', 'react', 'react-dom', 'typescript'].every((d) => d in deps) &&
    (existsSync(path.join(dir, 'index.html')) || existsSync(path.join(dir, 'tsconfig.json')))
  const sources = readSources(dir)
  const all = sources.map((f) => f.text).join('\n')
  const kit = KIT_SIGNALS.every((re) => re.test(all))
  const index = findRegistryFile(dir) !== null && ROUTING_SIGNALS.every((re) => re.test(all))
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

/** The module entry named by index.html (`/src/main.tsx` by default). */
function findEntry(target) {
  try {
    const html = readFileSync(path.join(target, 'index.html'), 'utf8')
    const m = /<script[^>]*type=["']module["'][^>]*src=["']\/?([^"']+)["']/.exec(html)
    if (m) return m[1]
  } catch {
    // no index.html yet
  }
  return 'src/main.tsx'
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
  // Without the index anchor the app's entry point does not mount the router, so the new routes would be unreachable.
  const entry = findEntry(target)
  const replacesEntry = !anchors.index && existsSync(path.join(target, entry))
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
    entry: replacesEntry ? { path: entry, backup: backupName(target, entry), router: routerEntryName(target, entry) } : null,
  }
}

/** Where the router entry goes: src/main.tsx, unless that is unrelated user code (then a non-colliding name). */
function routerEntryName(target, entry) {
  if (entry === 'src/main.tsx' || !existsSync(path.join(target, 'src/main.tsx'))) return 'src/main.tsx'
  let name = 'src/presentations-main.tsx'
  for (let i = 2; existsSync(path.join(target, name)); i++) name = `src/presentations-main-${i}.tsx`
  return name
}

function backupName(target, entry) {
  const ext = path.extname(entry)
  const base = entry.slice(0, -ext.length)
  let name = `${base}.original${ext}`
  for (let i = 2; existsSync(path.join(target, name)); i++) name = `${base}.original-${i}${ext}`
  return name
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
    const err = new Error(`confirmation required: scaffold into ${p.target} (missing: ${p.missing.join(', ')}${p.entry ? `; entry ${p.entry.path} will be replaced, original saved as ${p.entry.backup}${p.entry.router === 'src/main.tsx' ? '' : `; router entry written to ${p.entry.router}`}` : ''}); rerun with --confirmed after the user agrees`)
    err.code = 'NEEDS_CONFIRMATION'
    throw err
  }
  const written = []
  const skipped = []
  let freshLock = false
  if (p.mergePackageJson) {
    const templatePkg = readJson(path.join(TEMPLATES.bootstrap, 'package.json'))
    const file = path.join(p.target, 'package.json')
    mkdirSync(p.target, { recursive: true })
    const existing = readJson(file)
    const { merged, added } = mergePackageJson(existing ?? { name: path.basename(p.target), private: true, version: '0.0.0', type: 'module' }, templatePkg)
    if (!existing || added.length) {
      writeFileSync(file, JSON.stringify(merged, null, 2) + '\n')
      written.push('package.json')
    }
    freshLock = !existing
  }
  if (p.entry) {
    cpSync(path.join(p.target, p.entry.path), path.join(p.target, p.entry.backup))
    written.push(p.entry.backup)
  }
  for (const { rel, exists } of p.files) {
    if (p.entry && rel === 'src/main.tsx') continue // written below under its collision-free name
    if (exists) {
      skipped.push(rel)
      continue
    }
    const to = path.join(p.target, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(path.join(TEMPLATES.bootstrap, rel), to)
    written.push(rel)
  }
  if (p.entry) {
    cpSync(path.join(TEMPLATES.bootstrap, 'src/main.tsx'), path.join(p.target, p.entry.router))
    written.push(p.entry.router)
    if (p.entry.path !== p.entry.router) {
      const html = path.join(p.target, 'index.html')
      const escaped = p.entry.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      writeFileSync(html, readFileSync(html, 'utf8').replace(new RegExp(`(src=["']/?)${escaped}`), `$1${p.entry.router}`))
      written.push('index.html')
    }
  }
  let installed = false
  if (install && p.mergePackageJson) {
    const run = spawnSync('npm', [freshLock ? 'ci' : 'install'], { cwd: p.target, stdio: 'inherit' })
    if (run.status !== 0) {
      const err = new Error(`dependency installation failed (npm ${freshLock ? 'ci' : 'install'} exited ${run.status}) in ${p.target}`)
      err.code = 'INSTALL_FAILED'
      throw err
    }
    installed = true
  }
  return { ...p, written, skipped, installed }
}

const posix = (p) => p.split(path.sep).join('/')

/** Substitutes slug, kit import path and a JS string literal for the title (valid in any source context). */
function render(text, vars) {
  return text.replaceAll('__SLUG__', vars.slug).replaceAll('__KIT__', vars.kit).replaceAll('__TITLE_LIT__', JSON.stringify(vars.title))
}

/** Adds one registry entry before the array's closing bracket; every existing line is preserved. */
export function registerPresentation(source, { slug, title }) {
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`slug already registered: ${slug}`)
  const close = source.lastIndexOf(']')
  if (close < 0) throw new Error('cannot find the end of the presentations array in the registry')
  const before = source.slice(0, close).replace(/\s+$/, '')
  const comma = /[,[]$/.test(before) ? '' : ','
  const entry = `  {\n    slug: ${JSON.stringify(slug)},\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk'),\n  },`
  return `${before}${comma}\n${entry}\n${source.slice(close)}`
}

export function createPresentation(dir, { slug, title }) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error(`invalid slug: ${slug}`)
  const { target } = resolveTarget(dir)
  const registry = findRegistryFile(target)
  if (!registry) throw new Error(`no presentation registry found under ${target}/src; scaffold first`)
  const kitDir = findKitDir(target)
  if (!kitDir || !['index.ts', 'index.tsx'].some((f) => existsSync(path.join(target, kitDir, f)))) {
    throw new Error(`cannot locate the scene kit entry (index.ts) under ${target}/src; scaffold first`)
  }
  const folder = path.join(target, path.dirname(registry), slug)
  if (existsSync(folder)) throw new Error(`presentation folder already exists: ${folder}`)
  const registryFile = path.join(target, registry)
  const updated = registerPresentation(readFileSync(registryFile, 'utf8'), { slug, title })
  const kit = posix(path.relative(folder, path.join(target, kitDir)))
  const written = []
  for (const rel of walk(TEMPLATES.presentation)) {
    const to = path.join(folder, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    writeFileSync(to, render(readFileSync(path.join(TEMPLATES.presentation, rel), 'utf8'), { slug, title, kit }))
    written.push(path.relative(target, to))
  }
  writeFileSync(registryFile, updated)
  return { target, written, registered: slug, registry }
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
