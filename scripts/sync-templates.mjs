#!/usr/bin/env node
// Refresh skills/presentation/templates/bootstrap from the canonical sources:
// the kit, the verification/inspection scripts, and a starter presentation.
// `npm run sync:templates`; a parity test fails when the snapshot drifts.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPresentationFiles } from '../skills/presentation/scripts/skill-tools.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

rmSync(path.join(bootstrap, 'src/presentation-kit'), { recursive: true, force: true })
cpSync(path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'), { recursive: true })

mkdirSync(path.join(bootstrap, 'scripts'), { recursive: true })
for (const name of ['verify.mjs', 'inspect-presentation.mjs']) {
  cpSync(path.join(root, 'scripts', name), path.join(bootstrap, 'scripts', name))
}

const presentations = path.join(bootstrap, 'src/presentations')
rmSync(presentations, { recursive: true, force: true })
mkdirSync(presentations, { recursive: true })
createPresentationFiles(bootstrap, 'starter', 'Starter Presentation')
writeFileSync(
  path.join(presentations, 'index.ts'),
  `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is one folder plus one line here. */
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter Presentation',
    load: () => import('./starter/Talk.tsx'),
  },
]
`,
)
console.log('templates/bootstrap synced')
