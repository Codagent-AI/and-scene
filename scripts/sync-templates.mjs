import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await mkdir(`${target}/src`, { recursive: true })
for (const path of ['src/presentation-kit', 'src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'package-lock.json']) await cp(path, `${target}/${path}`, { recursive: true })
for (const path of ['browser-runtime.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'visual-diagnostics.mjs', 'reference-outline.json']) {
  await mkdir(`${target}/scripts`, { recursive: true }); await cp(`scripts/${path}`, `${target}/scripts/${path}`)
}
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
pkg.scripts = { dev: 'vite', build: 'tsc -b && vite build', lint: 'eslint .', preview: 'vite preview', verify: 'node scripts/verify.mjs --slug example', inspect: 'node scripts/inspect-presentation.mjs' }
await writeFile(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n')
await cp('skills/presentation/templates/presentation', `${target}/src/presentations/example`, { recursive: true })
await writeFile(`${target}/src/presentations/index.ts`, "export const presentations = [{ slug: 'example', title: 'Your presentation', load: () => import('./example/Talk') }]\n")
await writeFile(`${target}/src/index.css`, '/* Host-owned styles may be added here. */\n')
