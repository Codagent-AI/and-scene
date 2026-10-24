#!/usr/bin/env node
// Deterministic helper behind skills/presentation/SKILL.md.
//   node scaffold.mjs plan  <projectDir>                        show anchors, target, and what is missing
//   node scaffold.mjs apply <projectDir> [--confirm]            scaffold only what is missing
//   node scaffold.mjs add   <projectDir> <slug> "<Title>"       create + register a presentation
// Templates are resolved relative to this file, never the caller's working directory.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates/bootstrap')
export const PRESENTATION_DIR = path.join(SKILL_DIR, 'templates/presentation')

export class ConfirmationRequired extends Error {}

const read = (p) => readFileSync(p, 'utf8')

function walk(dir, rel = '') {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const abs = path.join(dir, n)
    return statSync(abs).isDirectory() ? walk(abs, path.join(rel, n)) : [path.join(rel, n)]
  })
}

function readJson(file) {
  try {
    return JSON.parse(read(file))
  } catch {
    return null
  }
}

/** Contract-level detection of the three anchors, keyed on presence rather than byte-equality. */
export function detectAnchors(dir) {
  const pkg = existsSync(path.join(dir, 'package.json')) ? readJson(path.join(dir, 'package.json')) : null
  const hasVite = existsSync(dir) && readdirSync(dir).some((f) => /^vite\.config\./.test(f))
  const kitSrc = walk(path.join(dir, 'src/presentation-kit'))
    .filter((f) => /\.tsx?$/.test(f) && !/__tests__|\.test\./.test(f))
    .map((f) => read(path.join(dir, 'src/presentation-kit', f)))
    .join('\n')
  const indexFile = ['index.ts', 'index.tsx'].map((f) => path.join(dir, 'src/presentations', f)).find(existsSync)
  return {
    build: Boolean(pkg?.scripts?.build) && hasVite,
    kit: /\bPresentation\b/.test(kitSrc) && /\bStep\b/.test(kitSrc) && /\bScene/.test(kitSrc),
    index: Boolean(indexFile) && /\bexport\b/.test(read(indexFile)),
  }
}

export function isMonorepo(dir) {
  const pkg = existsSync(path.join(dir, 'package.json')) ? readJson(path.join(dir, 'package.json')) : null
  return (
    Boolean(pkg?.workspaces) ||
    existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
    ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
  )
}

const isNonEmpty = (dir) => existsSync(dir) && readdirSync(dir).some((n) => n !== '.git')

/** Where the presentation app lives: an existing app, else `presentations/` in a monorepo, else the root. */
export function resolveTarget(dir) {
  const here = detectAnchors(dir)
  if (here.kit || here.index) return { target: dir, reason: 'existing-app' }
  if (isMonorepo(dir)) return { target: path.join(dir, 'presentations'), reason: 'monorepo' }
  return { target: dir, reason: 'standalone' }
}

export function plan(dir) {
  const { target, reason } = resolveTarget(dir)
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  const nonEmpty = isNonEmpty(dir)
  return {
    target,
    reason,
    anchors,
    missing,
    nonEmpty,
    needsConfirmation: nonEmpty && (missing.includes('kit') || missing.includes('index')),
  }
}

/** Template files per anchor, relative to templates/bootstrap. */
function filesFor(anchor) {
  const all = walk(BOOTSTRAP_DIR)
  const under = (prefix) => all.filter((f) => f.startsWith(prefix))
  if (anchor === 'kit') return [...under('src/presentation-kit/'), ...under('scripts/')]
  if (anchor === 'index') {
    return ['src/presentations/index.ts', 'src/presentations/types.ts', 'src/router.ts', 'src/Landing.tsx', 'src/main.tsx']
  }
  return all.filter((f) => (!f.startsWith('src/') || f === 'src/index.css') && !f.startsWith('scripts/') && !f.startsWith('package'))
}

