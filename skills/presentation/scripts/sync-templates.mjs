// Maintainer tool: refreshes the bootstrap template's copies of the canonical
// kit, scripts, and host router files from this repository (`npm run sync:template`).
import { cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const template = path.join(repo, 'skills/presentation/templates/bootstrap')

await rm(path.join(template, 'src/presentation-kit'), { recursive: true, force: true })
await rm(path.join(template, 'scripts/lib'), { recursive: true, force: true })
const copies = [
  'src/presentation-kit', 'scripts/lib', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs',
  'src/router.ts', 'src/AppRouter.tsx', 'src/lazyPresentation.ts', 'src/Landing.tsx', 'src/main.tsx',
]
for (const rel of copies) await cp(path.join(repo, rel), path.join(template, rel), { recursive: true })
console.log(`synced ${copies.length} paths into ${path.relative(repo, template)}`)
