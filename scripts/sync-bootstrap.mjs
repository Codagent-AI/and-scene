import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await rm(target, { recursive: true, force: true })
await mkdir(`${target}/src/presentations/example`, { recursive: true })
for (const file of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', '.gitignore', '.npmrc']) await cp(file, `${target}/${file}`)
for (const directory of ['src/presentation-kit', 'scripts']) {
  await cp(directory, `${target}/${directory}`, { recursive: true, filter: source => !source.endsWith('sync-bootstrap.mjs') && !source.endsWith('reference.json') })
}
const pkg = JSON.parse(await readFile(`${target}/package.json`, 'utf8'))
pkg.name = 'and-scene-presentation'
pkg.scripts.test = 'vitest run --passWithNoTests'
pkg.scripts.verify = 'node scripts/verify.mjs --slug example'
delete pkg.scripts['test:integration']; delete pkg.scripts['test:all']
await writeFile(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n')
const lock = JSON.parse(await readFile(`${target}/package-lock.json`, 'utf8'))
lock.name = pkg.name; lock.packages[''].name = pkg.name
await writeFile(`${target}/package-lock.json`, JSON.stringify(lock, null, 2) + '\n')
await writeFile(`${target}/src/main.tsx`, await readFile('src/main.tsx'))
await writeFile(`${target}/src/Router.tsx`, await readFile('src/Router.tsx'))
await writeFile(`${target}/src/index.css`, '/* Host styling is opt-in. */\n')
await writeFile(`${target}/src/Landing.tsx`, `import { presentations } from './presentations'\nexport function Landing() { return <main><h1>Presentations</h1>{presentations.map(entry => <p key={entry.slug}><a href={'/' + entry.slug}>{entry.title}</a></p>)}</main> }\n`)
await writeFile(`${target}/src/presentations/index.ts`, `import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: PresentationEntry[] = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]\n`)
await writeFile(`${target}/src/presentations/example/Talk.tsx`, `import { Presentation, Box } from '../../presentation-kit'\nimport type { SceneProps, Step } from '../../presentation-kit'\nfunction Scene({ payload }: SceneProps<string>) { return <Box id="example:idea" style={{ position: 'absolute', left: 180, top: 140 }}>{payload}</Box> }\nconst steps: Step<string>[] = [{ id: 'example', era: 'example', title: 'Example', caption: 'An unstyled scene. Replace it with your presentation.', Scene, payload: 'Your idea' }]\nexport default function Talk() { return <Presentation title="Example" steps={steps} /> }\n`)
console.log('Bootstrap snapshot synchronized')
