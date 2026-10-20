// Scaffolding helper for the presentation skill. Templates are resolved from
// this file's own location, never from the caller's working directory.
//
//   node scaffold.mjs scaffold <project-dir> [--confirm] [--no-install]
//   node scaffold.mjs create   <app-dir> <slug> <title>
//   node scaffold.mjs resolve  <project-dir>   (read-only)
//   node scaffold.mjs list     <app-dir>
//
// Output is JSON on stdout. `scaffold` writes nothing in a non-empty project
// that lacks the scene kit or presentation index until `--confirm` is given.
import { spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

function walk(dir, depth = 6) {
  const out = []
  if (depth < 0 || !existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, depth - 1))
    else out.push(full)
  }
  return out
}

const sourceFiles = (dir) => walk(path.join(dir, 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))

/** Any of: package.json `workspaces`, pnpm-workspace.yaml, or a packages/ or apps/ directory. */
export function isMonorepo(dir) {
  if (readJson(path.join(dir, 'package.json'))?.workspaces) return true
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true
  return ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
}

const hasDep = (pkg, name) => Boolean(pkg?.dependencies?.[name] ?? pkg?.devDependencies?.[name])

const isRegistry = (text) => /\bslug\s*:/.test(text) && /\bload\s*:/.test(text) && /\bimport\s*\(/.test(text)

/** The registry file, wherever the project keeps it. */
export function findRegistry(dir) {
  return sourceFiles(dir).find((f) => isRegistry(readFileSync(f, 'utf8')))
}

/** The kit's barrel file (index.ts/tsx beside the file that declares `Presentation`). */
export function findKitIndex(dir) {
  const decl = sourceFiles(dir).find((f) => /export\s+(default\s+)?(function|const|class)\s+Presentation\b/.test(readFileSync(f, 'utf8')))
  if (!decl) return undefined
  return ['index.ts', 'index.tsx'].map((n) => path.join(path.dirname(decl), n)).find((f) => existsSync(f))
}

/** Contract-level anchor detection: by capability, not by byte-identical files. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const viteConfig = ['ts', 'js', 'mjs', 'mts', 'cjs'].some((e) => existsSync(path.join(dir, `vite.config.${e}`)))
  const build =
    Boolean(pkg?.scripts?.build) && viteConfig && ['vite', 'react', 'typescript'].every((d) => hasDep(pkg, d))
  const texts = sourceFiles(dir).map((f) => readFileSync(f, 'utf8'))
  const some = (re) => texts.some((t) => re.test(t))
  const declares = (name) => new RegExp(`export\\s+(default\\s+)?(function|const|class)\\s+${name}\\b`)
  const kit =
    ['Presentation', 'Stage', 'usePresentationNav', 'useFitScale', 'Toc', 'Footer'].every((n) => some(declares(n))) &&
    some(/\b(interface|type)\s+Step\b/) &&
    some(/\b(interface|type)\s+SceneProps\b/)
  const index = texts.some(isRegistry)
  return { build, kit, index }
}

/** Where the presentation app lives for a given working project directory. */
export function resolveTarget(dir) {
  const anchors = detectAnchors(dir)
  if (anchors.kit || anchors.index) return { target: dir, reason: 'already inside a presentation app' }
  if (isMonorepo(dir)) return { target: path.join(dir, 'presentations'), reason: 'monorepo: self-contained app in presentations/' }
  return { target: dir, reason: 'standalone project: scaffold at the root' }
}

export const isEmptyProject = (dir) => !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0

/** Which anchor a bootstrap-relative file belongs to. */
export function anchorOf(rel) {
  if (rel.startsWith('src/presentation-kit/') || rel.startsWith('scripts/')) return 'kit'
  // Registry, sample, router and entry files: everything else under src/.
  if (rel.startsWith('src/')) return 'index'
  return 'build'
}

const toPosix = (p) => p.split(path.sep).join('/')
export const bootstrapFiles = () => walk(BOOTSTRAP_DIR).map((f) => toPosix(path.relative(BOOTSTRAP_DIR, f)))

/** Adds the template's missing dependencies and scripts; never changes existing entries. */
export function mergePackageJson(existing, template) {
  const merged = { ...existing }
  for (const key of ['dependencies', 'devDependencies', 'scripts']) {
    merged[key] = { ...template[key], ...existing[key] }
  }
  return merged
}

/** Plans (or, with write=true, performs) a scaffold; existing files are never overwritten. */
export function scaffoldTarget(target, { write = false } = {}) {
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((a) => !anchors[a])
  const created = []
  const skipped = []
  for (const rel of bootstrapFiles()) {
    if (rel === 'package-lock.json') continue
    // The manifest is merged whenever anything is added, so the new code finds its dependencies.
    // Verification scripts are copied whenever missing, since the merged manifest scripts point at them.
    if (rel !== 'package.json' && !rel.startsWith('scripts/') && !missing.includes(anchorOf(rel))) continue
    const dest = path.join(target, rel)
    if (rel === 'package.json') {
      if (!existsSync(dest)) {
        created.push(rel)
        if (write) {
          mkdirSync(target, { recursive: true })
          const pkg = readJson(path.join(BOOTSTRAP_DIR, rel))
          pkg.name = path.basename(path.resolve(target)).toLowerCase().replace(/[^a-z0-9-_]/g, '-') || pkg.name
          writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
          cpSync(path.join(BOOTSTRAP_DIR, 'package-lock.json'), path.join(target, 'package-lock.json'))
          created.push('package-lock.json')
        }
      } else {
        const existing = readJson(dest)
        const merged = mergePackageJson(existing, readJson(path.join(BOOTSTRAP_DIR, rel)))
        if (JSON.stringify(merged) !== JSON.stringify(existing)) {
          created.push(`${rel} (merged missing dependencies and scripts)`)
          if (write) writeFileSync(dest, JSON.stringify(merged, null, 2) + '\n')
        }
      }
      continue
    }
    if (existsSync(dest)) {
      skipped.push(rel)
      continue
    }
    created.push(rel)
    if (write) {
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(path.join(BOOTSTRAP_DIR, rel), dest)
    }
  }
  const wiring = skipped.filter((f) => ['src/main.tsx', 'src/Router.tsx'].includes(f) && missing.includes('index'))
  return { anchors, missing, created, skipped, needsRouteWiring: wiring.length > 0 }
}

/**
 * Resolves the target and scaffolds what is missing. In a non-empty project
 * that lacks the kit or index nothing is written until `confirmed` is true.
 */
export function scaffold(projectDir, { confirmed = false, install = true } = {}) {
  const { target, reason } = resolveTarget(projectDir)
  const plan = scaffoldTarget(target)
  const needsConfirmation = !isEmptyProject(projectDir) && (plan.missing.includes('kit') || plan.missing.includes('index'))
  if (plan.missing.length === 0) return { status: 'already-scaffolded', target, reason, ...plan }
  if (needsConfirmation && !confirmed) return { status: 'needs-confirmation', target, reason, ...plan }
  const result = scaffoldTarget(target, { write: true })
  let installed = false
  if (install) {
    const r = spawnSync('npm', ['install'], { cwd: target, stdio: 'inherit' })
    if (r.status !== 0) throw new Error('npm install failed in the scaffold target')
    installed = true
  }
  return { status: 'scaffolded', target, reason, installed, ...result }
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Index of the `]` that closes the array opened at `open`, skipping strings and comments. */
function closingBracket(src, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') i = src.indexOf('\n', i) === -1 ? src.length : src.indexOf('\n', i)
    else if (c === '/' && src[i + 1] === '*') i = src.indexOf('*/', i + 2) + 1
    else if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++
    } else if (c === '[') depth++
    else if (c === ']' && --depth === 0) return i
  }
  return -1
}

