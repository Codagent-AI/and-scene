#!/usr/bin/env node
// Helper for the presentation skill: detect scaffold anchors, resolve the scaffold target,
// scaffold only what is missing, and create + register a new presentation.
//
//   node presentation-tool.mjs detect [projectDir]
//   node presentation-tool.mjs scaffold <targetDir> [--only build,kit,index] [--install]
//   node presentation-tool.mjs new <targetDir> <slug> --title "Title"
//
// Templates are resolved relative to this file (the skill directory), never the cwd.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')
export const ANCHORS = ['build', 'kit', 'index']

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.inspection'])

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listFiles(full, base))
    else out.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return out.sort()
}

const readIfExists = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')

/** Contract-level detection of the three anchors in an app directory. */
export function detectAnchors(appDir) {
  const pkgText = readIfExists(path.join(appDir, 'package.json'))
  let pkg = {}
  try {
    pkg = pkgText ? JSON.parse(pkgText) : {}
  } catch {
    /* unreadable package.json counts as no build setup */
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const files = listFiles(appDir)
  const build =
    Boolean(pkg.scripts?.build) &&
    ['react', 'react-dom', 'vite', 'typescript'].every((d) => d in deps) &&
    files.some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f)) &&
    files.some((f) => /^tsconfig[\w.-]*\.json$/.test(f))

  const source = files.filter((f) => /^src\/.*\.(tsx?|jsx?)$/.test(f)).slice(0, 400)
  const text = source.map((f) => readFileSync(path.join(appDir, f), 'utf8')).join('\n')
  // A contract name counts only where it is defined, not where it is merely re-defined.
  const defined = (name) => new RegExp(`(?:function|const|class|interface|type)\\s+${name}\\b`).test(text)
  const kit =
    ['Presentation', 'Stage', 'Step', 'SceneProps'].every(defined) &&
    /(?:function|const)\s+use\w*Nav\w*/.test(text) &&
    /(?:function|const)\s+(?:use\w*Fit\w*|\w*[fF]itScale\w*)/.test(text) &&
    defined('Toc')

  const registry = source.some((f) => /(^|\/)presentations\/index\.[jt]sx?$/.test(f) && /\bslug\b/.test(readFileSync(path.join(appDir, f), 'utf8')) && /\bload\b/.test(readFileSync(path.join(appDir, f), 'utf8')))
  const router = /location\.pathname|createBrowserRouter|<Routes?\b/.test(text)
  return { build, kit, index: registry && router }
}

const isEmptyProject = (dir) => !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0

function monorepoSignal(dir) {
  try {
    if (JSON.parse(readIfExists(path.join(dir, 'package.json')) || '{}').workspaces) return 'package.json "workspaces"'
  } catch {
    /* ignore */
  }
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return 'pnpm-workspace.yaml'
  for (const name of ['packages', 'apps']) {
    if (existsSync(path.join(dir, name)) && statSync(path.join(dir, name)).isDirectory()) return `${name}/ directory`
  }
  return null
}

/** Decide where a presentation app lives for the project at `projectDir`. */
export function resolveTarget(projectDir) {
  const project = path.resolve(projectDir)
  const rootAnchors = detectAnchors(project)
  const nested = path.join(project, 'presentations')
  const nestedAnchors = detectAnchors(nested)
  const signal = monorepoSignal(project)
  let target = project
  let reason = 'standalone project: scaffold at the project root'
  if (ANCHORS.every((a) => rootAnchors[a])) {
    reason = 'the project root is already a presentation app'
  } else if (ANCHORS.some((a) => nestedAnchors[a])) {
    target = nested
    reason = 'an existing presentation app lives in presentations/'
  } else if (signal) {
    target = nested
    reason = `monorepo detected (${signal}): scaffold a self-contained app in presentations/`
  } else if (ANCHORS.some((a) => rootAnchors[a])) {
    reason = 'standalone project with a partial scaffold: complete it at the project root'
  } else if (isEmptyProject(project)) {
    reason = 'empty directory: scaffold at the project root'
  }
  const anchors = target === project ? rootAnchors : nestedAnchors
  const missing = ANCHORS.filter((a) => !anchors[a])
  return {
    project,
    target,
    reason,
    monorepoSignal: signal,
    empty: isEmptyProject(project),
    anchors,
    missing,
    needsConfirmation: !isEmptyProject(project) && missing.length > 0,
  }
}

const GROUPS = {
  build: (files) =>
    files.filter((f) => ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore'].includes(f) || f.startsWith('scripts/')),
  kit: (files) => files.filter((f) => f.startsWith('src/presentation-kit/')),
  index: (files) => files.filter((f) => f.startsWith('src/') && !f.startsWith('src/presentation-kit/')).concat(files.filter((f) => f === 'verify.config.json')),
}

function mergePackageJson(targetFile, templateFile, result) {
  const template = JSON.parse(readFileSync(templateFile, 'utf8'))
  const current = JSON.parse(readFileSync(targetFile, 'utf8'))
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    for (const [name, value] of Object.entries(template[section] ?? {})) {
      current[section] ??= {}
      if (!(name in current[section])) {
        current[section][name] = value
        changed = true
      }
    }
  }
  if (current.type === undefined && template.type) {
    current.type = template.type
    changed = true
  }
  if (changed) {
    writeFileSync(targetFile, `${JSON.stringify(current, null, 2)}\n`)
    result.merged.push('package.json')
  }
}

