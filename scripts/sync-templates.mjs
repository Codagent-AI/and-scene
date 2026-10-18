#!/usr/bin/env node
// Refresh the bootstrap snapshot from the canonical sources: the scene kit, the root scripts, and
// the example presentation generated from the presentation templates.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createPresentation, REGISTRY_SKELETON } from '../skills/presentation/scripts/scaffold.mjs'
import { projectRoot } from './lib.mjs'

const root = projectRoot()
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

rmSync(path.join(bootstrap, 'src/presentation-kit'), { recursive: true, force: true })
cpSync(path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'), { recursive: true })

mkdirSync(path.join(bootstrap, 'scripts'), { recursive: true })
for (const file of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
  cpSync(path.join(root, 'scripts', file), path.join(bootstrap, 'scripts', file))
}
for (const file of ['src/main.tsx', 'src/AppRouter.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/index.css']) {
  cpSync(path.join(root, file), path.join(bootstrap, file))
}

rmSync(path.join(bootstrap, 'src/presentations/example'), { recursive: true, force: true })
mkdirSync(path.join(bootstrap, 'src/presentations'), { recursive: true })
writeFileSync(path.join(bootstrap, 'src/presentations/index.ts'), REGISTRY_SKELETON)
createPresentation(bootstrap, { slug: 'example', title: 'Example Presentation' }, { neutralStyle: true })
console.log(`synced bootstrap (${readdirSync(path.join(bootstrap, 'src/presentations')).join(', ')})`)
