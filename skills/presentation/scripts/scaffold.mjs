#!/usr/bin/env node
// Detects the presentation infrastructure in a project, resolves where it belongs, and
// scaffolds only what is missing from templates/bootstrap (resolved relative to this
// file, never the caller's working directory).
//
//   node scaffold.mjs --dir <project>                  print the plan (writes nothing)
//   node scaffold.mjs --dir <project> --apply [--confirmed] [--no-install]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const skillDir = path.resolve(import.meta.dirname, '..')
export const bootstrapDir = path.join(skillDir, 'templates', 'bootstrap')

const SKIP_DIRS = new Set(['node_modules', 'dist', '.inspection', '.git'])

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP_DIRS.has(entry.name)) return []
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full, base) : [path.relative(base, full)]
  })
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Names a TypeScript source file exports, however it declares or re-exports them. */
export function exportedNames(source) {
  const names = new Set()
  for (const m of source.matchAll(/export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+(\w+)/g)) names.add(m[1])
  // `export { x } from './y'` only re-exports; the declaration elsewhere is what counts
  for (const m of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()
      if (name) names.add(name)
    }
  }
  return names
}

/** The scene kit contract: step contract, host, navigation, fit scaling and chrome. */
export const KIT_CONTRACT = ['Step', 'SceneProps', 'Presentation', 'Stage', 'usePresentationNav', 'useFitScale', 'Header', 'Footer', 'Toc']

/**
 * The presentation index, whatever it is called: a source file directly inside
 * src/presentations/ that declares entries with a `slug` and a `load` function.
 */
export function findRegistry(dir) {
  const folder = path.join(dir, 'src', 'presentations')
  if (!fs.existsSync(folder)) return null
  const names = fs.readdirSync(folder).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f)).sort((a, b) => (a.startsWith('index.') ? -1 : b.startsWith('index.') ? 1 : 0))
  const match = names.find((f) => {
    const source = fs.readFileSync(path.join(folder, f), 'utf8')
    return /\bslug\b/.test(source) && /\bload\b/.test(source)
  })
  return match ? path.join(folder, match) : null
}

/** Contract-level anchor detection: keyed on what exists, not on byte-identical files. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build) && ['react', 'vite', 'typescript'].every((d) => d in deps)

  const exported = new Set()
  for (const rel of walk(path.join(dir, 'src'))) {
    if (!/\.(ts|tsx)$/.test(rel) || rel.split(path.sep)[0] === 'presentations') continue
    for (const name of exportedNames(fs.readFileSync(path.join(dir, 'src', rel), 'utf8'))) exported.add(name)
  }
  const kit = KIT_CONTRACT.every((name) => exported.has(name))

  return { build, kit, index: findRegistry(dir) !== null }
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return (
    Boolean(pkg?.workspaces) ||
    fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
    ['packages', 'apps'].some((d) => fs.statSync(path.join(dir, d), { throwIfNoEntry: false })?.isDirectory())
  )
}

const any = (a) => a.build || a.kit || a.index
const all = (a) => a.build && a.kit && a.index

/** Where the presentation app lives (or should live) for a project directory. */
export function resolveTarget(dir) {
  const nested = path.join(dir, 'presentations')
  if (any(detectAnchors(nested))) return { target: nested, reason: 'existing presentation app in presentations/' }
  if (isMonorepo(dir)) {
    if (all(detectAnchors(dir))) return { target: dir, reason: 'existing presentation app at the monorepo root' }
    return { target: nested, reason: 'monorepo: scaffold a self-contained app under presentations/' }
  }
  return { target: dir, reason: any(detectAnchors(dir)) ? 'existing presentation app' : 'standalone or empty project: scaffold at the root' }
}

const BUILD_FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore']

/** Template files that belong to each anchor. */
export function templateGroups() {
  const files = walk(bootstrapDir)
  const under = (prefix) => files.filter((f) => f.startsWith(prefix))
  const index = [...under(path.join('src', 'presentations')), 'src/router.tsx', 'src/resolveRoute.ts', 'src/Landing.tsx', 'src/main.tsx', 'src/index.css']
  return {
    build: BUILD_FILES.filter((f) => files.includes(f)),
    // the npm scripts added by the manifest merge point at these files, so they travel with any scaffold
    tooling: under('scripts'),
    kit: under(path.join('src', 'presentation-kit')),
    index: index.filter((f) => files.includes(f)),
  }
}

