// Detects the three scaffold anchors (build setup, scene kit, presentation index)
// and resolves where a presentation app belongs.
//
// usage: node detect.mjs [dir]   -> prints JSON
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exists = (...p) => fs.existsSync(path.join(...p))
const read = (f) => fs.readFileSync(f, 'utf8')
const readJson = (file) => {
  try {
    return JSON.parse(read(file))
  } catch {
    return undefined
  }
}
const SOURCE = /\.(tsx?|jsx?)$/
const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection'])

function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return SKIP.has(e.name) ? [] : sourceFiles(full)
    return SOURCE.test(e.name) ? [full] : []
  })
}

/** Resolves a relative import specifier to an existing source file, if any. */
function resolveImport(from, spec) {
  if (!spec.startsWith('.')) return undefined
  const base = path.resolve(path.dirname(from), spec)
  const candidates = [base, ...['.ts', '.tsx', '.js', '.jsx'].map((x) => base + x), ...['index.ts', 'index.tsx'].map((x) => path.join(base, x))]
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile())
}

const importsOf = (file) =>
  [...read(file).matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)].map((m) => resolveImport(file, m[1])).filter(Boolean)

/** Is `target` reachable from `entry` through relative imports? */
function reaches(entry, target) {
  const seen = new Set()
  const walk = (f) => {
    if (f === target) return true
    if (seen.has(f)) return false
    seen.add(f)
    return importsOf(f).some(walk)
  }
  return walk(entry)
}

function entryFile(dir) {
  const html = path.join(dir, 'index.html')
  const src = fs.existsSync(html) && read(html).match(/<script[^>]*\ssrc="([^"]+)"/)?.[1]
  const rel = src ? src.replace(/^\//, '') : 'src/main.tsx'
  return path.join(dir, rel)
}

const KIT_STAGE = /AnimatePresence/
const KIT_HOST = /export\s+(default\s+)?(function|const)\s+Presentation\b|export\s*\{[^}]*\bPresentation\b[^}]*\}/

/** Kit = a directory under src exporting a `Presentation` host next to a stage that mounts steps. */
function findKit(dir) {
  const files = sourceFiles(path.join(dir, 'src'))
  const host = files.find((f) => KIT_HOST.test(read(f)))
  if (!host) return undefined
  const root = path.dirname(host)
  return sourceFiles(root).some((f) => KIT_STAGE.test(read(f))) ? root : undefined
}

/** Registry = a source file listing `{ slug, ..., load: () => import(...) }` entries. */
function findRegistry(dir, kitDir) {
  return sourceFiles(path.join(dir, 'src')).find((f) => {
    if (kitDir && f.startsWith(kitDir + path.sep)) return false
    const t = read(f)
    return /\bslug\s*:/.test(t) && /\bload\s*:/.test(t) && /import\s*\(/.test(t)
  })
}

/** Contract-level anchor detection: file naming and formatting are free to differ. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /^vite\.config\./.test(f))
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && hasViteConfig)

  const kitDir = findKit(dir)
  const registry = findRegistry(dir, kitDir)
  const entry = entryFile(dir)
  // The registry only counts when the app's entry point actually routes to it.
  const index = Boolean(registry && fs.existsSync(entry) && reaches(entry, registry))
  return { build, kit: Boolean(kitDir), index }
}

/** Where the registry and the app's entry point are; used by the scaffold to wire routing. */
export const locate = (dir) => ({ entry: entryFile(dir), registry: findRegistry(dir, findKit(dir)) })

const isEmptyDir = (dir) => !fs.existsSync(dir) || fs.readdirSync(dir).filter((f) => f !== '.git').length === 0

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || exists(dir, 'pnpm-workspace.yaml') || exists(dir, 'packages') || exists(dir, 'apps')
}

const complete = (a) => a.build && a.kit && a.index
const some = (a) => a.build || a.kit || a.index

export function resolveTarget(dir) {
  const root = detectAnchors(dir)
  const nested = path.join(dir, 'presentations')
  const nestedAnchors = detectAnchors(nested)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  if (some(root) && !isMonorepo(dir)) reason = 'already inside a presentation app: use it'
  else if (complete(root)) reason = 'already inside a presentation app: use it'
  else if (some(nestedAnchors)) {
    target = nested
    reason = 'existing presentations/ app: use it'
  } else if (isMonorepo(dir)) {
    target = nested
    reason = 'monorepo: scaffold a self-contained app under presentations/'
  }
  const anchors = target === dir ? root : nestedAnchors
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  return {
    dir,
    target,
    reason,
    anchors,
    missing,
    empty: isEmptyDir(dir),
    // A non-empty project without the kit or index must have its target confirmed before writing.
    needsConfirmation: !isEmptyDir(dir) && (!anchors.kit || !anchors.index),
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(resolveTarget(path.resolve(process.argv[2] ?? process.cwd())), null, 2))
}
