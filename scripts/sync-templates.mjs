import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises'
const target = new URL('../skills/presentation/templates/bootstrap/', import.meta.url)
await mkdir(target, { recursive: true })
for (const path of ['src/presentation-kit', 'scripts']) {
  await rm(new URL(path, target), { recursive: true, force: true })
  await cp(new URL(`../${path}`, import.meta.url), new URL(path, target), { recursive: true, filter: source => !source.endsWith('sync-templates.mjs') })
}
for (const path of ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'src/main.tsx', 'src/Router.tsx']) {
  await cp(new URL(`../${path}`, import.meta.url), new URL(path, target))
}
const pkg = JSON.parse(await readFile(new URL('package.json', target), 'utf8'))
delete pkg.scripts.test
delete pkg.scripts['test:integration']
await writeFile(new URL('package.json', target), JSON.stringify(pkg, null, 2) + '\n')
