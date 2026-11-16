import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { projectRoot } from './browser.mjs'
const root = resolve(projectRoot, 'skills/presentation/templates/bootstrap')
await mkdir(root, { recursive: true })
for (const file of ['src/presentation-kit', 'scripts', 'src/main.tsx', 'src/Router.tsx', 'src/routing.ts', 'src/Landing.tsx', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', 'package.json', 'package-lock.json', '.gitignore', '.npmrc']) {
  if (file === 'src/presentation-kit' || file === 'scripts') await rm(resolve(root, file), { recursive: true, force: true })
  await mkdir(resolve(root, file, '..'), { recursive: true })
  await cp(resolve(projectRoot, file), resolve(root, file), { recursive: true })
}
await rm(resolve(root, 'scripts/sync-templates.mjs'))
await rm(resolve(root, 'scripts/run-checks.mjs'))
const htmlFile = resolve(root, 'index.html')
await writeFile(htmlFile, (await readFile(htmlFile, 'utf8')).replace(/ {4}<link rel="icon"[^>]+>\n/, ''))
await mkdir(resolve(root, 'src/presentations'), { recursive: true })
await writeFile(resolve(root, 'src/presentations/index.ts'), "import type { RegistryEntry } from '../presentation-kit/types'\nexport const presentations: RegistryEntry[] = []\n")
await writeFile(resolve(root, 'src/index.css'), '/* Host geometry only. Presentations own their visual styles. */\n* { box-sizing: border-box; }\nbody { margin: 0; }\n')
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
pkg.scripts.test = 'vitest run --passWithNoTests'
delete pkg.scripts['test:integration']
delete pkg.scripts['test:types']
await writeFile(resolve(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
console.log('Bootstrap kit and runtime scripts synchronized; scaffold contains no designed presentation.')
