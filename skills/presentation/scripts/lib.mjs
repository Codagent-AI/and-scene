// Shared helpers for the presentation skill's scaffolding scripts. Node
// standard library only, so they run in any project before dependencies exist.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Templates resolve from the skill directory, never from the caller's cwd.
export const SKILL_DIR = path.resolve(import.meta.dirname, '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const exists = (p) => fs.existsSync(p)
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

function walk(dir) {
  if (!exists(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

function hasFile(dir, pattern) {
  return exists(dir) && fs.readdirSync(dir).some((f) => pattern.test(f))
}

// ---------------------------------------------------------------- detection

/** Contract-level anchor detection for an app directory. */
export function detectAnchors(appDir) {
  const pkgPath = path.join(appDir, 'package.json')
  let build = false
  if (exists(pkgPath)) {
    try {
      const pkg = readJson(pkgPath)
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      build =
        typeof pkg.scripts?.build === 'string' &&
        ['react', 'vite', 'typescript'].every((d) => d in deps) &&
        hasFile(appDir, /^vite\.config\./) &&
        exists(path.join(appDir, 'index.html'))
    } catch {
      build = false
    }
  }

  const kitDir = path.join(appDir, 'src', 'presentation-kit')
  const kitSources = walk(kitDir)
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n')
  const kit =
    /export\s+(function|const|class)\s+Presentation\b/.test(kitSources) &&
    /export\s+(interface|type)\s+Step\b/.test(kitSources)

  const presentationsDir = path.join(appDir, 'src', 'presentations')
  const indexFile = ['index.ts', 'index.tsx', 'index.js', 'index.jsx']
    .map((f) => path.join(presentationsDir, f))
    .find(exists)
  const index = Boolean(indexFile) && /\bPRESENTATIONS\b|\bslug\b/.test(fs.readFileSync(indexFile, 'utf8'))

  return { build, kit, index }
}

export function isEmptyDir(dir) {
  return !exists(dir) || fs.readdirSync(dir).filter((f) => f !== '.git').length === 0
}

export function detectMonorepo(dir) {
  const pkgPath = path.join(dir, 'package.json')
  if (exists(pkgPath)) {
    try {
      if (readJson(pkgPath).workspaces) return true
    } catch {
      // unreadable package.json is not a workspace signal
    }
  }
  return (
    exists(path.join(dir, 'pnpm-workspace.yaml')) ||
    exists(path.join(dir, 'packages')) ||
    exists(path.join(dir, 'apps'))
  )
}

/**
 * Decides where the presentation app lives and what is missing.
 * `forceTarget` is 'root' or 'presentations' to override the heuristic.
 */
export function detect(dir, forceTarget) {
  const projectDir = path.resolve(dir)
  const empty = isEmptyDir(projectDir)
  const monorepo = detectMonorepo(projectDir)
  const candidates = [
    ['root', projectDir],
    ['presentations', path.join(projectDir, 'presentations')],
  ]

  let target = forceTarget
  if (!target) {
    // An existing presentation app (kit or index present) wins over heuristics.
    const existing = candidates.find(([, d]) => {
      const a = detectAnchors(d)
      return a.kit || a.index
    })
    target = existing ? existing[0] : monorepo ? 'presentations' : 'root'
  }
  const appDir = target === 'root' ? projectDir : path.join(projectDir, 'presentations')
  const anchors = detectAnchors(appDir)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])

  return {
    projectDir,
    empty,
    monorepo,
    target,
    appDir,
    anchors,
    missing,
    // Writing into a non-empty project needs the user's go-ahead first.
    needsConfirmation: !empty && missing.length > 0,
  }
}

// --------------------------------------------------------------- scaffolding

function copyIfAbsent(from, to, report) {
  if (exists(to)) {
    report.skipped.push(to)
    return
  }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  report.created.push(to)
}

function copyTree(fromDir, toDir, report) {
  for (const f of walk(fromDir)) copyIfAbsent(f, path.join(toDir, path.relative(fromDir, f)), report)
}

function mergePackageJson(appDir, report) {
  const template = readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const dest = path.join(appDir, 'package.json')
  if (!exists(dest)) {
    template.name = path.basename(appDir).toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'presentations'
    fs.mkdirSync(appDir, { recursive: true })
    fs.writeFileSync(dest, `${JSON.stringify(template, null, 2)}\n`)
    report.created.push(dest)
    const lock = path.join(BOOTSTRAP_DIR, 'package-lock.json')
    if (exists(lock)) {
      const lockData = readJson(lock)
      lockData.name = template.name
      if (lockData.packages?.['']) lockData.packages[''].name = template.name
      fs.writeFileSync(path.join(appDir, 'package-lock.json'), `${JSON.stringify(lockData, null, 2)}\n`)
      report.created.push(path.join(appDir, 'package-lock.json'))
    }
    return
  }
  const pkg = readJson(dest)
  const added = []
  for (const section of ['dependencies', 'devDependencies']) {
    pkg[section] ??= {}
    for (const [name, range] of Object.entries(template[section])) {
      if (name in pkg.dependencies || name in pkg.devDependencies) continue
      pkg[section][name] = range
      added.push(name)
    }
  }
  pkg.scripts ??= {}
  for (const [name, cmd] of Object.entries(template.scripts)) {
    if (!(name in pkg.scripts)) {
      pkg.scripts[name] = cmd
      added.push(`script:${name}`)
    }
  }
  if (added.length) {
    fs.writeFileSync(dest, `${JSON.stringify(pkg, null, 2)}\n`)
    report.merged.push(...added)
  }
}

function appendMissingLines(from, to, report) {
  const want = fs.readFileSync(from, 'utf8').split('\n').filter(Boolean)
  if (!exists(to)) {
    copyIfAbsent(from, to, report)
    return
  }
  const have = new Set(fs.readFileSync(to, 'utf8').split('\n'))
  const missing = want.filter((l) => !have.has(l))
  if (missing.length) {
    const cur = fs.readFileSync(to, 'utf8')
    fs.writeFileSync(to, `${cur.endsWith('\n') ? cur : `${cur}\n`}${missing.join('\n')}\n`)
    report.merged.push('.gitignore')
  }
}

function scaffoldBuild(appDir, report) {
  const t = (...p) => path.join(BOOTSTRAP_DIR, ...p)
  const d = (...p) => path.join(appDir, ...p)
  copyIfAbsent(t('index.html'), d('index.html'), report)
  if (!hasFile(appDir, /^vite\.config\./)) copyIfAbsent(t('vite.config.ts'), d('vite.config.ts'), report)
  for (const f of ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) copyIfAbsent(t(f), d(f), report)
  if (!hasFile(appDir, /^eslint\.config\./)) copyIfAbsent(t('eslint.config.js'), d('eslint.config.js'), report)
  appendMissingLines(t('.gitignore'), d('.gitignore'), report)
  copyIfAbsent(t('public', 'favicon.svg'), d('public', 'favicon.svg'), report)
  copyIfAbsent(t('src', 'index.css'), d('src', 'index.css'), report)
  copyTree(t('scripts'), d('scripts'), report)
}

const rel = (...p) => path.join(...p)

function scaffoldKit(appDir, report) {
  const from = rel(BOOTSTRAP_DIR, 'src', 'presentation-kit')
  copyTree(from, rel(appDir, 'src', 'presentation-kit'), report)
}

function scaffoldIndex(appDir, report, withStarter) {
  for (const f of ['index.ts']) {
    copyIfAbsent(rel(BOOTSTRAP_DIR, 'src', 'presentations', f), rel(appDir, 'src', 'presentations', f), report)
  }
  for (const f of ['Landing.tsx', 'main.tsx']) {
    copyIfAbsent(rel(BOOTSTRAP_DIR, 'src', f), rel(appDir, 'src', f), report)
  }
  if (withStarter) {
    const slug = 'getting-started'
    if (!exists(rel(appDir, 'src', 'presentations', slug))) {
      createPresentation(appDir, slug, 'Getting Started', report)
    }
  }
}

/**
 * Scaffolds whatever anchors are missing in `appDir`, never overwriting
 * existing files. Returns a report of what was created, merged and skipped.
 */
export function scaffold(appDir, { install = true, starter = true } = {}) {
  const report = { created: [], merged: [], skipped: [], installed: false, notes: [] }
  const anchors = detectAnchors(appDir)
  // Every anchor depends on the full dependency set, so always ensure it.
  if (!(anchors.build && anchors.kit && anchors.index)) mergePackageJson(appDir, report)
  if (!anchors.build) scaffoldBuild(appDir, report)
  if (!anchors.kit) scaffoldKit(appDir, report)
  if (!anchors.index) {
    const hadMain = exists(rel(appDir, 'src', 'main.tsx'))
    scaffoldIndex(appDir, report, starter)
    if (hadMain) {
      report.notes.push(
        'src/main.tsx already exists and was kept: route each presentation slug to its registry entry (see src/main.tsx in the bootstrap template).',
      )
    }
  }
  const changed = report.created.length > 0 || report.merged.length > 0
  if (changed && install) {
    const res = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: appDir, stdio: 'inherit' })
    if (res.status !== 0) throw new Error(`npm install failed in ${appDir}`)
    report.installed = true
  }
  return report
}

