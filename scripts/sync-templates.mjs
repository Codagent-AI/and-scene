// Refresh skills/presentation/templates/bootstrap from the canonical sources:
// kit (minus tests), app entry/router files, verification/inspection scripts, and the registered starter presentation.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPresentation, listFiles } from '../skills/presentation/scripts/lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

rmSync(path.join(bootstrap, 'src/presentation-kit'), { recursive: true, force: true })
for (const file of listFiles(path.join(root, 'src/presentation-kit')).filter((f) => !/\.test\.tsx?$/.test(f))) {
  const dest = path.join(bootstrap, path.relative(root, file))
  mkdirSync(path.dirname(dest), { recursive: true })
  cpSync(file, dest)
}
for (const f of ['src/main.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/index.css', 'src/presentations/mount.tsx']) cpSync(path.join(root, f), path.join(bootstrap, f))
for (const f of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) cpSync(path.join(root, 'scripts', f), path.join(bootstrap, 'scripts', f))

rmSync(path.join(bootstrap, 'src/presentations/starter'), { recursive: true, force: true })
const registry = path.join(bootstrap, 'src/presentations/index.ts')
writeFileSync(registry, readFileSync(registry, 'utf8').replace(/(= \[\n)[\s\S]*?\n\]/, '$1]'))
createPresentation(bootstrap, 'starter', 'Starter presentation')
