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
  const kitDir = path.join(dir, 'src', 'presentation-kit')
  const kit = hasFile(kitDir, /^types\.[jt]s$/) && hasFile(kitDir, /^Presentation\.[jt]sx?$/)
  const index = hasFile(path.join(dir, 'src', 'presentations'), /^index\.[jt]sx?$/)
  return { build, kit, index }
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