function mergePackageJson(targetFile, created) {
  const template = readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const existing = readJson(targetFile)
  if (!existing) {
    writeFileSync(targetFile, read(path.join(BOOTSTRAP_DIR, 'package.json')))
    created.push('package.json')
    return true
  }
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'scripts']) existing[section] ??= {}
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    for (const [k, v] of Object.entries(template[section])) {
      const declared = section === 'scripts' ? k in existing.scripts : k in existing.dependencies || k in existing.devDependencies
      if (!declared) {
        existing[section][k] = v
        changed = true
      }
    }
  }
  existing.type ??= 'module'
  if (changed) writeFileSync(targetFile, `${JSON.stringify(existing, null, 2)}\n`)
  return changed
}

/** Scaffold only the missing anchors, never overwriting an existing file. */
export function apply(dir, { confirmed = false } = {}) {
  const p = plan(dir)
  if (p.needsConfirmation && !confirmed) {
    throw new ConfirmationRequired(`Scaffolding into ${p.target} needs the user's confirmation (missing: ${p.missing.join(', ')})`)
  }
  const created = []
  const skipped = []
  const manual = []
  mkdirSync(p.target, { recursive: true })
  const hadPackage = existsSync(path.join(p.target, 'package.json'))
  const packageChanged = mergePackageJson(path.join(p.target, 'package.json'), created)
  if (!hadPackage && !existsSync(path.join(p.target, 'package-lock.json'))) {
    cpSync(path.join(BOOTSTRAP_DIR, 'package-lock.json'), path.join(p.target, 'package-lock.json'))
    created.push('package-lock.json')
  }
  for (const anchor of p.missing) {
    for (const rel of filesFor(anchor)) {
      const dest = path.join(p.target, rel)
      if (existsSync(dest)) {
        skipped.push(rel)
        if (rel === 'src/main.tsx') manual.push('src/main.tsx already exists: route "/<slug>" through src/router.ts resolveRoute and render src/Landing.tsx at "/"')
        continue
      }
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(path.join(BOOTSTRAP_DIR, rel), dest)
      created.push(rel)
    }
  }
  return { target: p.target, scaffolded: p.missing, created, skipped, manual, packageChanged, nextSteps: p.missing.length || packageChanged ? ['npm install'] : [] }
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Copy templates/presentation into src/presentations/<slug> and register it in the index. */
export function addPresentation(dir, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`Invalid slug "${slug}": use lowercase words joined by hyphens`)
  const { target } = resolveTarget(dir)
  const indexFile = path.join(target, 'src/presentations/index.ts')
  if (!existsSync(indexFile)) throw new Error(`No presentation index at ${indexFile}; run apply first`)
  const folder = path.join(target, 'src/presentations', slug)
  const registry = read(indexFile)
  if (existsSync(folder) || new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) {
    throw new Error(`Presentation "${slug}" already exists`)
  }
  const fill = (s) => s.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('"', '\\"'))
  for (const rel of walk(PRESENTATION_DIR)) {
    const dest = path.join(folder, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, fill(read(path.join(PRESENTATION_DIR, rel))))
  }
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const marker = /^[ \t]*\/\/ presentations:end[ \t]*$/m
  const updated = marker.test(registry)
    ? registry.replace(marker, (m) => `${entry}${m}`)
    : registry.replace(/\n\]/, `\n${entry}]`)
  writeFileSync(indexFile, updated)
  return { folder, route: `/${slug}`, registered: path.relative(target, indexFile) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, dir, ...rest] = process.argv.slice(2)
  try {
    if (cmd === 'plan') console.log(JSON.stringify(plan(path.resolve(dir)), null, 2))
    else if (cmd === 'apply') console.log(JSON.stringify(apply(path.resolve(dir), { confirmed: rest.includes('--confirm') }), null, 2))
    else if (cmd === 'add') console.log(JSON.stringify(addPresentation(path.resolve(dir), rest[0], rest[1] ?? rest[0]), null, 2))
    else throw new Error('usage: scaffold.mjs plan|apply|add <projectDir> [...]')
  } catch (err) {
    console.error(`[scaffold] ${err.message}`)
    process.exitCode = err instanceof ConfirmationRequired ? 3 : 1
  }
}
