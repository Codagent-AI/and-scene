import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const target = resolve(root, 'skills/presentation/templates/bootstrap')
await mkdir(target, { recursive: true })
for (const path of ['src/presentation-kit', 'scripts/browser-runtime.mjs', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/visual-diagnostics.mjs', 'scripts/reference-outline.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', 'index.html', '.gitignore', 'package.json', 'package-lock.json']) {
  await mkdir(resolve(target, path, '..'), { recursive: true })
  await cp(resolve(root, path), resolve(target, path), { recursive: true })
}
const pkgPath = resolve(target, 'package.json')
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
pkg.scripts.verify = 'node scripts/verify.mjs --slug starter'
pkg.scripts.test = 'vitest run --passWithNoTests'
delete pkg.scripts['test:integration']
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
const tsconfig = resolve(target, 'tsconfig.app.json')
await writeFile(tsconfig, (await readFile(tsconfig, 'utf8')).replace(', "tests/type-contract.tsx"', ''))
