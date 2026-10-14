// Deterministic helpers for the presentation skill. Pure Node, no dependencies.
//   node scaffold-lib.mjs detect [dir]    -> JSON: monorepo signals, anchors, resolved target, templates dir
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Templates live next to SKILL.md, never relative to the caller's working directory. */
export function templatesDir(name = 'bootstrap') {
  return path.join(SKILL_DIR, 'templates', name)
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

function walk(dir, depth = 4) {
  if (depth < 0 || !fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p, depth - 1)
    return [p]
  })
}

/** Monorepo signals: `workspaces` in package.json, pnpm-workspace.yaml, or a packages/|apps/ layout. */
export function detectMonorepo(dir) {
  const signals = []
  if (readJson(path.join(dir, 'package.json'))?.workspaces) signals.push('workspaces')
  if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const d of ['packages', 'apps']) {
    if (fs.existsSync(path.join(dir, d)) && fs.statSync(path.join(dir, d)).isDirectory()) signals.push(`${d}/`)
  }
  return { isMonorepo: signals.length > 0, signals }
}

/** Contract-level anchor detection (presence of the contract, not byte-identity). */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasVite = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].some((f) => fs.existsSync(path.join(dir, f)))
  const buildSetup = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && hasVite)

  const files = walk(path.join(dir, 'src'))
  const text = (f) => fs.readFileSync(f, 'utf8')
  const sourceFiles = files.filter((f) => /\.(ts|tsx)$/.test(f))
  const sceneKit =
    sourceFiles.some((f) => /export\s+(function|const)\s+Presentation\b/.test(text(f))) &&
    sourceFiles.some((f) => /data-presentation-root/.test(text(f)))
  const presentationIndex = sourceFiles.some(
    (f) => /(^|\/)presentations\/index\.tsx?$/.test(f.split(path.sep).join('/')) && /\bslug\b/.test(text(f)) && /\bload\b/.test(text(f)),
  )
  return { buildSetup, sceneKit, presentationIndex }
}

const isApp = (a) => a.buildSetup && a.sceneKit && a.presentationIndex

/** Find an enclosing presentation app (all three anchors) at `dir`, an ancestor, or below `presentations/`. */
export function resolveTarget(dir) {
  const anchors = detectAnchors(dir)
  const { isMonorepo, signals } = detectMonorepo(dir)
  const empty = !fs.existsSync(dir) || fs.readdirSync(dir).filter((f) => f !== '.git').length === 0
  if (isApp(anchors)) {
    return { target: dir, kind: 'existing-app', anchors, isMonorepo, signals, needsConfirmation: false }
  }
  // Already inside an app: walk up, stopping at the repository root (or the filesystem root).
  for (let up = dir; !fs.existsSync(path.join(up, '.git')) && path.dirname(up) !== up; ) {
    up = path.dirname(up)
    const upAnchors = detectAnchors(up)
    if (isApp(upAnchors)) {
      const m = detectMonorepo(up)
      return { target: up, kind: 'existing-app', anchors: upAnchors, isMonorepo: m.isMonorepo, signals: m.signals, needsConfirmation: false }
    }
  }
  const nested = path.join(dir, 'presentations')
  if (isMonorepo && fs.existsSync(nested)) {
    const nestedAnchors = detectAnchors(nested)
    if (isApp(nestedAnchors)) {
      return { target: nested, kind: 'existing-app', anchors: nestedAnchors, isMonorepo, signals, needsConfirmation: false }
    }
  }
  const target = isMonorepo ? nested : dir
  const anchorsAtTarget = isMonorepo ? detectAnchors(nested) : anchors
  return {
    target,
    kind: isMonorepo ? 'monorepo-app' : 'root',
    anchors: anchorsAtTarget,
    isMonorepo,
    signals,
    // Empty dirs scaffold freely; a non-empty project missing the kit or index needs the user's confirmation.
    needsConfirmation: !empty && !(anchorsAtTarget.sceneKit && anchorsAtTarget.presentationIndex),
  }
}

/** Merge template dependencies into an existing package.json object without downgrading or overwriting. */
export function mergeDependencies(existing, template) {
  const out = { ...existing }
  const added = []
  for (const field of ['dependencies', 'devDependencies']) {
    const have = { ...out.dependencies, ...out.devDependencies }
    const merged = { ...out[field] }
    for (const [name, range] of Object.entries(template[field] ?? {})) {
      if (name in have) continue
      merged[name] = range
      added.push(name)
    }
    if (Object.keys(merged).length) out[field] = merged
  }
  const scripts = { ...out.scripts }
  for (const [name, cmd] of Object.entries(template.scripts ?? {})) {
    if (!(name in scripts)) scripts[name] = cmd
  }
  if (Object.keys(scripts).length) out.scripts = scripts
  return { pkg: out, added }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, dir = process.cwd()] = process.argv.slice(2)
  if (cmd !== 'detect') {
    console.error('usage: node scaffold-lib.mjs detect [dir]')
    process.exit(2)
  }
  console.log(JSON.stringify({ ...resolveTarget(path.resolve(dir)), templates: templatesDir() }, null, 2))
}
