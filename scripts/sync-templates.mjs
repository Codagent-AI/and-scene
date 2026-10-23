// Refreshes skills/presentation/templates/bootstrap from the canonical sources:
// the scene kit, verification/inspection scripts, and shared app shell files.
// Usage: node scripts/sync-templates.mjs
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPresentation } from '../skills/presentation/scripts/setup.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

/** Files and directories copied byte-for-byte from the repository. */
export const SYNCED = [
  'src/presentation-kit',
  'src/main.tsx',
  'src/Root.tsx',
  'src/router.ts',
  'src/Landing.tsx',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
  'vite.config.ts',
  'index.html',
  'tsconfig.app.json',
  'public/favicon.svg',
]

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const rel of SYNCED) {
    rmSync(path.join(bootstrap, rel), { recursive: true, force: true })
    mkdirSync(path.dirname(path.join(bootstrap, rel)), { recursive: true })
    cpSync(path.join(root, rel), path.join(bootstrap, rel), { recursive: true })
  }
  rmSync(path.join(bootstrap, 'src', 'presentations'), { recursive: true, force: true })
  mkdirSync(path.join(bootstrap, 'src', 'presentations'), { recursive: true })
  writeFileSync(
    path.join(bootstrap, 'src', 'presentations', 'index.ts'),
    `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: readonly PresentationEntry[] = [
]
`,
  )
  createPresentation(bootstrap, 'starter', 'Starter Presentation')
  console.log('templates synced')
}
