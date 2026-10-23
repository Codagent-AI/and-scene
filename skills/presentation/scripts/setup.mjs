#!/usr/bin/env node
// Deterministic helpers for the presentation skill.
//   node setup.mjs detect [dir]                      -> JSON: anchors, target, confirmation
//   node setup.mjs scaffold <targetDir> [--no-install] -> scaffold only the missing anchors
//   node setup.mjs create <targetDir> <slug> <title>  -> new presentation folder + registry line
// Templates are resolved relative to this file, never the caller's working directory.
import { spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATES = path.join(SKILL_DIR, 'templates', 'presentation')

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

// ---- detection ---------------------------------------------------------

export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const kitDir = path.join(dir, 'src', 'presentation-kit')
  return {
    build: Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript),
    kit: ['Presentation.tsx', 'Stage.tsx', 'types.ts'].every((f) => existsSync(path.join(kitDir, f))),
    index: ['index.ts', 'index.tsx'].some((f) => existsSync(path.join(dir, 'src', 'presentations', f))),
  }
}

const isEmptyDir = (dir) =>
  !existsSync(dir) || readdirSync(dir).filter((f) => f !== '.git').length === 0

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(
    pkg?.workspaces ||
      existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
      existsSync(path.join(dir, 'packages')) ||
      existsSync(path.join(dir, 'apps')),
  )
}

/** Resolves where the presentation app lives and what, if anything, must be scaffolded. */
export function detect(dir) {
  dir = path.resolve(dir)
  const here = detectAnchors(dir)
  const nested = path.join(dir, 'presentations')
  let target
  let reason
  if (Object.values(here).every(Boolean)) {
    target = dir
    reason = 'already a presentation app'
  } else if (isEmptyDir(dir)) {
    target = dir
    reason = 'empty directory: scaffold at the root'
  } else if (existsSync(nested) && Object.values(detectAnchors(nested)).some(Boolean)) {
    target = nested
    reason = 'existing presentations/ app'
  } else if (isMonorepo(dir)) {
    target = nested
    reason = 'monorepo: scaffold a self-contained app under presentations/'
  } else {
    target = dir
    reason = 'standalone project: scaffold at the root'
  }
  const anchors = target === dir ? here : detectAnchors(target)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  return {
    dir,
    target,
    reason,
    anchors,
    missing,
    empty: isEmptyDir(dir),
    // A non-empty project must be told where files will land before anything is written.
    needsConfirmation: missing.length > 0 && !isEmptyDir(dir),
  }
}

// ---- scaffolding -------------------------------------------------------

function listFiles(root, rel = '') {
  const out = []
  for (const name of readdirSync(path.join(root, rel))) {
    const r = path.join(rel, name)
    if (statSync(path.join(root, r)).isDirectory()) out.push(...listFiles(root, r))
    else out.push(r)
  }
  return out
}

const BUILD_FILES = [
  'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'vite.config.ts', 'index.html', 'eslint.config.js', '.gitignore', '.npmrc', 'public', 'src/index.css',
  'scripts',
]
const INDEX_FILES = ['src/main.tsx', 'src/Root.tsx', 'src/router.ts', 'src/Landing.tsx', 'src/presentations']
const KIT_FILES = ['src/presentation-kit']

const FILE_GROUPS = { build: BUILD_FILES, kit: KIT_FILES, index: INDEX_FILES }

function expand(group) {
  return group.flatMap((entry) => {
    const abs = path.join(BOOTSTRAP, entry)
    if (!existsSync(abs)) return []
    return statSync(abs).isDirectory() ? listFiles(BOOTSTRAP, entry) : [entry]
  })
}

function mergePackageJson(targetFile) {
  const template = readJson(path.join(BOOTSTRAP, 'package.json'))
  const existing = readJson(targetFile)
  const merged = { ...existing }
  const added = []
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    merged[section] = { ...existing[section] }
    for (const [name, value] of Object.entries(template[section] ?? {})) {
      const taken =
        merged[section][name] !== undefined ||
        (section !== 'scripts' && (existing.dependencies?.[name] || existing.devDependencies?.[name]))
      if (!taken) {
        merged[section][name] = value
        added.push(`${section}.${name}`)
      }
    }
  }
  if (!existing.type) merged.type = 'module'
  writeFileSync(targetFile, `${JSON.stringify(merged, null, 2)}\n`)
  return added
}

/** Copies only the missing anchors. Existing files are never overwritten. */
export function scaffold(targetDir, { install = true } = {}) {
  targetDir = path.resolve(targetDir)
  mkdirSync(targetDir, { recursive: true })
  const anchors = detectAnchors(targetDir)
  const written = []
  const skipped = []
  let merged = []
  for (const anchor of Object.keys(FILE_GROUPS)) {
    if (anchors[anchor]) continue
    for (const rel of expand(FILE_GROUPS[anchor])) {
      const dest = path.join(targetDir, rel)
      if (rel === 'package.json' && existsSync(dest)) {
        merged = mergePackageJson(dest)
        continue
      }
      if (existsSync(dest)) {
        skipped.push(rel)
        continue
      }
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(path.join(BOOTSTRAP, rel), dest)
      written.push(rel)
    }
  }
  let installed = false
  if (install && (written.length || merged.length)) {
    const r = spawnSync('npm', ['install'], { cwd: targetDir, stdio: 'inherit' })
    if (r.status !== 0) throw new Error('npm install failed')
    installed = true
  }
  return { targetDir, anchors, written, skipped, merged, installed }
}

// ---- create a presentation --------------------------------------------

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const render = (text, slug, title) =>
  text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replaceAll('"', '\\"'))

export function createPresentation(targetDir, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`slug must be lowercase kebab-case, got "${slug}"`)
  const dir = path.join(targetDir, 'src', 'presentations', slug)
  const indexFile = ['index.ts', 'index.tsx']
    .map((f) => path.join(targetDir, 'src', 'presentations', f))
    .find((f) => existsSync(f))
  if (!indexFile) throw new Error('presentation index is missing: run scaffold first')
  if (existsSync(dir)) throw new Error(`presentation "${slug}" already exists`)
  const index = readFileSync(indexFile, 'utf8')
  if (index.includes(`slug: '${slug}'`)) throw new Error(`slug "${slug}" is already registered`)

  const files = []
  for (const rel of listFiles(PRESENTATION_TEMPLATES)) {
    const dest = path.join(dir, rel.replace(/\.tmpl$/, ''))
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, render(readFileSync(path.join(PRESENTATION_TEMPLATES, rel), 'utf8'), slug, title))
    files.push(path.relative(targetDir, dest))
  }
  const entry = `  {\n    slug: '${slug}',\n    title: '${title.replaceAll("'", "\\'")}',\n    load: () => import('./${slug}/Talk'),\n  },\n`
  const close = index.lastIndexOf(']')
  if (close < 0) throw new Error('could not find the registry array to extend')
  writeFileSync(indexFile, index.slice(0, close) + entry + index.slice(close))
  return { slug, files, registry: path.relative(targetDir, indexFile) }
}

// ---- CLI ---------------------------------------------------------------

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2)
  try {
    let result
    if (cmd === 'detect') result = detect(rest[0] ?? process.cwd())
    else if (cmd === 'scaffold') result = scaffold(rest[0], { install: !rest.includes('--no-install') })
    else if (cmd === 'create') result = createPresentation(rest[0], rest[1], rest[2] ?? rest[1])
    else throw new Error('usage: setup.mjs detect|scaffold|create ...')
    console.log(JSON.stringify(result, null, 2))
  } catch (e) {
    console.error(`setup: ${e.message}`)
    process.exitCode = 1
  }
}
