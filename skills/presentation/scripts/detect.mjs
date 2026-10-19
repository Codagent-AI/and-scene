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

const SOURCE = /\.(t|j)sx?$/

function sourceFiles(dir) {
  return listFiles(path.join(dir, 'src'), 5).filter((f) => SOURCE.test(f))
}

/** Matches `export function|const|class Name` and `export { Name }` / `export default Name`. */
function exportsName(text, name) {
  return (
    new RegExp(`export\\s+(default\\s+)?(async\\s+)?(function|const|class)\\s+${name}\\b`).test(text) ||
    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(text) ||
    new RegExp(`export\\s+default\\s+${name}\\b`).test(text)
  )
}

/**
 * Contract-level anchor detection: keyed on what the code does, not on file names, folders, or bytes.
 * - build: package.json with a build script and vite, react, and typescript dependencies.
 * - kit: source exporting a `Presentation` host, plus the stage that mounts the active step with
 *   morph presence (`AnimatePresence`/`LayoutGroup`) and the step contract (`Step`/`SceneProps`).
 * - index: source holding the registry, an array of entries with a `slug` and a lazy `import()` loader.
 */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build) && ['vite', 'react', 'typescript'].every((d) => d in deps)
  const texts = sourceFiles(dir).map((f) => readFileSync(f, 'utf8'))
  const kit =
    texts.some((t) => exportsName(t, 'Presentation')) &&
    texts.some((t) => /AnimatePresence/.test(t) && /LayoutGroup/.test(t)) &&
    texts.some((t) => /\b(SceneProps|Step)\b/.test(t) && /\bScene\b/.test(t) && /\bcaption\b/.test(t))
  const index = texts.some((t) => /\bslug\s*:/.test(t) && /\bload\s*:/.test(t) && /import\s*\(/.test(t) && /export/.test(t))
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
