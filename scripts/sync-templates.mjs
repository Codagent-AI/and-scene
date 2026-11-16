import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ROOT } from './browser.mjs'
const target = resolve(ROOT, 'skills/presentation/templates/bootstrap')
await mkdir(target, { recursive: true })
for (const name of ['src/presentation-kit', 'scripts']) {
  if (name === 'src/presentation-kit') { await rm(resolve(target, name), { recursive: true, force: true }); await cp(resolve(ROOT, name), resolve(target, name), { recursive: true }) }
}
for (const name of ['package.json', 'package-lock.json', 'index.html', 'public/favicon.svg', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', '.gitignore', 'src/main.tsx', 'src/Router.tsx', 'src/routes.ts', 'src/Landing.tsx', 'src/presentations/index.ts', 'scripts/browser.mjs', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/diagnostics.mjs', 'scripts/reference.json']) {
  const dest = resolve(target, name); await mkdir(resolve(dest, '..'), { recursive: true }); await cp(resolve(ROOT, name), dest)
}
await cp(resolve(ROOT, 'src/presentations/how-to-make-a-presentation'), resolve(target, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
await rm(resolve(target, 'src/presentations/how-to-make-a-presentation/presentation.css'), { force: true })
const talk = resolve(target, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
await writeFile(talk, (await readFile(talk, 'utf8')).replace("import './presentation.css'\n", ''))
await writeFile(resolve(target, 'src/index.css'), '/* Host styling belongs here. The bootstrap intentionally supplies no presentation theme. */\n')
await writeFile(resolve(target, 'vitest.config.ts'), "import { defineConfig } from 'vitest/config'\nexport default defineConfig({ test: { passWithNoTests: true } })\n")
const pkg = JSON.parse(await readFile(resolve(target, 'package.json'), 'utf8'))
delete pkg.scripts['test:integration']
await writeFile(resolve(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
