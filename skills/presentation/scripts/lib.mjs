// Deterministic helpers behind the presentation skill: target detection, scaffolding, creation.
// Templates are always resolved relative to this file's skill directory, never the caller's cwd.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATES = path.join(SKILL_DIR, 'templates')
export const BOOTSTRAP = path.join(TEMPLATES, 'bootstrap')

const read = (p) => readFileSync(p, 'utf8')
const json = (p) => JSON.parse(read(p))
const listFiles = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? listFiles(p) : [p]
  })

/** The three contract anchors, detected by function rather than byte-identical files. */
export function detectAnchors(target) {
  let build = false
  const pkgPath = path.join(target, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = json(pkgPath)
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      build =
        Boolean(pkg.scripts?.build) &&
        ['vite', 'react', 'typescript'].every((d) => d in deps) &&
        readdirSync(target).some((n) => /^vite\.config\./.test(n)) &&
        existsSync(path.join(target, 'tsconfig.json'))
    } catch {
      build = false
    }
  }
  const find = (rel) => ['ts', 'tsx'].map((e) => path.join(target, `${rel}/index.${e}`)).find(existsSync)
  const kitIndex = find('src/presentation-kit')
  const kit = Boolean(kitIndex) && /\bPresentation\b/.test(read(kitIndex))
  const index = Boolean(find('src/presentations'))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true
  if (existsSync(path.join(dir, 'package.json'))) {
    try {
      if (json(path.join(dir, 'package.json')).workspaces) return true
    } catch {
      /* unreadable manifest: fall through to layout check */
    }
  }
  return ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
}

export function listPresentations(target) {
  const file = ['ts', 'tsx'].map((e) => path.join(target, `src/presentations/index.${e}`)).find(existsSync)
  if (!file) return []
  const src = read(file)
  return [...src.matchAll(/slug:\s*['"]([^'"]+)['"][^}]*?title:\s*(['"])(.*?)\2/gs)].map((m) => ({
    slug: m[1],
    title: m[3],
  }))
}

/** Where scaffolding belongs and what is missing there. The monorepo root is never a target. */
export function detect(dir) {
  dir = path.resolve(dir)
  const entries = existsSync(dir) ? readdirSync(dir).filter((n) => n !== '.git') : []
  const rootAnchors = detectAnchors(dir)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  if (rootAnchors.kit || rootAnchors.index) {
    reason = 'already a presentation app: reuse it'
  } else if (isMonorepo(dir)) {
    target = path.join(dir, 'presentations')
    reason = 'monorepo: scaffold a self-contained app under presentations/'
  }
  const anchors = target === dir ? rootAnchors : detectAnchors(target)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  return {
    dir,
    empty: entries.length === 0,
    monorepo: isMonorepo(dir),
    target,
    reason,
    anchors,
    missing,
    presentations: listPresentations(target),
    needsConfirmation: entries.length > 0 && missing.length > 0,
  }
}

const GROUPS = {
  kit: (files) => files.filter((f) => f.startsWith('src/presentation-kit/')),
  index: (files) =>
    files.filter((f) => /^src\/(main\.tsx|Landing\.tsx|route\.ts|presentations\/)/.test(f)),
  build: (files) => files.filter((f) => !GROUPS.kit(files).includes(f) && !GROUPS.index(files).includes(f)),
}

function mergePackageJson(dest, templatePkg) {
  const existing = json(dest)
  const added = []
  for (const key of ['scripts', 'dependencies', 'devDependencies']) {
    existing[key] ??= {}
    for (const [name, value] of Object.entries(templatePkg[key] ?? {})) {
      if (!(name in existing[key])) {
        existing[key][name] = value
        added.push(`${key}.${name}`)
      }
    }
  }
  writeFileSync(dest, `${JSON.stringify(existing, null, 2)}\n`)
  return added
}

/** Copy the bootstrap groups named in `only` into `target`. Existing files are never overwritten. */
export function scaffold(target, only, { install = false } = {}) {
  target = path.resolve(target)
  const files = listFiles(BOOTSTRAP).map((f) => path.relative(BOOTSTRAP, f).split(path.sep).join('/'))
  const result = { target, created: [], skipped: [], merged: [] }
  for (const group of only) {
    if (!GROUPS[group]) throw new Error(`unknown anchor "${group}" (expected build, kit, or index)`)
    for (const rel of GROUPS[group](files)) {
      if (rel === 'package-lock.json' && existsSync(path.join(target, 'package.json'))) continue
      const dest = path.join(target, rel)
      if (existsSync(dest)) {
        if (rel === 'package.json') {
          const added = mergePackageJson(dest, json(path.join(BOOTSTRAP, rel)))
          if (added.length) result.merged.push(`package.json (+${added.join(', ')})`)
          else result.skipped.push(rel)
        } else result.skipped.push(rel)
        continue
      }
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(path.join(BOOTSTRAP, rel), dest)
      result.created.push(rel)
    }
  }
  if (install) execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], { cwd: target, stdio: 'inherit' })
  return result
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Write a self-contained presentation folder from templates/presentation and register it. */
export function createPresentation(target, slug, title) {
  target = path.resolve(target)
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  if (!title || /["\\{}`$]/.test(title)) throw new Error('title is required and must not contain quotes, backslashes, braces, backticks or $')
  const registry = ['ts', 'tsx'].map((e) => path.join(target, `src/presentations/index.${e}`)).find(existsSync)
  if (!registry) throw new Error(`no presentation index under ${target}/src/presentations: scaffold first`)
  const dest = path.join(target, 'src/presentations', slug)
  if (existsSync(dest)) throw new Error(`presentation "${slug}" already exists`)
  const src = read(registry)
  const close = src.lastIndexOf('\n]')
  if (close < 0 || src.includes(`slug: '${slug}'`)) throw new Error('could not register: add the registry entry by hand')
  const tplDir = path.join(TEMPLATES, 'presentation')
  const created = []
  for (const file of listFiles(tplDir)) {
    const rel = path.relative(tplDir, file)
    const out = path.join(dest, rel)
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(out, read(file).replaceAll('{{slug}}', slug).replaceAll('{{title}}', title))
    created.push(path.join('src/presentations', slug, rel))
  }
  const entry = `  {\n    slug: '${slug}',\n    title: '${title.replaceAll("'", "\\'")}',\n    load: () => import('./${slug}/Talk'),\n  },`
  writeFileSync(registry, `${src.slice(0, close + 1)}${entry}\n${src.slice(close + 1)}`)
  return { target, slug, route: `/${slug}`, created, registry: path.relative(target, registry) }
}
