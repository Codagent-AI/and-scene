#!/usr/bin/env node
// Refreshes the bootstrap template snapshot from the canonical kit and root scripts.
import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

await rm(path.join(bootstrap, 'src/presentation-kit'), { recursive: true, force: true })
await cp(path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'), { recursive: true })

await rm(path.join(bootstrap, 'scripts'), { recursive: true, force: true })
await mkdir(path.join(bootstrap, 'scripts'), { recursive: true })
for (const file of ['verify.mjs', 'inspect-presentation.mjs', 'lib']) {
  await cp(path.join(root, 'scripts', file), path.join(bootstrap, 'scripts', file), { recursive: true })
}
console.log('templates synced')
