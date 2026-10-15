// Deterministic helpers shared by detect-anchors.mjs and scaffold.mjs.
// All template paths resolve from this file's location (the skill directory), never from cwd.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATES_DIR = path.join(SKILL_DIR, 'templates')
export const BOOTSTRAP_DIR = path.join(TEMPLATES_DIR, 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(TEMPLATES_DIR, 'presentation')

const IGNORED = new Set(['.git', 'node_modules', 'dist', '.inspect'])

function readJson(file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return undefined
    throw err
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`invalid JSON in ${file}: ${err.message}`)
  }
}

/** True when `dir` has no entries other than VCS metadata. */
export function isEmptyProject(dir) {
  if (!existsSync(dir)) return true
  return readdirSync(dir).every((n) => IGNORED.has(n) || n === '.DS_Store')
}

function hasDir(dir, ...parts) {
  const p = path.join(dir, ...parts)
  return existsSync(p) && statSync(p).isDirectory()
}

/** Monorepo signals: package.json `workspaces`, pnpm-workspace.yaml, or a packages/ | apps/ layout. */
export function detectMonorepo(dir) {
  const signals = []
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg && pkg.workspaces) signals.push('workspaces')
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace')
  if (hasDir(dir, 'packages') || hasDir(dir, 'apps')) signals.push('packages-or-apps')
  return { monorepo: signals.length > 0, signals }
}

function hasBuildSetup(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (!pkg?.scripts?.build) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  return Boolean(deps.vite && deps.react && deps.typescript)
}

// Scene kit anchor: the Step/Scene contract plus stage/host (Presentation) and fit-scale canvas.
function hasSceneKit(dir) {
  const kit = path.join(dir, 'src', 'presentation-kit')
  if (!hasDir(kit)) return false
  const index = ['index.ts', 'index.tsx'].map((f) => path.join(kit, f)).find(existsSync)
  if (!index) return false
  const src = readFileSync(index, 'utf8')
  return /Presentation\b/.test(src) && /\bStep\b|types/.test(src)
}

// Presentation index anchor: a registry module that maps slugs to routes.
function hasPresentationIndex(dir) {
  const dirPath = path.join(dir, 'src', 'presentations')
  const file = ['index.ts', 'index.tsx'].map((f) => path.join(dirPath, f)).find(existsSync)
  if (!file) return false
  return /\bslug\b/.test(readFileSync(file, 'utf8')) || /presentations\s*(:|=)/.test(readFileSync(file, 'utf8'))
}

/** Contract-level anchor detection for a presentation app rooted at `dir`. */
export function detectAnchors(dir) {
  const anchors = {
    buildSetup: hasBuildSetup(dir),
    sceneKit: hasSceneKit(dir),
    presentationIndex: hasPresentationIndex(dir),
  }
  const missing = Object.entries(anchors).filter(([, v]) => !v).map(([k]) => k)
  return { anchors, missing, complete: missing.length === 0, none: missing.length === 3 }
}

/**
 * Resolve where the presentation app lives.
 *  - an app with all/some anchors already at `dir` (or a presentations/ app below it) is used as-is
 *  - monorepo → `<dir>/presentations`
 *  - empty or standalone → `dir`
 */
export function resolveTarget(dir) {
  dir = path.resolve(dir)
  const here = detectAnchors(dir)
  const mono = detectMonorepo(dir)
  // A complete app here, or a partial one that is not a monorepo root, is used in place.
  if (here.complete || (!here.none && !mono.monorepo)) {
    return { target: dir, reason: 'existing-app', ...here, ...mono, empty: false, needsConfirmation: !here.complete }
  }
  if (mono.monorepo && !here.complete) {
    const nested = path.join(dir, 'presentations')
    const inner = detectAnchors(nested)
    const empty = isEmptyProject(nested)
    return { target: nested, reason: inner.none ? 'monorepo' : 'existing-app', ...inner, ...mono, empty, needsConfirmation: !inner.complete }
  }
  const empty = isEmptyProject(dir)
  return { target: dir, reason: empty ? 'empty' : 'standalone', ...here, ...mono, empty, needsConfirmation: !empty }
}

function copyMissing(srcRoot, destRoot, rels, report) {
  for (const rel of rels) {
    const src = path.join(srcRoot, rel)
    const dest = path.join(destRoot, rel)
    if (!existsSync(src)) continue
    if (existsSync(dest)) { report.skipped.push(rel); continue }
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest, { recursive: true })
    report.copied.push(rel)
  }
}

const BUILD_FILES = ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'src/main.tsx', 'src/Landing.tsx', 'src/RouteBoundary.tsx', 'src/routes.ts', 'src/index.css']
const KIT = ['src/presentation-kit']
const INDEX_FILES = ['src/presentations/index.ts']
const SCRIPTS = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/verify.config.json']

/**
 * Copy only the missing anchors from templates/bootstrap into `target`. Existing files are never
 * overwritten. Returns what was copied/skipped; `needsInstall` is true when dependencies must be installed.
 */
export function scaffold(target, { bootstrapDir = BOOTSTRAP_DIR } = {}) {
  target = path.resolve(target)
  mkdirSync(target, { recursive: true })
  const before = detectAnchors(target)
  const report = { target, copied: [], skipped: [], missing: before.missing, needsInstall: false }
  if (before.complete) return report
  if (!before.anchors.buildSetup) {
    copyMissing(bootstrapDir, target, [...BUILD_FILES, 'package-lock.json', ...SCRIPTS], report)
    const pkg = path.join(target, 'package.json')
    if (!existsSync(pkg)) copyMissing(bootstrapDir, target, ['package.json'], report)
    else report.mergeDependencies = true // existing package.json: agent merges the dependency set (see SKILL.md)
    report.needsInstall = true
  } else {
    copyMissing(bootstrapDir, target, [...SCRIPTS, 'src/main.tsx', 'src/Landing.tsx', 'src/RouteBoundary.tsx', 'src/routes.ts'], report)
  }
  if (!before.anchors.sceneKit) { copyMissing(bootstrapDir, target, KIT, report); report.needsInstall = true }
  if (!before.anchors.presentationIndex) {
    copyMissing(bootstrapDir, target, [...INDEX_FILES, 'src/presentations/starter'], report)
  }
  return report
}

/** Dependency names (and ranges) the scaffold requires, read from the bootstrap package.json. */
export function requiredDependencies(bootstrapDir = BOOTSTRAP_DIR) {
  const pkg = readJson(path.join(bootstrapDir, 'package.json'))
  return { dependencies: pkg.dependencies, devDependencies: pkg.devDependencies, scripts: pkg.scripts }
}
