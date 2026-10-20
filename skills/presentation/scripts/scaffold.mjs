// Scaffolding helper for the presentation skill. Templates are resolved from
// this file's own location, never from the caller's working directory.
//
//   node scaffold.mjs scaffold <project-dir> [--confirm] [--no-install]
//   node scaffold.mjs create   <app-dir> <slug> <title>
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

/** Contract-level anchor detection: by capability, not by byte-identical files. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const viteConfig = ['ts', 'js', 'mjs', 'mts', 'cjs'].some((e) => existsSync(path.join(dir, `vite.config.${e}`)))
  const build =
    Boolean(pkg?.scripts?.build) && viteConfig && ['vite', 'react', 'typescript'].every((d) => hasDep(pkg, d))
  const texts = sourceFiles(dir).map((f) => readFileSync(f, 'utf8'))
  const some = (re) => texts.some((t) => re.test(t))
  const kit =
    some(/export\s+(default\s+)?(function|const|class)\s+Presentation\b/) &&
    some(/export\s+(default\s+)?(function|const|class)\s+Stage\b/) &&
    some(/\b(interface|type)\s+Step\b/) &&
    some(/\b(interface|type)\s+SceneProps\b/)
  const index = texts.some((t) => /\bslug\s*:/.test(t) && /\bload\s*:/.test(t) && /\bimport\s*\(/.test(t))
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
  if (rel.startsWith('src/presentations/') || ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/routing.ts'].includes(rel)) {
    return 'index'
  }
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
    if (!missing.includes(anchorOf(rel)) || rel === 'package-lock.json') continue
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
const fill = (text, slug, title) => text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replaceAll('"', '\\"'))

/** Adds a presentation folder from the presentation template and one registry entry. */
export function createPresentation(appDir, { slug, title }) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits, and dashes`)
  const registryFile = path.join(appDir, 'src/presentations/index.ts')
  if (!existsSync(registryFile)) throw new Error('no presentation index at src/presentations/index.ts; scaffold first')
  const registry = readFileSync(registryFile, 'utf8')
  const folder = path.join(appDir, 'src/presentations', slug)
  if (existsSync(folder) || new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) {
    throw new Error(`presentation "${slug}" already exists`)
  }
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const close = registry.lastIndexOf(']')
  if (close === -1) throw new Error('cannot find the end of the registry array')
  const written = []
  for (const file of walk(PRESENTATION_TEMPLATE_DIR)) {
    const rel = toPosix(path.relative(PRESENTATION_TEMPLATE_DIR, file))
    const dest = path.join(folder, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, fill(readFileSync(file, 'utf8'), slug, title))
    written.push(`src/presentations/${slug}/${rel}`)
  }
  writeFileSync(registryFile, registry.slice(0, close) + entry + registry.slice(close))
  return { slug, written, registry: 'src/presentations/index.ts' }
}

/** Registered presentations in an app, for the modify flow's "which one?" question. */
export function listPresentations(appDir) {
  const file = path.join(appDir, 'src/presentations/index.ts')
  if (!existsSync(file)) return []
  const src = readFileSync(file, 'utf8')
  return [...src.matchAll(/slug:\s*['"]([^'"]+)['"]\s*,\s*title:\s*(['"`])(.*?)\2/gs)].map((m) => ({ slug: m[1], title: m[3] }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, dir, ...rest] = process.argv.slice(2)
  try {
    let out
    if (cmd === 'scaffold' && dir) {
      out = scaffold(path.resolve(dir), { confirmed: rest.includes('--confirm'), install: !rest.includes('--no-install') })
    } else if (cmd === 'create' && dir && rest[0] && rest[1]) {
      out = createPresentation(path.resolve(dir), { slug: rest[0], title: rest[1] })
    } else if (cmd === 'list' && dir) {
      out = listPresentations(path.resolve(dir))
    } else {
      throw new Error('usage: scaffold.mjs scaffold <dir> [--confirm] [--no-install] | create <app-dir> <slug> <title> | list <app-dir>')
    }
    console.log(JSON.stringify(out, null, 2))
  } catch (err) {
    console.error(`scaffold: ${err.message}`)
    process.exit(1)
  }
}
