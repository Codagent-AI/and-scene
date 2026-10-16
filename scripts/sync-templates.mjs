#!/usr/bin/env node
// Refresh the bootstrap template's copies of the canonical kit and scripts.
// The kit (src/presentation-kit) and the scripts are the source of truth.
import { cpSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

rmSync(path.join(bootstrap, 'src', 'presentation-kit'), { recursive: true, force: true })
cpSync(path.join(root, 'src', 'presentation-kit'), path.join(bootstrap, 'src', 'presentation-kit'), { recursive: true })
for (const f of ['verify.mjs', 'inspect-presentation.mjs']) {
  cpSync(path.join(root, 'scripts', f), path.join(bootstrap, 'scripts', f))
}
cpSync(path.join(root, 'scripts', 'lib'), path.join(bootstrap, 'scripts', 'lib'), { recursive: true })
console.log('[sync-templates] bootstrap template refreshed')
