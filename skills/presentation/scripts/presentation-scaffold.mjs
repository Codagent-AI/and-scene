#!/usr/bin/env node
// Deterministic helpers behind the presentation skill: detect the scaffold
// anchors, resolve the target, scaffold what is missing, and add presentations.
//   node presentation-scaffold.mjs detect <dir>
//   node presentation-scaffold.mjs scaffold <dir> [--yes] [--no-install] [--no-browser]
//   node presentation-scaffold.mjs add <target> --slug <slug> --title <title>
// Templates are resolved relative to this skill's own directory (the one that holds SKILL.md).
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates/bootstrap')
export const PRESENTATION_DIR = path.join(SKILL_DIR, 'templates/presentation')

/** Which bootstrap files make up each anchor. */
const KIT_PREFIX = 'src/presentation-kit/'
const INDEX_FILES = new Set([
  'src/presentations/index.ts',
  'src/main.tsx',
  'src/router.tsx',
  'src/routes.ts',
  'src/Landing.tsx',
  'src/index.css',
])

export function anchorOf(relativeFile) {
  if (relativeFile.startsWith(KIT_PREFIX)) return 'kit'
  if (INDEX_FILES.has(relativeFile)) return 'index'
  return 'build'
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort()
}

function allDeps(pkg) {
  return { ...pkg?.dependencies, ...pkg?.devDependencies }
}

/** Contract-level anchor detection for one app directory. */
export function detectAnchors(dir) {
  const pkgFile = path.join(dir, 'package.json')
  let build = false
  if (existsSync(pkgFile)) {
    try {
      const pkg = readJson(pkgFile)
      const deps = allDeps(pkg)
      build = Boolean(pkg.scripts?.build) && ['vite', 'react', 'typescript'].every((d) => d in deps)
    } catch {
      build = false
    }
  }
  // Kit and index count only when they export something: an empty or comment-only file is no contract.
  const exportsSomething = (file) => existsSync(file) && /^\s*export\s/m.test(readFileSync(file, 'utf8'))
  const find = (folder, pattern) =>
    existsSync(folder) ? readdirSync(folder).filter((name) => pattern.test(name)).map((name) => path.join(folder, name)) : []
  const kitDir = path.join(dir, 'src/presentation-kit')
  const kit =
    find(kitDir, /^Presentation\.[jt]sx?$/).some(exportsSomething) &&
    find(kitDir, /^types\.[jt]s$/).some(exportsSomething)
  const index = find(path.join(dir, 'src/presentations'), /^index\.tsx?$/).some(exportsSomething)
  return { build, kit, index }
}

export function isMonorepo(dir) {
  const pkgFile = path.join(dir, 'package.json')
  if (existsSync(pkgFile)) {
    try {
      if (readJson(pkgFile).workspaces) return true
    } catch {
      /* unreadable manifest: fall through to the other signals */
    }
  }
  return ['pnpm-workspace.yaml', 'packages', 'apps'].some((name) => existsSync(path.join(dir, name)))
}

function isProjectEmpty(dir) {
  return !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0
}

/**
 * Where the presentation app belongs and what it is missing.
 * - Already inside a presentation app (scene kit or index at the root) -> use it.
 * - Monorepo -> a self-contained app in `presentations/`.
 * - Otherwise the project root.
 */
export function detect(dir) {
  const root = path.resolve(dir)
  const rootAnchors = detectAnchors(root)
  const monorepo = isMonorepo(root)
  const nested = path.join(root, 'presentations')
  const nestedApp = existsSync(nested) && Object.values(detectAnchors(nested)).some(Boolean)
  const insideApp = rootAnchors.kit || rootAnchors.index
  const target = !insideApp && (nestedApp || monorepo) ? nested : root
  const anchors = target === root ? rootAnchors : detectAnchors(nested)
  const missing = Object.keys(anchors).filter((name) => !anchors[name])
  const projectEmpty = isProjectEmpty(root)
  return {
    root,
    target,
    monorepo,
    projectEmpty,
    anchors,
    missing,
    // A non-empty project that lacks the kit or the index is confirmed with the user before writing.
    needsConfirmation: !projectEmpty && (missing.includes('kit') || missing.includes('index')),
  }
}

/** Adds missing dependencies and scripts without touching what the project already has. */
export function mergePackageJson(existing, template) {
  const merged = { ...existing }
  const added = []
  for (const field of ['dependencies', 'devDependencies']) {
    const have = allDeps(existing)
    for (const [name, version] of Object.entries(template[field] ?? {})) {
      if (name in have) continue
      merged[field] = { ...merged[field], [name]: version }
      added.push(name)
    }
  }
  for (const [name, command] of Object.entries(template.scripts ?? {})) {
    if (existing.scripts?.[name]) continue
    merged.scripts = { ...merged.scripts, [name]: command }
  }
  return { merged, added }
}

const ROUTED_ENTRY = `import { presentations } from './presentations'
import { resolveRoute } from './routes'

// Presentation routes get the router; every other path keeps the host app's original entry.
if (resolveRoute(window.location.pathname, presentations)) {
  const [{ StrictMode }, { createRoot }, { Router }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./router'),
  ])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router pathname={window.location.pathname} registry={presentations} />
    </StrictMode>,
  )
} else {
  await import('./app-main')
}
`

/**
 * An existing app entry keeps mounting the host app, so presentation routes would never render.
 * Move it to `app-main.tsx` and put a routed entry in its place. Returns whether it rewired.
 */
function wireEntry(target, existing) {
  const moved = path.join(target, 'src/app-main.tsx')
  if (/presentations/.test(existing) || existsSync(moved)) return false
  writeFileSync(moved, existing)
  writeFileSync(path.join(target, 'src/main.tsx'), ROUTED_ENTRY)
  return true
}

