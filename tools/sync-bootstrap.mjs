#!/usr/bin/env node
// Mirrors the canonical app files into the distributable bootstrap template. Run after changing
// the kit, the sample, or the scripts. The package manifest and lock file are maintained separately.
import { cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const bootstrap = join(root, 'skills', 'presentation', 'templates', 'bootstrap')

const SRC_DIRS = ['presentation-kit', 'presentations']
const SRC_FILES = ['main.tsx', 'route.tsx', 'Landing.tsx', 'index.css', 'type-contracts.tsx']
const ROOT_FILES = [
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'eslint.config.js',
  '.npmrc',
  '.gitignore',
  'public/favicon.svg',
]

await rm(join(bootstrap, 'src'), { recursive: true, force: true })
await rm(join(bootstrap, 'scripts'), { recursive: true, force: true })
await rm(join(bootstrap, 'public'), { recursive: true, force: true })
await mkdir(join(bootstrap, 'src'), { recursive: true })
for (const dir of SRC_DIRS) await cp(join(root, 'src', dir), join(bootstrap, 'src', dir), { recursive: true })
for (const file of SRC_FILES) await cp(join(root, 'src', file), join(bootstrap, 'src', file))
await cp(join(root, 'scripts'), join(bootstrap, 'scripts'), { recursive: true })
for (const file of ROOT_FILES) {
  await mkdir(join(bootstrap, file, '..'), { recursive: true })
  await cp(join(root, file), join(bootstrap, file))
}
console.log(`synced ${bootstrap}`)
