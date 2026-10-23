#!/usr/bin/env node
// Scaffolding helper for the presentation skill. Templates are resolved from
// this file's own location (the skill directory), never from the caller's cwd.
//
//   node scaffold.mjs resolve <project-dir>
//   node scaffold.mjs bootstrap <project-dir> [--target <dir>]
//   node scaffold.mjs add <app-dir> <slug> <title>
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

export const ANCHORS = ['build', 'kit', 'index']

const KIT_EXPORTS = ['Presentation', 'Stage', 'usePresentationNav', 'useFitScale', 'Step']
const INDEX_FILES = new Set([
  'src/presentations/index.ts', 'src/presentations/types.ts',
  'src/Router.tsx', 'src/router.ts', 'src/Landing.tsx',
])

function walk(dir, skip = () => false) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue
    const full = path.join(dir, name)
    if (skip(full)) continue
    if (statSync(full).isDirectory()) out.push(...walk(full, skip))
    else out.push(full)
  }
  return out
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Which anchor a bootstrap-template file belongs to. */
export function anchorOf(rel) {
  const r = rel.split(path.sep).join('/')
  if (r.startsWith('src/presentation-kit/') || r.startsWith('scripts/')) return 'kit'
  if (INDEX_FILES.has(r)) return 'index'
  return 'build'
}

