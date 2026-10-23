#!/usr/bin/env node
// Deterministic helper for the presentation skill: detect anchors, resolve the
// scaffold target, copy templates, and register presentations. Template paths
// resolve from this file's location (inside the skill), never from the cwd.
//
//   node scaffold.mjs detect <dir>
//   node scaffold.mjs bootstrap <dir> [--confirm]
//   node scaffold.mjs create <dir> --slug <slug> --title <title>
//   node scaffold.mjs list <dir>
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_DIR = path.join(SKILL_DIR, 'templates', 'presentation')
export const REGISTRY_MARKER = '// new presentations are registered above this line'

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const exists = (...p) => existsSync(path.join(...p))

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))],
  )
}

export function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0
}

function sourceFiles(dir) {
  if (!existsSync(dir)) return []
  return listFiles(dir).filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => path.join(dir, f))
}

const EXPORTS_PRESENTATION =
  /export\s+(?:default\s+)?(?:function|const|class)\s+Presentation\b|export\s*(?:type\s*)?\{[^}]*\bPresentation\b/
const EXPORTS_STEP_CONTRACT =
  /export\s+(?:default\s+)?(?:interface|type)\s+(?:Step|Scene)\b|export\s*(?:type\s*)?\{[^}]*\b(?:Step|Scene)\b/

/** The registry source file, `index.ts` or `index.tsx`, if present. */
export function registryFile(app) {
  return ['index.ts', 'index.tsx'].map((n) => path.join(app, 'src', 'presentations', n)).find(existsSync)
}

/**
 * Contract-level detection of the three anchors in an app directory: a working
 * Vite/React/TypeScript build, a kit whose sources export the `Presentation`
 * host and the `Step`/`Scene` contract (whatever the files are called), and a
 * registry that maps slugs to loaders.
 */
export function detectAnchors(dir) {
  let build = false
  if (exists(dir, 'package.json')) {
    const pkg = readJson(path.join(dir, 'package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const hasVite = readdirSync(dir).some((n) => /^vite\.config\./.test(n))
    build = Boolean(pkg.scripts?.build && deps.vite && deps.react && deps.typescript && hasVite && exists(dir, 'tsconfig.json'))
  }
  const kitSources = sourceFiles(path.join(dir, 'src', 'presentation-kit')).map((f) => readFileSync(f, 'utf8'))
  const kit = kitSources.some((t) => EXPORTS_PRESENTATION.test(t)) && kitSources.some((t) => EXPORTS_STEP_CONTRACT.test(t))
  const registry = registryFile(dir)
  const index = Boolean(registry) && /\bslug\b/.test(readFileSync(registry, 'utf8')) && /\bload\b/.test(readFileSync(registry, 'utf8'))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  if (exists(dir, 'pnpm-workspace.yaml')) return true
  if (exists(dir, 'package.json') && readJson(path.join(dir, 'package.json')).workspaces) return true
  return ['packages', 'apps'].some((n) => exists(dir, n) && statSync(path.join(dir, n)).isDirectory())
}

const anyAnchor = (a) => a.build || a.kit || a.index

/**
 * Where the presentation app lives. In a monorepo the root only counts as the
 * app when it already holds presentation infrastructure (kit or index); a
 * build setup alone is the monorepo's own, so the app goes in presentations/.
 * Outside a monorepo any anchor at the root means we are inside the app.
 */
export function resolveTarget(dir) {
  const root = path.resolve(dir)
  const nested = path.join(root, 'presentations')
  const rootAnchors = detectAnchors(root)
  if (isMonorepo(root)) {
    if (rootAnchors.kit || rootAnchors.index) return { target: root, reason: 'existing presentation app at the monorepo root' }
    return { target: nested, reason: 'monorepo: self-contained app in presentations/' }
  }
  if (anyAnchor(rootAnchors)) return { target: root, reason: 'existing presentation app at the root' }
  if (exists(nested) && anyAnchor(detectAnchors(nested))) {
    return { target: nested, reason: 'existing presentation app in presentations/' }
  }
  return { target: root, reason: isEmptyDir(root) ? 'empty directory: scaffold at the root' : 'standalone project: scaffold at the root' }
}

export function detect(dir) {
  const { target, reason } = resolveTarget(dir)
  const anchors = detectAnchors(target)
  return {
    root: path.resolve(dir),
    target,
    reason,
    anchors,
    missing: Object.keys(anchors).filter((k) => !anchors[k]),
    targetIsEmpty: isEmptyDir(target),
  }
}

/** Entry wiring and verification scripts serve both the build and the index anchors. */
export const SHARED_FILES = new Set(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/main.tsx'])

/** Which anchor a bootstrap template file belongs to. */
export function anchorOf(rel) {
  const r = rel.split(path.sep).join('/')
  if (r.startsWith('src/presentation-kit/')) return 'kit'
  if (r.startsWith('src/presentations/') || ['src/Router.tsx', 'src/route.ts', 'src/Landing.tsx'].includes(r)) return 'index'
  return 'build'
}

function mergePackageJson(targetFile, templateFile) {
  const targetRoot = path.dirname(targetFile)
  const tpl = readJson(templateFile)
  if (!existsSync(targetFile)) {
    writeFileSync(targetFile, JSON.stringify(tpl, null, 2) + '\n')
    return { created: true, added: [] }
  }
  const pkg = readJson(targetFile)
  const added = []
  for (const section of ['dependencies', 'devDependencies']) {
    pkg[section] ??= {}
    const present = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const [name, range] of Object.entries(tpl[section])) {
      if (!present[name]) {
        pkg[section][name] = range
        added.push(name)
      }
    }
  }
  pkg.scripts ??= {}
  for (const [name, cmd] of Object.entries(tpl.scripts)) {
    const file = /(scripts\/[\w.-]+\.mjs)/.exec(cmd)?.[1]
    if (file && !existsSync(path.join(targetRoot, file))) continue // never reference an absent script
    if (!pkg.scripts[name]) {
      pkg.scripts[name] = cmd
      added.push(`script:${name}`)
    }
  }
  writeFileSync(targetFile, JSON.stringify(pkg, null, 2) + '\n')
  return { created: false, added }
}

/**
 * Scaffolds only the missing anchors into the resolved target. Existing files
 * are never overwritten; package.json gains only missing dependencies/scripts.
 * A non-empty target requires `confirmed`.
 */
export function bootstrap(dir, { confirmed = false } = {}) {
  const info = detect(dir)
  if (info.missing.length === 0) return { ...info, status: 'complete', written: [], kept: [], notes: [] }
  if (!(isEmptyDir(info.root) && info.targetIsEmpty) && !confirmed) {
    return { ...info, status: 'needs-confirmation', written: [], kept: [], notes: [] }
  }
  mkdirSync(info.target, { recursive: true })
  const written = []
  const kept = []
  for (const rel of listFiles(BOOTSTRAP_DIR)) {
    const wanted = SHARED_FILES.has(rel)
      ? info.missing.includes('build') || info.missing.includes('index')
      : info.missing.includes(anchorOf(rel))
    if (!wanted) continue
    const src = path.join(BOOTSTRAP_DIR, rel)
    const dest = path.join(info.target, rel)
    if (rel === 'package.json') continue
    if (rel === 'package-lock.json' && exists(info.target, 'package.json')) continue
    if (rel === '.gitignore' && existsSync(dest)) {
      const have = readFileSync(dest, 'utf8')
      const extra = readFileSync(src, 'utf8').split('\n').filter((l) => l && !have.split('\n').includes(l))
      if (extra.length) writeFileSync(dest, have.replace(/\n?$/, '\n') + extra.join('\n') + '\n')
      continue
    }
    if (existsSync(dest)) {
      kept.push(rel)
      continue
    }
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest)
    written.push(rel)
  }
  const merged = mergePackageJson(path.join(info.target, 'package.json'), path.join(BOOTSTRAP_DIR, 'package.json'))
  written.push(...merged.added.map((a) => `package.json:${a}`))
  if (merged.created) written.push('package.json')
  const notes = []
  const entry = path.join(info.target, 'src', 'main.tsx')
  if (info.missing.includes('index') && kept.includes('src/main.tsx') && !/Router/.test(readFileSync(entry, 'utf8'))) {
    notes.push(
      'src/main.tsx was kept: render <Router pathname={window.location.pathname} entries={presentations} /> from src/Router.tsx with the registry from src/presentations/index.ts so each presentation is reachable at /<slug>',
    )
  }
  return { ...info, status: 'scaffolded', written, kept, notes }
}

export function validSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}

