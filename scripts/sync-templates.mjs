#!/usr/bin/env node
// Copies the canonical scene kit and the shared scripts/app files into the
// bootstrap template, so the distributable snapshot stays byte-aligned.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE = path.join(ROOT, 'skills/presentation/templates/bootstrap')

/** Paths (files or directories) mirrored from the repository into the template. */
export const SYNCED = [
  'src/presentation-kit',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
  'src/Router.tsx',
  'src/router.ts',
  'src/Landing.tsx',
  'src/main.tsx',
  'src/presentations/types.ts',
  'vite.config.ts',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'index.html',
  'public/favicon.svg',
]

export function listFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listFiles(full).map((f) => path.join(name, f)))
    else out.push(name)
  }
  return out.sort()
}

export function sync(root = ROOT, template = TEMPLATE) {
  for (const rel of SYNCED) {
    const from = path.join(root, rel)
    const to = path.join(template, rel)
    rmSync(to, { recursive: true, force: true })
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to, { recursive: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  sync()
  console.log(`synced ${SYNCED.length} paths into ${path.relative(ROOT, TEMPLATE)}`)
}
