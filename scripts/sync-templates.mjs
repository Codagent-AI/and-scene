#!/usr/bin/env node
// Refreshes the bootstrap template's shared files from the canonical sources in
// this repository, so the scaffold snapshot never drifts from the working kit.
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { PROJECT_ROOT } from './lib/project.mjs'

const TEMPLATE = path.join(PROJECT_ROOT, 'skills/presentation/templates/bootstrap')
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/

/** Directories mirrored exactly (stale files removed); test files are excluded. */
export const MIRRORED_DIRS = ['src/presentation-kit', 'scripts/lib']
/** Individual files copied verbatim. */
export const SHARED_FILES = [
  'scripts/verify.mjs', 'scripts/inspect-presentation.mjs',
  'src/Router.tsx', 'src/Landing.tsx', 'src/routes.ts', 'src/main.tsx', 'src/index.css',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts',
  'index.html', 'public/favicon.svg',
]

export async function listFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listFiles(full)))
    else if (!TEST_FILE.test(entry.name)) out.push(full)
  }
  return out
}

async function main() {
  for (const dir of MIRRORED_DIRS) {
    await rm(path.join(TEMPLATE, dir), { recursive: true, force: true })
    for (const file of await listFiles(path.join(PROJECT_ROOT, dir))) {
      const target = path.join(TEMPLATE, path.relative(PROJECT_ROOT, file))
      await mkdir(path.dirname(target), { recursive: true })
      await cp(file, target)
    }
  }
  for (const file of SHARED_FILES) {
    const target = path.join(TEMPLATE, file)
    await mkdir(path.dirname(target), { recursive: true })
    await cp(path.join(PROJECT_ROOT, file), target)
  }
  console.log('templates synced')
}

if (process.argv[1] === new URL(import.meta.url).pathname) await main()
