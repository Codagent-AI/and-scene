#!/usr/bin/env node
// Refresh the shared files of the skill's bootstrap template from the canonical sources.
// Run `npm run sync:templates` after changing the kit, the scripts, or the router.
import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

const shared = [
  'src/presentation-kit',
  'scripts',
  'src/main.tsx',
  'src/Landing.tsx',
  'src/router.tsx',
  'src/routes.ts',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
]

for (const rel of shared) {
  const dest = path.join(bootstrap, rel)
  await rm(dest, { recursive: true, force: true })
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(path.join(root, rel), dest, { recursive: true })
}
console.log(`synced ${shared.length} shared paths into ${path.relative(root, bootstrap)}`)