/** Appends an entry to the registry array literal, whatever follows its closing bracket. */
export function insertRegistryEntry(source, entry) {
  // The registry is the array literal assigned (`= [`) that holds the slug entries; other arrays are skipped.
  let close = -1
  let fallback = -1
  for (const m of source.matchAll(/=\s*\[/g)) {
    const open = m.index + m[0].length - 1
    const end = closingBracket(source, open)
    if (end === -1) continue
    if (/\bslug\s*:/.test(source.slice(open, end))) {
      close = end
      break
    }
    if (fallback === -1) fallback = end
  }
  if (close === -1) close = fallback
  if (close === -1) throw new Error('cannot find the registry array literal')
  const before = source.slice(0, close).trimEnd()
  const comma = before.endsWith(',') || before.endsWith('[') ? '' : ','
  return `${before}${comma}\n${entry}\n${source.slice(close)}`
}

const relImport = (fromDir, file) => {
  const rel = toPosix(path.relative(fromDir, file))
  return rel.startsWith('.') ? rel : `./${rel}`
}
const fill = (text, { slug, title, kit }) =>
  text
    .replaceAll('__SLUG__', slug)
    .replaceAll('__TITLE_JSON__', JSON.stringify(title))
    .replaceAll('__TITLE__', title.replaceAll('*/', '* /'))
    .replaceAll('__KIT__', kit)

/** Adds a presentation folder from the presentation template and one registry entry. */
export function createPresentation(appDir, { slug, title }) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits, and dashes`)
  const registryFile = findRegistry(appDir)
  if (!registryFile) throw new Error('no presentation index found; scaffold first')
  const kitIndex = findKitIndex(appDir)
  if (!kitIndex) throw new Error('no scene kit index (index.ts beside the Presentation component) found; scaffold first')
  const registry = readFileSync(registryFile, 'utf8')
  const folder = path.join(path.dirname(registryFile), slug)
  if (existsSync(folder) || new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) {
    throw new Error(`presentation "${slug}" already exists`)
  }
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },`
  const updated = insertRegistryEntry(registry, entry)
  const written = []
  for (const file of walk(PRESENTATION_TEMPLATE_DIR)) {
    const rel = toPosix(path.relative(PRESENTATION_TEMPLATE_DIR, file))
    const dest = path.join(folder, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    const kit = relImport(path.dirname(dest), kitIndex)
    writeFileSync(dest, fill(readFileSync(file, 'utf8'), { slug, title, kit }))
    written.push(toPosix(path.relative(appDir, dest)))
  }
  writeFileSync(registryFile, updated)
  return { slug, written, registry: toPosix(path.relative(appDir, registryFile)) }
}

/** Registered presentations in an app, for the modify flow's "which one?" question. */
export function listPresentations(appDir) {
  const file = findRegistry(appDir)
  if (!file) return []
  const src = readFileSync(file, 'utf8')
  return [...src.matchAll(/slug:\s*['"]([^'"]+)['"]\s*,\s*title:\s*(['"`])(.*?)\2/gs)].map((m) => ({ slug: m[1], title: m[3] }))
}

/** Read-only: where the app is (or would be), which anchors exist, and which presentations are registered. */
export function resolveProject(projectDir) {
  const { target, reason } = resolveTarget(projectDir)
  const anchors = detectAnchors(target)
  return {
    target,
    reason,
    anchors,
    missing: Object.keys(anchors).filter((a) => !anchors[a]),
    presentations: listPresentations(target),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, dir, ...rest] = process.argv.slice(2)
  try {
    let out
    if (cmd === 'scaffold' && dir) {
      out = scaffold(path.resolve(dir), { confirmed: rest.includes('--confirm'), install: !rest.includes('--no-install') })
    } else if (cmd === 'create' && dir && rest[0] && rest[1]) {
      out = createPresentation(path.resolve(dir), { slug: rest[0], title: rest[1] })
    } else if (cmd === 'resolve' && dir) {
      out = resolveProject(path.resolve(dir))
    } else if (cmd === 'list' && dir) {
      out = listPresentations(path.resolve(dir))
    } else {
      throw new Error('usage: scaffold.mjs scaffold <dir> [--confirm] [--no-install] | create <app-dir> <slug> <title> | list <app-dir> | resolve <project-dir>')
    }
    console.log(JSON.stringify(out, null, 2))
  } catch (err) {
    console.error(`scaffold: ${err.message}`)
    process.exit(1)
  }
}
