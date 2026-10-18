// Usage: node detect.mjs <project-dir>
// Resolves where the presentation app lives and which contract anchors exist.
// Prints one JSON document. Read-only: it never writes to the project.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const isDir = (p) => existsSync(p) && statSync(p).isDirectory()

function listFiles(dir, depth = 3) {
  if (!isDir(dir) || depth < 0) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? (e.name === 'node_modules' ? [] : listFiles(full, depth - 1)) : [full]
  })
}

/** Any one of these makes a project a monorepo. */
export function monorepoSignals(dir) {
  const signals = []
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) signals.push('package.json workspaces')
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const d of ['packages', 'apps']) if (isDir(path.join(dir, d))) signals.push(`${d}/ directory`)
  return signals
}

/** Contract-level anchor detection: keyed on what exists, not on exact file names or bytes. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build) && ['vite', 'react', 'typescript'].every((d) => d in deps)
  const kitDir = listFiles(path.join(dir, 'src')).find((f) => /(^|[\\/])presentation-kit[\\/]Presentation\.(t|j)sx?$/.test(f))
  const kit = Boolean(kitDir) && listFiles(path.dirname(kitDir ?? ''), 1).some((f) => /Stage\.(t|j)sx?$/.test(f))
  const index = listFiles(path.join(dir, 'src', 'presentations'), 0).some((f) => /index\.(t|j)sx?$/.test(f))
  return { build, kit, index }
}

export function detect(projectDir) {
  const root = path.resolve(projectDir)
  const entries = existsSync(root) ? readdirSync(root).filter((n) => n !== '.git') : []
  const signals = monorepoSignals(root)
  const rootAnchors = detectAnchors(root)
  const insideApp = rootAnchors.build && rootAnchors.kit && rootAnchors.index
  // A monorepo root is never mutated, and its own build setup is not the app's build anchor.
  const useSubdir = signals.length > 0 && !insideApp
  const target = useSubdir ? path.join(root, 'presentations') : root
  const anchors = useSubdir ? detectAnchors(target) : rootAnchors
  const missing = Object.entries(anchors).filter(([, ok]) => !ok).map(([name]) => name)
  const nonEmpty = entries.length > 0
  return {
    projectDir: root,
    target,
    monorepo: signals.length > 0,
    signals,
    nonEmpty,
    anchors,
    missing,
    // Writing into a non-empty project requires stating the target and getting a yes first.
    needsConfirmation: nonEmpty && missing.length > 0,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2]
  if (!dir) {
    console.error('usage: node detect.mjs <project-dir>')
    process.exit(2)
  }
  console.log(JSON.stringify(detect(dir), null, 2))
}
