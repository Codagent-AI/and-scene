#!/usr/bin/env node
// Refreshes the distributable bootstrap snapshot from the canonical sources:
// the scene kit (without tests), the verification/inspection scripts, and the starter presentation.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fillTemplate } from '../skills/presentation/scripts/scaffold.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templates = path.join(root, 'skills', 'presentation', 'templates')
const bootstrap = path.join(templates, 'bootstrap')

export const SCRIPT_FILES = ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs']

async function copyKit() {
  const target = path.join(bootstrap, 'src', 'presentation-kit')
  await rm(target, { recursive: true, force: true })
  await cp(path.join(root, 'src', 'presentation-kit'), target, {
    recursive: true,
    filter: (source) => !source.split(path.sep).includes('__tests__'),
  })
}

async function copyScripts() {
  for (const file of SCRIPT_FILES) {
    const target = path.join(bootstrap, 'scripts', file)
    await mkdir(path.dirname(target), { recursive: true })
    await cp(path.join(root, 'scripts', file), target)
  }
}

async function writeStarter() {
  const source = path.join(templates, 'presentation')
  const target = path.join(bootstrap, 'src', 'presentations', 'starter')
  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })
  for (const name of await readdir(source)) {
    // The scaffold ships no styling: the starter keeps the kit's hooks and omits the template stylesheet.
    if (name.endsWith('.css')) continue
    let text = fillTemplate(await readFile(path.join(source, name), 'utf8'), 'starter', 'Starter presentation')
    if (name === 'Talk.tsx') text = text.replace(/import '\.\/talk\.css'\n/, '').replace(' className="p-starter"', '')
    await writeFile(path.join(target, name), text)
  }
  await writeFile(
    path.join(bootstrap, 'src', 'presentations', 'index.ts'),
    `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk.tsx'),
  },
]
`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await copyKit()
  await copyScripts()
  await writeStarter()
  console.log('bootstrap template refreshed')
}
