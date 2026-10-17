// Deterministic helpers for the presentation skill. Templates are resolved relative to this
// file (the skill directory), never the caller's working directory.
//
//   node presentation-tool.mjs detect [dir]                       report target and anchors as JSON
//   node presentation-tool.mjs bootstrap <targetDir> [--no-install]  scaffold missing anchors
//   node presentation-tool.mjs new <appDir> <slug> "<Title>"      create and register a presentation
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

/** Files each contract anchor owns in the bootstrap template. */
const ANCHOR_FILES = {
  build: ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore', '.npmrc', 'public'],
  kit: ['src/presentation-kit', 'scripts'],
  index: ['src/presentations', 'src/main.tsx', 'src/Landing.tsx', 'src/router.ts', 'src/index.css'],
}

const read = (file) => readFileSync(file, 'utf8')
const listFiles = (dir) => (existsSync(dir) ? readdirSync(dir, { recursive: true }).map(String) : [])

function packageJson(dir) {
  try {
    return JSON.parse(read(path.join(dir, 'package.json')))
  } catch {
    return null
  }
}

/** Anchors are detected by contract, not by byte-identical scaffold files. */
export function detectAnchors(appDir) {
  const pkg = packageJson(appDir)
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = listFiles(appDir).some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f) && !f.includes(path.sep))
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && hasViteConfig)
  const kitDir = path.join(appDir, 'src', 'presentation-kit')
  const kit = listFiles(kitDir).some(
    (f) => /\.tsx?$/.test(f) && /export\s+(default\s+)?(function|const)\s+Presentation\b|export\s*\{[^}]*\bPresentation\b/.test(read(path.join(kitDir, f))),
  )
  const index = ['index.ts', 'index.tsx', 'index.js'].some((f) => existsSync(path.join(appDir, 'src', 'presentations', f)))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  const pkg = packageJson(dir)
  return Boolean(pkg?.workspaces) || existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
    ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
}

/** Decide where the presentation app lives and what is missing there. */
export function detect(dir) {
  const root = path.resolve(dir)
  const entries = existsSync(root) ? readdirSync(root).filter((e) => e !== '.git') : []
  const empty = entries.length === 0
  const rootAnchors = detectAnchors(root)
  const monorepo = isMonorepo(root)

  let target = root
  let kind = 'standalone'
  if (rootAnchors.kit || rootAnchors.index) {
    kind = 'existing-app'
  } else if (monorepo) {
    target = path.join(root, 'presentations')
    kind = 'monorepo'
  } else if (empty) {
    kind = 'empty'
  }
  const anchors = target === root ? rootAnchors : detectAnchors(target)
  const missing = Object.keys(anchors).filter((a) => !anchors[a])
  return {
    root,
    target,
    kind,
    monorepo,
    empty,
    anchors,
    missing,
    // Writing into a non-empty project needs the user's go-ahead after the target is stated.
    needsConfirmation: missing.length > 0 && !empty,
  }
}

function mergePackageJson(targetFile, templateFile) {
  const current = JSON.parse(read(targetFile))
  const template = JSON.parse(read(templateFile))
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    current[field] = { ...template[field], ...current[field] }
  }
  if (!current.type) current.type = template.type
  writeFileSync(targetFile, JSON.stringify(current, null, 2) + '\n')
}

function copyMissing(src, dest) {
  if (statSync(src).isDirectory()) {
    mkdirSync(dest, { recursive: true })
    for (const name of readdirSync(src)) copyMissing(path.join(src, name), path.join(dest, name))
  } else if (!existsSync(dest)) {
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest)
  }
}

/** Scaffold the missing anchors into `target` without overwriting any existing file. */
export function bootstrap(target, { anchors, install = true } = {}) {
  const dest = path.resolve(target)
  const missing = anchors ?? Object.keys(detectAnchors(dest)).filter((a) => !detectAnchors(dest)[a])
  mkdirSync(dest, { recursive: true })
  for (const anchor of missing) {
    for (const rel of ANCHOR_FILES[anchor]) {
      const src = path.join(BOOTSTRAP_DIR, rel)
      if (!existsSync(src)) continue
      if (rel === 'package.json' && existsSync(path.join(dest, rel))) mergePackageJson(path.join(dest, rel), src)
      else copyMissing(src, path.join(dest, rel))
    }
  }
  // The registry and kit need the build setup's dependencies, even when only they were missing.
  if (missing.length && existsSync(path.join(dest, 'package.json'))) mergePackageJson(path.join(dest, 'package.json'), path.join(BOOTSTRAP_DIR, 'package.json'))
  if (missing.length && install) {
    const result = spawnSync('npm', ['install'], { cwd: dest, stdio: 'inherit' })
    if (result.status !== 0) throw new Error('npm install failed')
  }
  return missing
}

const fill = (text, vars) => text.replace(/__(SLUG|TITLE)__/g, (_, k) => vars[k])

/** Create `src/presentations/<slug>/` from the presentation templates and register it. */
export function newPresentation(appDir, slug, title) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`invalid slug "${slug}" (use lowercase kebab-case)`)
  const app = path.resolve(appDir)
  const registryFile = path.join(app, 'src', 'presentations', 'index.ts')
  const folder = path.join(app, 'src', 'presentations', slug)
  if (!existsSync(registryFile)) throw new Error('presentation index (src/presentations/index.ts) is missing; bootstrap first')
  if (existsSync(folder)) throw new Error(`presentation "${slug}" already exists`)
  const registry = read(registryFile)
  if (registry.includes(`slug: '${slug}'`)) throw new Error(`slug "${slug}" is already registered`)

  const safeTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  for (const rel of listFiles(PRESENTATION_TEMPLATE_DIR)) {
    const src = path.join(PRESENTATION_TEMPLATE_DIR, rel)
    if (statSync(src).isDirectory()) continue
    const out = path.join(folder, rel.replace(/\.tmpl$/, ''))
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(out, fill(read(src), { SLUG: slug, TITLE: safeTitle }))
  }

  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const close = registry.lastIndexOf(']')
  if (close < 0) throw new Error('could not find the end of the registry array')
  const before = registry.slice(0, close).replace(/[ \t]*$/, '')
  writeFileSync(registryFile, `${before}${before.endsWith('\n') ? '' : '\n'}${entry}${registry.slice(close)}`)
  return { folder, route: `/${slug}` }
}

function main(argv) {
  const [command, ...rest] = argv
  const flags = rest.filter((a) => a.startsWith('--'))
  const args = rest.filter((a) => !a.startsWith('--'))
  if (command === 'detect') {
    console.log(JSON.stringify(detect(args[0] ?? process.cwd()), null, 2))
  } else if (command === 'bootstrap') {
    const done = bootstrap(args[0], { install: !flags.includes('--no-install') })
    console.log(JSON.stringify({ scaffolded: done }))
  } else if (command === 'new') {
    console.log(JSON.stringify(newPresentation(args[0], args[1], args[2] ?? args[1])))
  } else {
    console.error('usage: presentation-tool.mjs detect|bootstrap|new …')
    process.exit(2)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
