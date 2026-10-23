#!/usr/bin/env node
// Refreshes the bootstrap snapshot from the canonical sources:
// the scene kit, the host router/landing, and the verify/inspect scripts.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

export const SYNCED_FILES = [
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'src/main.tsx',
  'src/Router.tsx',
  'src/route.ts',
  'src/Landing.tsx',
]
export const SYNCED_DIRS = ['src/presentation-kit']

for (const dir of SYNCED_DIRS) {
  rmSync(path.join(bootstrap, dir), { recursive: true, force: true })
  cpSync(path.join(root, dir), path.join(bootstrap, dir), { recursive: true })
}
for (const file of SYNCED_FILES) {
  mkdirSync(path.dirname(path.join(bootstrap, file)), { recursive: true })
  cpSync(path.join(root, file), path.join(bootstrap, file))
}
console.log('templates synced')