// ------------------------------------------------------------- presentations

const tsString = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function render(text, file, { slug, title }) {
  let safeTitle = title
  if (file.endsWith('.tsx')) safeTitle = title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/[{}<>]/g, (c) => `&#${c.charCodeAt(0)};`)
  if (file.endsWith('.css')) safeTitle = title.replace(/\*\//g, '* /')
  return text.replaceAll('__SLUG__', slug).replaceAll('__CLASS__', `p-${slug}`).replaceAll('__TITLE__', safeTitle)
}

/** Adds a registry entry for `slug` to the presentations index source. */
export function registerInSource(source, slug, title) {
  const start = source.indexOf('PRESENTATIONS')
  const close = start < 0 ? -1 : source.indexOf('\n]', start)
  if (close < 0) throw new Error('could not find the PRESENTATIONS array in src/presentations/index.ts')
  const entry = `  {\n    slug: ${tsString(slug)},\n    title: ${tsString(title)},\n    load: () => import('./${slug}/Talk'),\n  },`
  return `${source.slice(0, close + 1)}${entry}\n${source.slice(close + 1)}`
}

/**
 * Creates a presentation folder from the presentation template and registers
 * it. Existing presentations are never touched.
 */
export function createPresentation(appDir, slug, title, report = { created: [], merged: [], skipped: [] }) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and hyphens`)
  const dest = path.join(appDir, 'src', 'presentations', slug)
  if (exists(dest)) throw new Error(`presentation "${slug}" already exists at ${dest}`)
  const indexFile = path.join(appDir, 'src', 'presentations', 'index.ts')
  if (!exists(indexFile)) throw new Error(`no presentation index at ${indexFile}; scaffold first`)
  if (new RegExp(`\\bslug:\\s*['"\`]${slug}['"\`]`).test(fs.readFileSync(indexFile, 'utf8'))) {
    throw new Error(`presentation "${slug}" is already registered`)
  }

  for (const f of walk(PRESENTATION_TEMPLATE_DIR)) {
    const out = path.join(dest, path.relative(PRESENTATION_TEMPLATE_DIR, f))
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, render(fs.readFileSync(f, 'utf8'), f, { slug, title }))
    report.created.push(out)
  }
  fs.writeFileSync(indexFile, registerInSource(fs.readFileSync(indexFile, 'utf8'), slug, title))
  report.merged.push(indexFile)
  return report
}
