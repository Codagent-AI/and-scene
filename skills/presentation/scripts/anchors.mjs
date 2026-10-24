// Contract-level detection of the three scaffold anchors and scaffold-target resolution.
import fs from 'node:fs'
import path from 'node:path'

export const ANCHORS = ['build', 'kit', 'index']

const exists = (...parts) => fs.existsSync(path.join(...parts))
const hasFile = (dir, pattern) =>
  fs.existsSync(dir) && fs.readdirSync(dir, { withFileTypes: true }).some((e) => e.isFile() && pattern.test(e.name))

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const SOURCE = /\.[cm]?[jt]sx?$/
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '__tests__'])

function sourceFiles(dir, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : sourceFiles(path.join(dir, e.name), depth + 1)
    return SOURCE.test(e.name) && !/\.(test|spec)\./.test(e.name) ? [path.join(dir, e.name)] : []
  })
}

// Contract markers, independent of file naming: the host, the step/scene contract, the registry.
const HOST = /export\s+(default\s+)?(async\s+)?(function|const|class)\s+Presentation\b|export\s*\{[^}]*\bPresentation\b/
const STEP_CONTRACT = /\b(interface|type)\s+Step\b/
const SCENE_CONTRACT = /\b(interface|type)\s+Scene(Props)?\b/
const isRegistry = (text) => /\bexport\b/.test(text) && /\bslug\b/.test(text) && /\bload\b/.test(text)

/**
 * The registry module: a top-level source file of `src/presentations/` (any name) that exports a
 * slug -> loader list, preferring `index.*`. Registries elsewhere in the project, such as a blog's
 * routes, are not a presentation index. Registration edits this same file.
 */
export function findRegistry(dir) {
  const presentations = path.join(dir, 'src', 'presentations')
  if (!fs.existsSync(presentations)) return null
  const files = fs
    .readdirSync(presentations, { withFileTypes: true })
    .filter((e) => e.isFile() && SOURCE.test(e.name) && !/\.(test|spec)\./.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(/^index\./.test(b)) - Number(/^index\./.test(a)) || a.localeCompare(b))
  const found = files.find((name) => isRegistry(fs.readFileSync(path.join(presentations, name), 'utf8')))
  return found ? path.join(presentations, found) : null
}

/** Kit: a Presentation host plus the Step/Scene contract, anywhere under `src/presentation-kit/`. */
function detectKit(dir) {
  const texts = sourceFiles(path.join(dir, 'src', 'presentation-kit')).map((f) => fs.readFileSync(f, 'utf8'))
  const some = (test) => texts.some((t) => test.test(t))
  return some(HOST) && some(STEP_CONTRACT) && some(SCENE_CONTRACT)
}

export function isEmptyDir(dir) {
  return !fs.existsSync(dir) || fs.readdirSync(dir).filter((n) => n !== '.git').length === 0
}

/** Which anchors a directory provides, judged by presence rather than byte-identical files. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    Boolean(pkg?.scripts?.build) &&
    ['vite', 'react', 'typescript'].every((d) => d in deps) &&
    hasFile(dir, /^vite\.config\.[cm]?[jt]s$/) &&
    exists(dir, 'tsconfig.json')
  return { build, kit: detectKit(dir), index: findRegistry(dir) !== null }
}

export function missingAnchors(dir) {
  const found = detectAnchors(dir)
  return ANCHORS.filter((a) => !found[a])
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return (
    Boolean(pkg?.workspaces) ||
    exists(dir, 'pnpm-workspace.yaml') ||
    exists(dir, 'packages') ||
    exists(dir, 'apps')
  )
}

/**
 * Where the presentation app belongs:
 * - already inside a presentation app (kit or index present) -> here;
 * - an existing `presentations/` app -> that app;
 * - a monorepo -> a self-contained app in `presentations/`;
 * - otherwise (empty or standalone project) -> the project root.
 */
export function resolveTarget(cwd) {
  const here = detectAnchors(cwd)
  if (here.kit || here.index) return { target: cwd, reason: 'inside an existing presentation app' }
  const nested = path.join(cwd, 'presentations')
  const inNested = detectAnchors(nested)
  if (inNested.kit || inNested.index) return { target: nested, reason: 'existing presentations/ app' }
  if (isMonorepo(cwd)) return { target: nested, reason: 'monorepo: self-contained app in presentations/' }
  return { target: cwd, reason: isEmptyDir(cwd) ? 'empty directory' : 'standalone project root' }
}

/** Resolution plus the anchors still to scaffold, and whether writing needs user confirmation. */
export function planScaffold(cwd) {
  const { target, reason } = resolveTarget(cwd)
  const missing = missingAnchors(target)
  return {
    target,
    reason,
    anchors: detectAnchors(target),
    missing,
    needsConfirmation: missing.length > 0 && !isEmptyDir(cwd),
  }
}
