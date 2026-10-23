#!/usr/bin/env node
// Copies the canonical kit and shared app/scripts files into the bootstrap template.
// `--check` only reports drift (exit 1) instead of copying.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = path.join(root, 'skills/presentation/templates/bootstrap')

/** Paths (files or directories) that must stay byte-identical in the template. */
export const SHARED = [
  'src/presentation-kit',
  'src/main.tsx',
  'src/router.tsx',
  'src/routes.ts',
  'src/Landing.tsx',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib/preview.mjs',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'index.html',
]

function files(target) {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return ['']
  return readdirSync(target, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(target, path.join(entry.parentPath, entry.name)))
}

/** Returns the shared files whose template copy is missing or differs. */
export function drift() {
  const bad = []
  for (const shared of SHARED) {
    const source = path.join(root, shared)
    const names = new Set([...files(source), ...files(path.join(template, shared))])
    for (const name of names) {
      const a = path.join(source, name)
      const b = path.join(template, shared, name)
      if (!existsSync(a) || !existsSync(b) || !readFileSync(a).equals(readFileSync(b))) {
        bad.push(path.join(shared, name))
      }
    }
  }
  return bad
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const bad = drift()
    if (bad.length > 0) {
      console.error(`template drift:\n${bad.join('\n')}`)
      process.exit(1)
    }
    console.log('template is in sync')
  } else {
    for (const shared of SHARED) {
      const target = path.join(template, shared)
      mkdirSync(path.dirname(target), { recursive: true })
      cpSync(path.join(root, shared), target, { recursive: true, force: true })
    }
    console.log(`synced ${SHARED.length} shared paths into ${path.relative(root, template)}`)
  }
}
