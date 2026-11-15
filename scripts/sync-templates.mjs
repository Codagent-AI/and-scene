import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
const out = new URL('../skills/presentation/templates/bootstrap/', import.meta.url)
await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
for (const file of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js']) await cp(new URL(`../${file}`, import.meta.url), new URL(file, out))
for (const dir of ['src/presentation-kit', 'scripts']) await cp(new URL(`../${dir}`, import.meta.url), new URL(dir, out), { recursive: true, filter: path => !path.endsWith('sync-templates.mjs') })
for (const file of ['src/main.tsx', 'src/Router.tsx', 'src/routes.ts', 'src/Landing.tsx']) await cp(new URL(`../${file}`, import.meta.url), new URL(file, out))
await writeFile(new URL('src/index.css', out), 'body { margin: 0; }\n')
await writeFile(new URL('src/Landing.tsx', out), `import { presentations } from './presentations'\nexport default function Landing() { return <main><h1>Presentations</h1>{presentations.map(p => <p key={p.slug}><a href={'/' + p.slug}>{p.title}</a></p>)}</main> }\n`)
await mkdir(new URL('src/presentations/', out), { recursive: true })
await cp(new URL('../skills/presentation/templates/presentation/', import.meta.url), new URL('src/presentations/example/', out), { recursive: true })
await writeFile(new URL('src/presentations/index.ts', out), `import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{default: ComponentType}> }\nexport const presentations: PresentationEntry[] = [{ slug: 'example', title: 'Your presentation', load: () => import('./example/Talk') }]\n`)
const pkg = JSON.parse(await readFile(new URL('package.json', out), 'utf8'))
// Scaffold has no repository tests; these commands are ready for generated routes.
delete pkg.scripts['test']; delete pkg.scripts['test:all']; delete pkg.scripts['test:browser']
await writeFile(new URL('package.json', out), JSON.stringify(pkg, null, 2) + '\n')
