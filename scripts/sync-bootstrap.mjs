import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await rm(target, { recursive: true, force: true })
await mkdir(`${target}/src/presentations/example`, { recursive: true })
for (const file of ['package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore']) await cp(file, `${target}/${file}`)
for (const file of ['main.tsx', 'Router.tsx', 'Landing.tsx']) await cp(`src/${file}`, `${target}/src/${file}`)
await cp('src/presentation-kit', `${target}/src/presentation-kit`, { recursive: true })
await mkdir(`${target}/scripts`, { recursive: true })
for (const file of ['browser.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'diagnostics.mjs', 'reference.json']) await cp(`scripts/${file}`, `${target}/scripts/${file}`)
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
pkg.scripts = { dev: 'vite', build: 'tsc -b && vite build', lint: 'eslint .', preview: 'vite preview', verify: 'node scripts/verify.mjs --slug example --no-reference', inspect: 'node scripts/inspect-presentation.mjs' }
await writeFile(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n')
await writeFile(`${target}/src/index.css`, '/* Host styles are opt-in. */\n')
await writeFile(`${target}/src/presentations/index.ts`, `import type { ComponentType } from 'react'\nexport interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: RegistryEntry[] = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]\n`)
await writeFile(`${target}/src/presentations/example/Talk.tsx`, `import { Presentation, Box } from '../../presentation-kit'\nimport type { Step } from '../../presentation-kit'\nconst steps: Step[] = [{ id: 'start', era: 'start', title: 'Your presentation', caption: 'Replace this example with your own evolving scene.', payload: undefined, Scene: () => <Box entityId="example:idea">Your idea</Box> }]\nexport default function Talk() { return <Presentation steps={steps} title="Example" /> }\n`)
