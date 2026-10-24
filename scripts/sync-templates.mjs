// Copies the canonical kit, host files and verification scripts into the skill's
// bootstrap template so the snapshot never drifts. Run after changing any of them.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

export const SYNCED_FILES = [
  'src/main.tsx',
  'src/Landing.tsx',
  'src/router.ts',
  'src/index.css',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib/preview.mjs',
]
export const SYNCED_DIRS = ['src/presentation-kit']

rmSync(path.join(target, 'src', 'presentation-kit'), { recursive: true, force: true })
for (const rel of [...SYNCED_DIRS, ...SYNCED_FILES]) {
  mkdirSync(path.dirname(path.join(target, rel)), { recursive: true })
  cpSync(path.join(root, rel), path.join(target, rel), { recursive: true })
}
console.log('synced bootstrap template from canonical sources')
