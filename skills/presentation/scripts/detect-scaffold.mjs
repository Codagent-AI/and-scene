#!/usr/bin/env node
// Optional helper for the presentation skill: detects the three scaffold anchors by contract,
// resolves where the presentation app belongs, and applies the copy/merge scaffold procedure.
//
//   node <skill>/scripts/detect-scaffold.mjs [dir]                 print the target resolution as JSON
//   node <skill>/scripts/detect-scaffold.mjs [dir] --apply         scaffold the missing anchors (after the user confirmed)
//
// Template paths are resolved from this file's location, never from the caller's cwd.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Absolute path of the bootstrap template, independent of the cwd. */
export const BOOTSTRAP_DIR = join(skillDir, 'templates', 'bootstrap')
/** Absolute path of the new-presentation templates, independent of the cwd. */
export const PRESENTATION_TEMPLATE_DIR = join(skillDir, 'templates', 'presentation')

export const ANCHORS = ['build', 'kit', 'index']
export const KIT_DIR = 'src/presentation-kit'
export const INDEX_CANDIDATES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.mjs'].map(
  (f) => `src/presentations/${f}`,
)

function readText(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

function readJson(file) {
  const text = readText(file)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

function isDirectory(p) {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/** Build setup: a Vite + React + TypeScript app whose package.json defines `build`. */
function hasBuildSetup(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  if (!pkg || typeof pkg.scripts?.build !== 'string') return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (!deps.vite || !deps.react || !deps.typescript) return false
  const hasViteConfig = readdirSync(dir).some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f))
  const hasTsConfig = existsSync(join(dir, 'tsconfig.json'))
  return hasViteConfig && hasTsConfig
}

/**
 * Scene kit: the kit directory must actually provide the step contract, the stage/host, the
 * navigation, the fit-scale canvas and the presentation entry. File names and formatting are free.
 */
function hasSceneKit(dir) {
  const kit = join(dir, KIT_DIR)
  if (!isDirectory(kit)) return false
  const source = listFiles(kit)
    .filter((f) => /\.[cm]?[jt]sx?$/.test(f))
    .map((f) => readText(f) ?? '')
    .join('\n')
  const declares = (name) =>
    new RegExp(`export\\s+(?:default\\s+)?(?:declare\\s+)?(?:interface|type|function|const|class)\\s+${name}\\b`).test(source)
  return (
    declares('Step') &&
    declares('SceneProps') &&
    declares('Presentation') &&
    declares('Stage') &&
    declares('usePresentationNav') &&
    declares('useFitScale')
  )
}

/** Presentation index: a registry module at src/presentations/index.* mapping slugs to loaders. */
function findIndex(dir) {
  for (const candidate of INDEX_CANDIDATES) {
    const text = readText(join(dir, candidate))
    if (text === null) continue
    const exportsRegistry = /export\s+(?:const|let|var)\s+presentations\b|export\s*\{[^}]*\bpresentations\b/.test(text)
    const mapsRoutes = /\bslug\b/.test(text) && /\bimport\s*\(/.test(text)
    if (exportsRegistry || mapsRoutes) return candidate
  }
  return null
}

/**
 * Detects the three contract anchors inside `dir` (an app directory).
 * Presence is judged by contract, so naming, formatting and extra dependencies do not matter,
 * and an empty directory with the right name does not count.
 */
export function detectAnchors(dir) {
  const root = resolve(dir)
  const indexPath = findIndex(root)
  const present = {
    build: isDirectory(root) && hasBuildSetup(root),
    kit: isDirectory(root) && hasSceneKit(root),
    index: indexPath !== null,
  }
  const missing = ANCHORS.filter((a) => !present[a])
  return { dir: root, ...present, missing, indexPath: indexPath ?? INDEX_CANDIDATES[0] }
}

/** Monorepo signals at `dir`: package.json `workspaces`, pnpm-workspace.yaml, or packages/ | apps/. */
export function monorepoSignals(dir) {
  const signals = []
  const pkg = readJson(join(dir, 'package.json'))
  if (pkg && pkg.workspaces && (Array.isArray(pkg.workspaces) || typeof pkg.workspaces === 'object')) {
    signals.push('workspaces')
  }
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  if (isDirectory(join(dir, 'packages'))) signals.push('packages/')
  if (isDirectory(join(dir, 'apps'))) signals.push('apps/')
  return signals
}

function ancestors(start, stopAt) {
  const out = []
  const stop = stopAt ? resolve(stopAt) : null
  let current = resolve(start)
  for (;;) {
    out.push(current)
    if (stop && current === stop) break
    if (existsSync(join(current, '.git'))) break
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return out
}

function isEmptyDir(dir) {
  return !existsSync(dir) || (isDirectory(dir) && readdirSync(dir).length === 0)
}

function describe({ kind, appDir, startDir, projectNonEmpty, reason, signals = [] }) {
  const anchors = detectAnchors(appDir)
  const needsScaffold = anchors.missing.length > 0
  const action = !needsScaffold ? 'skip-scaffold' : anchors.missing.length === ANCHORS.length ? 'full-scaffold' : 'partial-scaffold'
  return {
    kind,
    appDir,
    relativeAppDir: relative(startDir, appDir) || '.',
    indexPath: join(appDir, anchors.indexPath),
    anchors: { build: anchors.build, kit: anchors.kit, index: anchors.index },
    missing: anchors.missing,
    action,
    // Only an empty target avoids confirmation; skipping scaffolding writes nothing to confirm.
    requiresConfirmation: needsScaffold && projectNonEmpty,
    signals,
    reason,
  }
}

/**
 * Resolves where the presentation app lives (or belongs) for a skill run started in `dir`.
 *
 *   empty dir                                   -> kind "empty": scaffold at dir, no confirmation
 *   inside/next to a presentation app           -> kind "existing-app": reuse it, scaffold only what is missing
 *   monorepo signals                            -> kind "monorepo": self-contained app in <root>/presentations
 *   otherwise                                   -> kind "standalone": scaffold at the project root
 *
 * `options.stopAt` bounds the upward search (tests); the search also stops at a `.git` directory.
 */
export function resolveTarget(dir, options = {}) {
  const startDir = resolve(dir)
  if (isEmptyDir(startDir)) {
    return describe({
      kind: 'empty',
      appDir: startDir,
      startDir,
      projectNonEmpty: false,
      reason: 'The directory is empty, so the app is scaffolded at its root without confirmation.',
    })
  }
  const chain = ancestors(startDir, options.stopAt)

  // An existing presentation app (any kit or index anchor) wins: at a directory, or at its presentations/ child.
  for (const d of chain) {
    for (const candidate of [d, join(d, 'presentations')]) {
      if (!isDirectory(candidate)) continue
      const found = detectAnchors(candidate)
      if (found.kit || found.index) {
        return describe({
          kind: 'existing-app',
          appDir: candidate,
          startDir,
          projectNonEmpty: true,
          reason: `A presentation app already exists at ${candidate}; reuse it and add only missing anchors.`,
        })
      }
    }
  }

  for (const d of chain) {
    const signals = monorepoSignals(d)
    if (signals.length > 0) {
      return describe({
        kind: 'monorepo',
        appDir: join(d, 'presentations'),
        startDir,
        projectNonEmpty: true,
        signals,
        reason: `Monorepo signals (${signals.join(', ')}) at ${d}; scaffold a self-contained app in presentations/ and leave the monorepo root untouched.`,
      })
    }
  }

  const projectRoot = chain.find((d) => existsSync(join(d, 'package.json'))) ?? startDir
  return describe({
    kind: 'standalone',
    appDir: projectRoot,
    startDir,
    projectNonEmpty: true,
    reason: `Standalone project; scaffold the presentation app at ${projectRoot}.`,
  })
}

/** Template files (relative to templates/bootstrap) that realise each anchor. */
export const ANCHOR_FILES = {
  build: [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'eslint.config.js',
    '.gitignore',
    'scripts',
  ],
  kit: ['src/presentation-kit'],
  index: [
    'src/presentations',
    'src/main.tsx',
    'src/Root.tsx',
    'src/route.ts',
    'src/Landing.tsx',
    'src/index.css',
  ],
}

/** Every template file (relative, posix separators) that realises the given missing anchors. */
export function scaffoldPlan(missing, templateDir = BOOTSTRAP_DIR) {
  const files = []
  for (const anchor of missing) {
    for (const entry of ANCHOR_FILES[anchor] ?? []) {
      const abs = join(templateDir, entry)
      if (isDirectory(abs)) files.push(...listFiles(abs))
      else if (existsSync(abs)) files.push(abs)
    }
  }
  return [...new Set(files)].map((f) => relative(templateDir, f).split(sep).join('/')).sort()
}

function mergeGitignore(existing, template) {
  const have = new Set(existing.split(/\r?\n/).map((l) => l.trim()))
  const add = template.split(/\r?\n/).filter((l) => l.trim() !== '' && !l.startsWith('#') && !have.has(l.trim()))
  if (add.length === 0) return existing
  return `${existing.replace(/\s*$/, '')}\n${add.join('\n')}\n`
}

/**
 * Applies the copy/merge scaffold procedure for the anchors that are missing in `appDir`.
 * Existing files are never overwritten. `package.json` (when present) only gains missing
 * scripts, dependencies and devDependencies; `.gitignore` only gains missing entries.
 * Returns what was written; the caller must run `npm install` afterwards when `needsInstall`.
 */
export function applyScaffold(appDir, { templateDir = BOOTSTRAP_DIR, missing, name } = {}) {
  const target = resolve(appDir)
  const toApply = missing ?? detectAnchors(target).missing
  const written = []
  const merged = []
  const hadPackageJson = existsSync(join(target, 'package.json'))
  mkdirSync(target, { recursive: true })

  for (const rel of scaffoldPlan(toApply, templateDir)) {
    const from = join(templateDir, rel)
    const to = join(target, rel)
    if (rel === 'package-lock.json' && hadPackageJson) continue // an existing project owns its lock data
    if (existsSync(to)) {
      if (rel === 'package.json') {
        const next = mergePackageJson(readJson(to), readJson(from))
        if (next.changed) {
          writeFileSync(to, `${JSON.stringify(next.pkg, null, 2)}\n`)
          merged.push(rel)
        }
      } else if (rel === '.gitignore') {
        const before = readText(to) ?? ''
        const after = mergeGitignore(before, readText(from) ?? '')
        if (after !== before) {
          writeFileSync(to, after)
          merged.push(rel)
        }
      }
      continue
    }
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(from, to)
    written.push(rel)
  }

  if (name && !hadPackageJson) {
    for (const file of ['package.json', 'package-lock.json']) {
      const json = readJson(join(target, file))
      if (!json) continue
      json.name = name
      if (json.packages?.['']) json.packages[''].name = name
      writeFileSync(join(target, file), `${JSON.stringify(json, null, 2)}\n`)
    }
  }
  return { appDir: target, written, merged, needsInstall: written.length > 0 || merged.includes('package.json') }
}

function mergePackageJson(existing, template) {
  const pkg = existing ?? {}
  let changed = false
  const all = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [dep, version] of Object.entries(template[section] ?? {})) {
      if (all[dep] !== undefined) continue
      pkg[section] = { ...pkg[section], [dep]: version }
      changed = true
    }
  }
  for (const [script, command] of Object.entries(template.scripts ?? {})) {
    if (pkg.scripts?.[script] !== undefined) continue
    pkg.scripts = { ...pkg.scripts, [script]: command }
    changed = true
  }
  if (pkg.type === undefined && template.type) {
    pkg.type = template.type
    changed = true
  }
  return { pkg, changed }
}

/** Turns a free-form name into a slug usable as a folder name and URL segment. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function main(argv) {
  const args = argv.filter((a) => !a.startsWith('--'))
  const dir = resolve(args[0] ?? process.cwd())
  const result = resolveTarget(dir)
  if (argv.includes('--apply')) {
    if (result.requiresConfirmation && !argv.includes('--confirmed')) {
      console.error('Target needs user confirmation first; re-run with --confirmed once the user agrees.')
      process.exit(2)
    }
    const name = basename(result.appDir) === 'presentations' ? undefined : slugify(basename(result.appDir)) || undefined
    console.log(JSON.stringify({ ...result, applied: applyScaffold(result.appDir, { missing: result.missing, name }) }, null, 2))
    return
  }
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