export function listPresentations(dir) {
  const { target } = resolveTarget(dir)
  const file = registryFile(target)
  if (!file) return []
  return [...readFileSync(file, 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/** Copies the presentation template as a new folder and appends one registry line. */
export function createPresentation(dir, { slug, title }) {
  if (!validSlug(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const { target } = resolveTarget(dir)
  const info = detectAnchors(target)
  if (!info.kit || !info.index) throw new Error('scaffold is incomplete: run bootstrap first')
  const registry = registryFile(target)
  const source = readFileSync(registry, 'utf8')
  if (!source.includes(REGISTRY_MARKER)) {
    throw new Error(`registry has no "${REGISTRY_MARKER}" line; add the entry by hand`)
  }
  const folder = path.join(target, 'src', 'presentations', slug)
  if (existsSync(folder) || listPresentations(dir).includes(slug)) throw new Error(`presentation "${slug}" already exists`)
  const written = []
  for (const rel of listFiles(PRESENTATION_DIR)) {
    const text = readFileSync(path.join(PRESENTATION_DIR, rel), 'utf8')
      .replaceAll('__TITLE_JSON__', JSON.stringify(title))
      .replaceAll('__SLUG__', slug)
    const dest = path.join(folder, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, text)
    written.push(path.relative(target, dest))
  }
  const entry = `  { slug: '${slug}', title: ${JSON.stringify(title)}, load: () => import('./${slug}/Talk.tsx') },\n`
  const lines = source.split('\n')
  const at = lines.findIndex((l) => l.includes(REGISTRY_MARKER))
  lines.splice(at, 0, entry.trimEnd())
  writeFileSync(registry, lines.join('\n'))
  return { target, slug, route: `/${slug}`, written }
}

function main(argv) {
  const [cmd, dir = '.', ...rest] = argv
  const flag = (name) => {
    const i = rest.indexOf(name)
    return i >= 0 ? rest[i + 1] : undefined
  }
  let result
  if (cmd === 'detect') result = detect(dir)
  else if (cmd === 'bootstrap') result = bootstrap(dir, { confirmed: rest.includes('--confirm') })
  else if (cmd === 'create') result = createPresentation(dir, { slug: flag('--slug'), title: flag('--title') })
  else if (cmd === 'list') result = listPresentations(dir)
  else {
    console.error('usage: scaffold.mjs detect|bootstrap|create|list <dir> [--confirm] [--slug s --title t]')
    process.exit(2)
  }
  console.log(JSON.stringify(result, null, 2))
  if (result.status === 'needs-confirmation') process.exit(3)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main(process.argv.slice(2))
  } catch (e) {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
