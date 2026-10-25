#!/usr/bin/env node
// Refreshes skills/presentation/templates/bootstrap from the canonical sources in this repository.
// Run after changing the kit, host files, or verification scripts: `npm run sync:templates`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SYNCED_FILES, SYNCED_SCRIPTS, isKitSource } from './template-sync.mjs'
import { renderTemplates, registerPresentation } from '../skills/presentation/scripts/new-presentation.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'skills/presentation/templates/bootstrap')

function copy(rel) {
  fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true })
  fs.copyFileSync(path.join(root, rel), path.join(out, rel))
}

function kitFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name)
    return e.isDirectory() ? kitFiles(rel) : [rel]
  })
}

fs.rmSync(path.join(out, 'src/presentation-kit'), { recursive: true, force: true })
fs.rmSync(path.join(out, 'src/presentations'), { recursive: true, force: true })
for (const rel of [...SYNCED_FILES, ...SYNCED_SCRIPTS, ...kitFiles('src/presentation-kit').filter(isKitSource)]) copy(rel)

// The registry starts empty; the starter presentation is rendered from the presentation templates.
const registry = `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

// Explicit registry: adding a presentation is a new folder plus one line here.
export const presentations: PresentationEntry[] = [
]

export function findPresentation(slug: string): PresentationEntry | undefined {
  return presentations.find((p) => p.slug === slug)
}
`
const indexFile = path.join(out, 'src/presentations/index.ts')
fs.mkdirSync(path.dirname(indexFile), { recursive: true })
fs.writeFileSync(indexFile, registry)
const starter = { slug: 'starter', title: 'Starter Presentation' }
renderTemplates(path.join(out, 'src/presentations/starter'), starter)
registerPresentation(indexFile, starter)
console.log('templates synced')
