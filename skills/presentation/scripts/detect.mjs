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

const readdirSyncSafe = (dir) => {
  try {
    return readdirSync(dir)
  } catch {
    return []
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
  // A packages/ or apps/ folder only counts when it holds workspace packages of its own.
  for (const d of ['packages', 'apps']) {
    const folder = path.join(dir, d)
    const holdsPackages = isDir(folder) && readdirSync(folder).some((n) => existsSync(path.join(folder, n, 'package.json')))
    if (holdsPackages) signals.push(`${d}/ directory`)
  }
  return signals
}

const SOURCE = /\.(t|j)sx?$/

/** Index of the quote that closes the string opened at `start`, or -1 when it never closes. */
function closingQuote(text, start) {
  const quote = text[start]
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]
    if (c === '\\') i++
    else if (c === quote) return i
    // Only template literals may span lines.
    else if (c === '\n' && quote !== '`') return -1
  }
  return -1
}

/** Whether a `/` after this text starts a regular expression literal rather than a division. */
function regexAllowed(before) {
  const t = before.trimEnd()
  return t === '' || /[(,=:[!&|?{};]$/.test(t) || t.endsWith('=>') || /\b(return|typeof|case|in|of|void|delete|throw|yield|await)$/.test(t)
}

/** Index of the last character of the regex literal (flags included) opened at `start`, or -1. */
function closingRegex(text, start) {
  let inClass = false
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]
    if (c === '\\') i++
    else if (c === '\n') return -1
    else if (c === '[') inClass = true
    else if (c === ']') inClass = false
    else if (c === '/' && !inClass) {
      let end = i
      while (/[a-z]/i.test(text[end + 1] ?? '')) end++
      return end
    }
  }
  return -1
}

/**
 * Source with comments removed and string, template, and regex-literal contents emptied, so
 * commented-out examples and quoted or pattern-matched snippets are never mistaken for the code
 * that makes an anchor.
 */
export function stripNonCode(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const c = text[i]
    const next = text[i + 1]
    if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
      out += ' '
    } else if (c === '/' && regexAllowed(out) && closingRegex(text, i) !== -1) {
      out += '/ /'
      i = closingRegex(text, i) + 1
    } else if (c === "'" || c === '"' || c === '`') {
      const end = closingQuote(text, i)
      if (end === -1) {
        // Not a string (an apostrophe in JSX text, a quote inside a regex literal): keep it as plain code.
        out += c
        i++
      } else {
        out += c + c
        i = end + 1
      }
    } else {
      out += c
      i++
    }
  }
  return out
}

/** `vite.config.ts`, `vite.config.mjs`, `vite.web.config.ts`, `vite.config.app.ts`, and similar. */
const VITE_CONFIG = /^vite(\.[\w-]+)*\.config(\.[\w-]+)*\.(m|c)?(t|j)s$/

const RUNNER_WORDS = new Set(['npx', 'bunx', 'pnpm', 'yarn', 'bun', 'npm', 'exec', 'dlx', 'cross-env', 'env', 'run'])

/** True when any command in a shell line runs vite, after env assignments, flags, and runner words. */
function callsVite(line) {
  return line.split(/&&|\|\||[;|]/).some((command) => {
    const tokens = command.trim().split(/\s+/).filter(Boolean)
    for (const token of tokens) {
      if (/^[\w.-]+=/.test(token) || token.startsWith('-') || RUNNER_WORDS.has(token)) continue
      return token.split(/[\\/]/).pop() === 'vite'
    }
    return false
  })
}

/** True when every command in the script is a no-op or an immediate exit, so it can build nothing. */
function isNoopScript(text) {
  const commands = text.split(/&&|\|\||[;|]/).map((c) => c.trim()).filter(Boolean)
  return commands.every((c) => /^(echo|exit|true|false|:)(\s|$)/.test(c))
}

/** True when the script calls the vite command itself, following one level of `npm run <script>`. */
function scriptRunsVite(scripts, name, followed = false) {
  const text = scripts?.[name]
  if (typeof text !== 'string') return false
  if (callsVite(text)) return true
  if (followed) return false
  const next = [...text.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?([\w:.-]+)/g)].map((m) => m[1])
  return next.some((n) => n !== name && scriptRunsVite(scripts, n, true))
}

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
 * - build: package.json with a build script that runs the vite command (directly or through one
 *   level of `npm run <script>`) or sits beside a vite config file and is not a no-op (`exit 1`, `echo`),
 *   plus vite, react, and typescript dependencies. Detection is static and read-only; that the build
 *   really passes is proven by the verify step, which runs `npm run build`.
 * - kit: source exporting a `Presentation` host, plus the stage that mounts the active step with
 *   morph presence (`AnimatePresence`/`LayoutGroup`) and the step contract (`Step`/`SceneProps`).
 * - index: source holding the registry, an array of entries with a `slug` and a lazy `import()` loader.
 */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const buildScript = pkg?.scripts?.build
  const hasConfig = readdirSyncSafe(dir).some((n) => VITE_CONFIG.test(n))
  // A vite config beside a wrapper script counts, but not beside a script that builds nothing.
  const runsVite = scriptRunsVite(pkg?.scripts, 'build') || (hasConfig && typeof buildScript === 'string' && !isNoopScript(buildScript))
  const build = Boolean(pkg?.scripts?.build) && runsVite && ['vite', 'react', 'typescript'].every((d) => d in deps)
  const texts = sourceFiles(dir).map((f) => stripNonCode(readFileSync(f, 'utf8')))
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
