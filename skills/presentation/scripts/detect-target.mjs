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

/** Contract-level anchor detection: keyed on presence, not on a byte-identical scaffold. */
export function detectAnchors(appDir) {
  const pkg = readJson(join(appDir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(
    pkg?.scripts?.build && deps.react && (deps.vite || hasAny(appDir, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'])),
  )
  const kitDir = join(appDir, 'src', 'presentation-kit')
  const kit = hasAny(kitDir, ['index.ts', 'index.tsx']) && hasAny(kitDir, ['Presentation.tsx', 'Presentation.jsx'])
  const index = hasAny(join(appDir, 'src', 'presentations'), ['index.ts', 'index.tsx'])
  return { build, kit, index }
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
    missing,
    nonEmpty,
    needsConfirmation: nonEmpty && missing.length > 0,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(detectTarget(process.argv[2] ?? process.cwd()), null, 2))
}
