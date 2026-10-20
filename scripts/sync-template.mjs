// Refreshes the shared files of the bootstrap template from their canonical sources
// (the kit, verify/inspect scripts, router, and TypeScript config). Run after changing any.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')

export const SHARED_FILES = [
  'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts',
  'src/main.tsx', 'src/AppRouter.tsx', 'src/router.ts', 'src/Landing.tsx',
  'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs',
]
export const KIT_DIR = 'src/presentation-kit'
export const isTestFile = (name) => /\.test\.[cm]?[jt]sx?$/.test(name)

export function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

export function sync() {
  rmSync(join(TEMPLATE, KIT_DIR), { recursive: true, force: true })
  for (const file of listFiles(join(ROOT, KIT_DIR)).filter((f) => !isTestFile(f))) {
    const target = join(TEMPLATE, file.slice(ROOT.length))
    mkdirSync(dirname(target), { recursive: true })
    cpSync(file, target)
  }
  for (const file of SHARED_FILES) {
    mkdirSync(dirname(join(TEMPLATE, file)), { recursive: true })
    cpSync(join(ROOT, file), join(TEMPLATE, file))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sync()
  console.log(`synced ${statSync(TEMPLATE).isDirectory() ? TEMPLATE : ''}`)
}