function exportsIdentifier(source, name) {
  const declared = new RegExp(`export\\s+(?:default\\s+)?(?:declare\\s+)?(?:async\\s+)?(?:function|const|let|class|interface|type|enum)\\s+${name}\\b`)
  const listed = new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`)
  return declared.test(source) || listed.test(source)
}

/**
 * Contract-level anchor detection: keyed on what a project provides, not on
 * byte-identical files, so renamed or reformatted equivalents still count.
 */
export function detectAnchors(appDir) {
  const pkg = readJson(path.join(appDir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = ['ts', 'js', 'mjs', 'mts'].some((e) => existsSync(path.join(appDir, `vite.config.${e}`)))
  const build = Boolean(
    pkg && typeof pkg.scripts?.build === 'string' && deps.react && deps['react-dom'] && deps.vite && deps.typescript &&
      hasViteConfig && existsSync(path.join(appDir, 'tsconfig.json')),
  )

  const src = path.join(appDir, 'src')
  const kitSources = walk(src, (f) => f.startsWith(path.join(src, 'presentations') + path.sep))
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
  const kit = KIT_EXPORTS.every((name) => kitSources.some((s) => exportsIdentifier(s, name)))

  const indexFile = ['ts', 'tsx', 'js', 'jsx'].map((e) => path.join(src, 'presentations', `index.${e}`)).find(existsSync)
  const index = Boolean(indexFile && /export\s+(?:default\b|(?:const|let)\s+(?:presentations|registry)\b)/.test(readFileSync(indexFile, 'utf8')))
  return { build, kit, index }
}

export function isMonorepo(root) {
  const pkg = readJson(path.join(root, 'package.json'))
  if (pkg?.workspaces) return true
  if (existsSync(path.join(root, 'pnpm-workspace.yaml'))) return true
  return ['packages', 'apps'].some((d) => existsSync(path.join(root, d)) && statSync(path.join(root, d)).isDirectory())
}

export function isEmptyProject(root) {
  if (!existsSync(root)) return true
  return readdirSync(root).filter((n) => n !== '.git' && n !== '.DS_Store').length === 0
}

/** Decide where the presentation app lives and what it still needs. */
export function resolveTarget(root) {
  root = path.resolve(root)
  const empty = isEmptyProject(root)
  const monorepo = isMonorepo(root)
  const rootAnchors = detectAnchors(root)
  const nestedDir = path.join(root, 'presentations')
  const nestedAnchors = detectAnchors(nestedDir)

  let target = root
  let reason = empty ? 'empty directory: scaffold at the root' : 'standalone project: scaffold at the root'
  if (rootAnchors.kit || rootAnchors.index) {
    reason = 'the root is already a presentation app: reuse it'
  } else if (nestedAnchors.kit || nestedAnchors.index || nestedAnchors.build) {
    target = nestedDir
    reason = 'an existing presentation app lives in presentations/: reuse it'
  } else if (monorepo) {
    target = nestedDir
    reason = 'monorepo detected: scaffold a self-contained app in presentations/'
  }
  const anchors = target === root ? rootAnchors : nestedAnchors
  const missing = ANCHORS.filter((a) => !anchors[a])
  return {
    root,
    target,
    relativeTarget: path.relative(root, target) || '.',
    reason,
    monorepo,
    empty,
    anchors,
    missing,
    needsConfirmation: !empty && (missing.includes('kit') || missing.includes('index')),
  }
}

function templateFiles(dir = BOOTSTRAP_DIR) {
  return walk(dir).map((f) => path.relative(BOOTSTRAP_DIR, f))
}

/** Add template dependencies and scripts that an existing package.json lacks. */
export function mergePackageJson(targetFile, templateFile = path.join(BOOTSTRAP_DIR, 'package.json')) {
  const have = readJson(targetFile)
  const want = readJson(templateFile)
  if (!have) return false
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    have[section] ??= {}
    for (const [key, value] of Object.entries(want[section])) {
      const elsewhere = section !== 'scripts' && (have.dependencies?.[key] ?? have.devDependencies?.[key])
      if (have[section][key] === undefined && !elsewhere) {
        have[section][key] = value
        changed = true
      }
    }
  }
  if (changed) writeFileSync(targetFile, JSON.stringify(have, null, 2) + '\n')
  return changed
}

/** Copy the template files for the missing anchors, never overwriting existing files. */
export function bootstrap(target, { anchors = resolveTarget(target).missing } = {}) {
  target = path.resolve(target)
  const copied = []
  const skipped = []
  const hadPackage = existsSync(path.join(target, 'package.json'))
  for (const rel of templateFiles()) {
    if (!anchors.includes(anchorOf(rel))) continue
    const to = path.join(target, rel)
    if (existsSync(to)) {
      skipped.push(rel)
      continue
    }
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(path.join(BOOTSTRAP_DIR, rel), to)
    copied.push(rel)
  }
  const packageUpdated = hadPackage ? mergePackageJson(path.join(target, 'package.json')) : false
  const freshLock = copied.includes('package-lock.json') && copied.includes('package.json')
  return {
    target,
    copied,
    skipped,
    packageUpdated,
    installCommand: freshLock ? 'npm ci' : 'npm install',
    installNeeded: copied.length > 0 || packageUpdated || !existsSync(path.join(target, 'node_modules')),
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Create src/presentations/<slug>/ from the template and register it, leaving existing ones intact. */
export function addPresentation(appDir, { slug, title }) {
  appDir = path.resolve(appDir)
  if (!SLUG.test(slug ?? '')) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and hyphens`)
  if (!title) throw new Error('a presentation title is required')
  const registryFile = path.join(appDir, 'src/presentations/index.ts')
  if (!existsSync(registryFile)) throw new Error('presentation index is missing: run bootstrap first')
  const folder = path.join(appDir, 'src/presentations', slug)
  if (existsSync(folder)) throw new Error(`src/presentations/${slug}/ already exists; choose another slug`)
  const registry = readFileSync(registryFile, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) throw new Error(`slug "${slug}" is already registered`)

  const files = []
  const fill = (text) => text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replace(/["\\]/g, '\\$&')).replaceAll('__CLASS__', `talk-${slug}`)
  for (const abs of walk(PRESENTATION_DIR)) {
    const rel = path.relative(PRESENTATION_DIR, abs)
    const to = path.join(folder, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    writeFileSync(to, fill(readFileSync(abs, 'utf8')))
    files.push(path.join('src/presentations', slug, rel))
  }

  const entry = `  { slug: '${slug}', title: ${JSON.stringify(title)}, load: () => import('./${slug}/Talk') },\n`
  const marker = /^[ \t]*\/\/ presentations:end[ \t]*$/m.exec(registry)
  let updated
  if (marker) {
    updated = registry.slice(0, marker.index) + entry + registry.slice(marker.index)
  } else {
    const close = registry.lastIndexOf(']')
    if (close < 0) throw new Error('could not find the end of the presentations array in src/presentations/index.ts')
    const before = registry.slice(0, close).replace(/\s+$/, '')
    const comma = /[,[]$/.test(before) ? '' : ','
    updated = `${before}${comma}\n${entry}${registry.slice(close)}`
  }
  writeFileSync(registryFile, updated)
  return { slug, folder, files, registry: path.relative(appDir, registryFile) }
}

function main(argv) {
  const [command, ...rest] = argv
  const flag = (name) => {
    const i = rest.indexOf(name)
    return i >= 0 ? rest[i + 1] : undefined
  }
  let result
  if (command === 'resolve') result = resolveTarget(rest[0] ?? '.')
  else if (command === 'bootstrap') {
    const target = flag('--target') ?? resolveTarget(rest[0] ?? '.').target
    result = bootstrap(target)
  } else if (command === 'add') result = addPresentation(rest[0], { slug: rest[1], title: rest.slice(2).join(' ') })
  else throw new Error('usage: scaffold.mjs resolve <dir> | bootstrap <dir> [--target <dir>] | add <app-dir> <slug> <title>')
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (err) {
    console.error(`scaffold: ${err.message}`)
    process.exit(1)
  }
}