function mergeManifest(existing, template) {
  const added = []
  const merged = { ...existing }
  for (const key of ['dependencies', 'devDependencies']) {
    merged[key] = { ...existing[key] }
    for (const [name, version] of Object.entries(template[key] ?? {})) {
      const present = name in (existing.dependencies ?? {}) || name in (existing.devDependencies ?? {})
      if (!present) {
        merged[key][name] = version
        added.push(name)
      }
    }
    merged[key] = Object.fromEntries(Object.entries(merged[key]).sort(([a], [b]) => a.localeCompare(b)))
  }
  merged.scripts = { ...existing.scripts }
  for (const [name, command] of Object.entries(template.scripts ?? {})) {
    if (!(name in merged.scripts)) {
      merged.scripts[name] = command
      added.push(`script:${name}`)
    }
  }
  if (!merged.type) merged.type = template.type
  return { merged, added }
}

/** What a scaffold run would do for a project directory. Writes nothing. */
export function planScaffold(dir) {
  const { target, reason } = resolveTarget(dir)
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((a) => !anchors[a])
  // the project the user is in decides "non-empty", even when the app goes in a subfolder
  const nonEmpty = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f !== '.git')
  const groups = templateGroups()
  const copy = []
  const skip = []
  for (const anchor of missing.length > 0 ? [...missing, 'tooling'] : []) {
    for (const rel of groups[anchor]) {
      if (rel === 'package.json') continue
      const dest = path.join(target, rel)
      // never overwrite: an existing lockfile belongs to the existing manifest
      ;(fs.existsSync(dest) || (rel === 'package-lock.json' && fs.existsSync(path.join(target, 'package.json'))) ? skip : copy).push(rel)
    }
  }
  return {
    target,
    reason,
    anchors,
    missing,
    nonEmpty,
    requiresConfirmation: nonEmpty && missing.length > 0,
    copy,
    skip,
    manifest: missing.length === 0 ? 'unchanged' : fs.existsSync(path.join(target, 'package.json')) ? 'merge' : 'create',
  }
}

/** Applies a plan: copies only missing files, merges the manifest, optionally installs. */
export function applyScaffold(dir, { confirmed = false, install = true } = {}) {
  const plan = planScaffold(dir)
  if (plan.requiresConfirmation && !confirmed) {
    const error = new Error(`confirmation required before writing to ${plan.target} (missing: ${plan.missing.join(', ')})`)
    error.code = 'CONFIRMATION_REQUIRED'
    error.plan = plan
    throw error
  }
  if (plan.missing.length === 0) return { ...plan, written: [], added: [], installed: false, notes: ['all anchors present: nothing to scaffold'] }

  fs.mkdirSync(plan.target, { recursive: true })
  const written = []
  for (const rel of plan.copy) {
    const dest = path.join(plan.target, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(bootstrapDir, rel), dest)
    written.push(rel)
  }

  const template = readJson(path.join(bootstrapDir, 'package.json'))
  const manifestFile = path.join(plan.target, 'package.json')
  let added = []
  if (plan.manifest === 'create') {
    fs.writeFileSync(manifestFile, `${JSON.stringify(template, null, 2)}\n`)
    written.push('package.json')
    added = ['all']
  } else {
    const existing = readJson(manifestFile)
    if (!existing) throw new Error(`${manifestFile} is not valid JSON`)
    const result = mergeManifest(existing, template)
    added = result.added
    if (added.length > 0) fs.writeFileSync(manifestFile, `${JSON.stringify(result.merged, null, 2)}\n`)
  }

  const notes = []
  if (plan.missing.includes('index') && !written.includes('src/main.tsx')) {
    notes.push('src/main.tsx already exists: render <Router pathname={window.location.pathname} registry={PRESENTATIONS} /> from it')
  }
  notes.push('render checks need a Chromium build: run `npx playwright install chromium` in the app before `npm run verify`')
  let installed = false
  if (install && (added.length > 0 || !fs.existsSync(path.join(plan.target, 'node_modules')))) {
    const result = spawnSync('npm', ['install'], { cwd: plan.target, stdio: 'inherit', shell: process.platform === 'win32' })
    if (result.status !== 0) throw new Error(`npm install failed in ${plan.target}`)
    installed = true
  }
  return { ...plan, written, added, installed, notes }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const value = (flag) => args[args.indexOf(flag) + 1]
  const dir = path.resolve(args.includes('--dir') ? value('--dir') : process.cwd())
  try {
    const result = args.includes('--apply')
      ? applyScaffold(dir, { confirmed: args.includes('--confirmed'), install: !args.includes('--no-install') })
      : planScaffold(dir)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(`scaffold: ${error.message}`)
    process.exitCode = error.code === 'CONFIRMATION_REQUIRED' ? 2 : 1
  }
}
