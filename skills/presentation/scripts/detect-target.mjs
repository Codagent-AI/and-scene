#!/usr/bin/env node
// Reports which scaffold anchors exist and where the presentation app belongs.
// Usage: node <skill-dir>/scripts/detect-target.mjs [project-dir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const hasAny = (dir, names) => names.some((n) => existsSync(join(dir, n)))

const SOURCE = /\.(tsx?|jsx?|mjs)$/
const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection'])

function sourceFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (SKIP.has(d.name)) return []
    const path = join(dir, d.name)
    return d.isDirectory() ? sourceFiles(path) : SOURCE.test(d.name) ? [path] : []
  })
}

const read = (file) => readFileSync(file, 'utf8')
const allDirs = (root) => [root, ...readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !SKIP.has(d.name)).flatMap((d) => allDirs(join(root, d.name)))]

/** What the reusable scene kit must contain, whatever its files are called or where they live. */
const KIT_CONTRACT = [
  /\bexport\s+(default\s+)?(function|const|class)\s+Presentation\b|\bexport\s*\{[^}]*\bPresentation\b/, // host component
  /\b(interface|type)\s+(Step|Scene)\w*\b/, // step/scene contract
  /\b(AnimatePresence|LayoutGroup)\b/, // stage that mounts the active step and runs morphs
  /['"]keydown['"]/, // keyboard navigation
]

/** The registry maps presentation entries (slug/route/path) to lazy loaders. */
const INDEX_CONTRACT = [/\b(slug|route|path)\b/, /\bload\b|\bimport\s*\(/]

/** Directory under `src` whose combined sources satisfy the kit contract, or null. */
function findKitDir(appDir) {
  const src = join(appDir, 'src')
  if (!existsSync(src)) return null
  for (const dir of allDirs(src).sort((a, b) => b.length - a.length)) {
    const text = sourceFiles(dir).map(read).join('\n')
    if (text.trim() && KIT_CONTRACT.every((re) => re.test(text))) return dir
  }
  return null
}

/** A source file under `src` that declares the presentation registry, or null. */
function findIndexFile(appDir) {
  for (const file of sourceFiles(join(appDir, 'src'))) {
    const text = read(file)
    if (INDEX_CONTRACT.every((re) => re.test(text)) && /\b(export|default)\b[^;\n]*(presentations|registry|routes|talks)/i.test(text)) return file
  }
  return null
}

/** Contract-level anchor detection: keyed on what the files do, not on how they are named. */
export function detectAnchors(appDir) {
  const pkg = readJson(join(appDir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(
    pkg?.scripts?.build &&
      deps.react &&
      (deps.vite || hasAny(appDir, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'])) &&
      (deps.typescript || hasAny(appDir, ['tsconfig.json'])),
  )
  return { build, kit: findKitDir(appDir) !== null, index: findIndexFile(appDir) !== null }
}

export function locateAnchors(appDir) {
  return { kitDir: findKitDir(appDir), indexFile: findIndexFile(appDir) }
}

export function isMonorepo(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || hasAny(dir, ['pnpm-workspace.yaml', 'packages', 'apps'])
}

const isEmpty = (dir) => !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0

/**
 * Resolution order: an existing presentation app (kit or index anchor) here or in
 * `presentations/`; else `presentations/` inside a monorepo; else the project root.
 */
export function detectTarget(projectDir) {
  const dir = resolve(projectDir)
  const isApp = (a) => a.kit || a.index
  let target = dir
  let reason = 'standalone-or-empty'
  const here = detectAnchors(dir)
  const nested = join(dir, 'presentations')
  const inNested = existsSync(nested) && statSync(nested).isDirectory() ? detectAnchors(nested) : null
  if (isApp(here)) {
    reason = 'existing-app'
  } else if (inNested && (isApp(inNested) || inNested.build)) {
    target = nested
    reason = 'existing-app-in-presentations'
  } else if (isMonorepo(dir)) {
    target = nested
    reason = 'monorepo'
  }
  const anchors = target === dir ? here : detectAnchors(target)
  const missing = Object.entries(anchors).filter(([, ok]) => !ok).map(([name]) => name)
  const nonEmpty = !isEmpty(dir)
  return {
    projectDir: dir,
    target,
    reason,
    monorepo: isMonorepo(dir),
    anchors,
    locations: locateAnchors(target),
    missing,
    nonEmpty,
    needsConfirmation: nonEmpty && missing.length > 0,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(detectTarget(process.argv[2] ?? process.cwd()), null, 2))
}