/** Copy the template files of the given anchors into `target`; existing files are never overwritten. */
export function scaffold(target, anchors = ANCHORS) {
  const result = { target: path.resolve(target), created: [], skipped: [], merged: [] }
  const files = listFiles(BOOTSTRAP_DIR)
  mkdirSync(result.target, { recursive: true })
  // A lockfile only matches the template manifest, so it is copied only with a brand-new manifest.
  const manifestIsNew = !existsSync(path.join(result.target, 'package.json'))
  for (const anchor of anchors) {
    for (const rel of GROUPS[anchor](files)) {
      const to = path.join(result.target, rel)
      const from = path.join(BOOTSTRAP_DIR, rel)
      if (existsSync(to)) {
        if (rel === 'package.json') mergePackageJson(to, from, result)
        else result.skipped.push(rel)
        continue
      }
      if (rel === 'package-lock.json' && !manifestIsNew) continue
      mkdirSync(path.dirname(to), { recursive: true })
      copyFileSync(from, to)
      result.created.push(rel)
    }
  }
  return result
}

function substitute(text, vars) {
  return text.replace(/__([A-Z]+)__/g, (m, key) => vars[key] ?? m)
}

/** Registry line for a presentation, inserted before the closing bracket of the array. */
export function registerPresentation(registryFile, slug, title) {
  const source = readFileSync(registryFile, 'utf8')
  if (new RegExp(`slug:\\s*['"\`]${slug}['"\`]`).test(source)) throw new Error(`"${slug}" is already registered in ${registryFile}`)
  const open = source.search(/PresentationEntry\[\]\s*=\s*\[/)
  if (open < 0) throw new Error(`could not find the presentations array in ${registryFile}`)
  const close = source.lastIndexOf('\n]')
  if (close < open) throw new Error(`could not find the end of the presentations array in ${registryFile}`)
  const entry = `  {\n    slug: ${JSON.stringify(slug).replace(/"/g, "'")},\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  writeFileSync(registryFile, `${source.slice(0, close + 1)}${entry}${source.slice(close + 1)}`)
}

/** Create `src/presentations/<slug>/` from the presentation template and register it. Never overwrites. */
export function createPresentation(target, slug, title) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`slug "${slug}" must be lowercase words joined by hyphens`)
  const dir = path.join(target, 'src', 'presentations', slug)
  if (existsSync(dir)) throw new Error(`${dir} already exists; refusing to overwrite`)
  const registry = path.join(target, 'src', 'presentations', 'index.ts')
  if (!existsSync(registry)) throw new Error(`${registry} is missing (the presentation registry); scaffold the presentation index first`)
  const created = []
  for (const rel of listFiles(PRESENTATION_TEMPLATE_DIR)) {
    const to = path.join(dir, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    writeFileSync(to, substitute(readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, rel), 'utf8'), { SLUG: slug, TITLE: title }))
    created.push(path.relative(target, to).split(path.sep).join('/'))
  }
  registerPresentation(registry, slug, title)
  return { dir, created, route: `/${slug}` }
}

function main(argv) {
  const [command, ...rest] = argv
  const flag = (name) => {
    const i = rest.indexOf(name)
    return i >= 0 ? rest[i + 1] : undefined
  }
  if (command === 'detect') {
    console.log(JSON.stringify(resolveTarget(rest[0] ?? process.cwd()), null, 2))
  } else if (command === 'scaffold') {
    const target = rest[0]
    if (!target) throw new Error('usage: scaffold <targetDir> [--only build,kit,index] [--install]')
    const only = flag('--only')?.split(',') ?? ANCHORS
    const result = scaffold(target, only)
    console.log(JSON.stringify(result, null, 2))
    if (rest.includes('--install')) {
      const fresh = result.created.includes('package-lock.json')
      const install = spawnSync('npm', [fresh ? 'ci' : 'install'], { cwd: result.target, stdio: 'inherit' })
      if (install.status !== 0) throw new Error('dependency installation failed')
    }
  } else if (command === 'new') {
    const [target, slug] = rest
    const title = flag('--title')
    if (!target || !slug || !title) throw new Error('usage: new <targetDir> <slug> --title "Title"')
    console.log(JSON.stringify(createPresentation(target, slug, title), null, 2))
  } else {
    throw new Error('commands: detect | scaffold | new')
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(`presentation-tool: ${error.message}`)
    process.exit(1)
  }
}
