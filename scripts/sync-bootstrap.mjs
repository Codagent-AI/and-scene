import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await rm(target, { recursive: true, force: true })
await mkdir(`${target}/src/presentations`, { recursive: true })
for (const name of ['index.html', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', '.gitignore']) await cp(name, `${target}/${name}`)
for (const name of ['presentation-kit', 'Router.tsx', 'main.tsx']) await cp(`src/${name}`, `${target}/src/${name}`, { recursive: true })
await cp('scripts', `${target}/scripts`, { recursive: true, filter: source => !source.endsWith('sync-bootstrap.mjs') })
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
pkg.scripts = { dev: 'vite', build: 'tsc -b && vite build', lint: 'eslint .', preview: 'vite preview', test: 'vitest run --passWithNoTests', verify: 'node scripts/verify.mjs', inspect: 'node scripts/inspect-presentation.mjs' }
await writeFile(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n')
await writeFile(`${target}/src/index.css`, '/* Presentation and host styles belong to their authors. */\n')
await writeFile(`${target}/src/Landing.tsx`, `import { presentations } from './presentations'\nexport function Landing() { return <main><h1>Presentations</h1><ul>{presentations.map(entry => <li key={entry.slug}><a href={\`/\${entry.slug}\`}>{entry.title}</a></li>)}</ul></main> }\n`)
await writeFile(`${target}/src/presentations/index.ts`, `import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: PresentationEntry[] = []\n`)
console.log('Bootstrap snapshot synchronized')