/** Writes the files of the missing anchors; existing files are never overwritten. */
export function scaffold(dir, { install = true, browser = true } = {}) {
  const info = detect(dir)
  const { target } = info
  mkdirSync(target, { recursive: true })
  const written = []
  const entryFile = path.join(target, 'src/main.tsx')
  const existingEntry = existsSync(entryFile) ? readFileSync(entryFile, 'utf8') : null
  const templatePkg = readJson(path.join(BOOTSTRAP_DIR, 'package.json'))

  for (const file of listFiles(BOOTSTRAP_DIR)) {
    // The verification scripts back the npm commands added below, so they are ensured on every run.
    if (!file.startsWith('scripts/') && !info.missing.includes(anchorOf(file))) continue
    const dest = path.join(target, file)
    if (existsSync(dest)) continue
    if (file === 'package-lock.json' && existsSync(path.join(target, 'package.json'))) continue
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(path.join(BOOTSTRAP_DIR, file), dest)
    written.push(file)
  }

  const entryWired = info.missing.includes('index') && existingEntry !== null && wireEntry(target, existingEntry)

  // The dependency set is never assumed: add whatever the manifest lacks.
  let addedDeps = []
  const pkgFile = path.join(target, 'package.json')
  if (existsSync(pkgFile)) {
    const { merged, added } = mergePackageJson(readJson(pkgFile), templatePkg)
    if (added.length > 0 || JSON.stringify(merged) !== JSON.stringify(readJson(pkgFile))) {
      writeFileSync(pkgFile, JSON.stringify(merged, null, 2) + '\n')
    }
    addedDeps = added
  }

  let installed = false
  const needsInstall = written.includes('package.json') || addedDeps.length > 0 || !existsSync(path.join(target, 'node_modules'))
  if (install && needsInstall) {
    const command = existsSync(path.join(target, 'package-lock.json')) && addedDeps.length === 0 ? 'ci' : 'install'
    const result = spawnSync('npm', [command], { cwd: target, stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`npm ${command} failed in ${target}`)
    installed = true
  }
  // Render verification needs a Chromium build; a fresh checkout has none cached.
  let browserInstalled = false
  if (install && browser) {
    browserInstalled = spawnSync('npx', ['playwright', 'install', 'chromium'], { cwd: target, stdio: 'inherit' }).status === 0
  }
  return { ...info, written, addedDeps, installed, browserInstalled, entryWired }
}

/** CSS-class / id prefix derived from a slug. */
export function nameFromSlug(slug) {
  return slug.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
}

/** Placeholders: `__TITLE_JSON__` is a JS string literal, `__TITLE__` is comment-safe plain text. */
function fill(text, values) {
  return text
    .replaceAll('__SLUG__', values.slug)
    .replaceAll('__TITLE_JSON__', JSON.stringify(values.title))
    .replaceAll('__TITLE__', values.title.replaceAll('*/', '* /'))
    .replaceAll('__NAME__', values.name)
}

/** Creates `src/presentations/<slug>/` from the template and registers it. */
export function addPresentation(target, { slug, title }) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by "-"`)
  const registryFile = ['index.ts', 'index.tsx']
    .map((name) => path.join(target, 'src/presentations', name))
    .find((file) => existsSync(file)) ?? path.join(target, 'src/presentations/index.ts')
  if (!existsSync(registryFile)) throw new Error(`no presentation index at ${registryFile}; scaffold first`)
  const folder = path.join(target, 'src/presentations', slug)
  if (existsSync(folder)) throw new Error(`presentation "${slug}" already exists`)
  const registry = readFileSync(registryFile, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) throw new Error(`slug "${slug}" is already registered`)

  const values = { slug, title, name: nameFromSlug(slug) }
  for (const file of listFiles(PRESENTATION_DIR)) {
    const dest = path.join(folder, file)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, fill(readFileSync(path.join(PRESENTATION_DIR, file), 'utf8'), values))
  }

  const close = registry.lastIndexOf(']')
  const entry = `  {\n    slug: ${JSON.stringify(slug)},\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk'),\n  },\n`
  writeFileSync(registryFile, registry.slice(0, close) + entry + registry.slice(close))
  return { folder, registryFile }
}

function main(argv) {
  const [command, dir, ...rest] = argv
  const option = (name) => {
    const at = rest.indexOf(name)
    return at === -1 ? undefined : rest[at + 1]
  }
  if (command === 'detect' && dir) {
    console.log(JSON.stringify(detect(dir), null, 2))
  } else if (command === 'scaffold' && dir) {
    const info = detect(dir)
    if (info.missing.length === 0) {
      console.log(JSON.stringify({ ...info, written: [], skipped: 'all anchors present' }, null, 2))
    } else if (info.needsConfirmation && !rest.includes('--yes')) {
      console.error(
        `CONFIRM: the project is not empty. Scaffolding ${info.missing.join(', ')} into ${info.target}. Ask the user, then rerun with --yes.`,
      )
      process.exit(2)
    } else {
      console.log(JSON.stringify(scaffold(dir, { install: !rest.includes('--no-install'), browser: !rest.includes('--no-browser') }), null, 2))
    }
  } else if (command === 'add' && dir) {
    const slug = option('--slug')
    const title = option('--title')
    if (!slug || !title) throw new Error('add needs --slug and --title')
    console.log(JSON.stringify(addPresentation(path.resolve(dir), { slug, title }), null, 2))
  } else {
    console.error('usage: presentation-scaffold.mjs detect|scaffold|add <dir> [options]')
    process.exit(64)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(`error: ${error.message}`)
    process.exit(1)
  }
}
