// Refresh the skill's bootstrap template from the canonical kit and scripts, so the template
// stays byte-aligned with them. Run `npm run sync:templates` after changing any shared file.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

/** Shared paths that must stay byte-identical with their template copies. */
export const SHARED = [
  'src/presentation-kit',
  'src/main.tsx',
  'src/Landing.tsx',
  'src/router.ts',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
]

export const isTestFile = (file) => /\.test\.[cm]?[jt]sx?$/.test(file)

export function sharedFiles(base) {
  const files = []
  const walk = (rel) => {
    const abs = path.join(base, rel)
    if (statSync(abs).isDirectory()) readdirSync(abs).forEach((n) => walk(path.join(rel, n)))
    else if (!isTestFile(rel)) files.push(rel)
  }
  SHARED.forEach(walk)
  return files.sort()
}

function sync() {
  for (const rel of SHARED) rmSync(path.join(bootstrap, rel), { recursive: true, force: true })
  for (const file of sharedFiles(root)) {
    mkdirSync(path.dirname(path.join(bootstrap, file)), { recursive: true })
    cpSync(path.join(root, file), path.join(bootstrap, file))
  }
  return import(pathToFileURL(path.join(root, 'skills/presentation/scripts/presentation-tool.mjs')).href).then(({ newPresentation }) => {
    rmSync(path.join(bootstrap, 'src/presentations'), { recursive: true, force: true })
    mkdirSync(path.join(bootstrap, 'src/presentations'), { recursive: true })
    writeFileSync(
      path.join(bootstrap, 'src/presentations/index.ts'),
      "import type { ComponentType } from 'react'\n\nexport interface PresentationEntry {\n  slug: string\n  title: string\n  load: () => Promise<{ default: ComponentType }>\n}\n\nexport const PRESENTATIONS: readonly PresentationEntry[] = [\n]\n",
    )
    newPresentation(bootstrap, 'starter', 'Starter presentation')
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  sync().then(() => console.log('templates synced'))
}
