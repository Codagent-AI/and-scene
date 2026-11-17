import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const target = resolve(root, 'skills/presentation/templates/bootstrap')
await mkdir(resolve(target, 'src/presentations/example'), { recursive: true })
await mkdir(resolve(target, 'scripts'), { recursive: true })
await rm(resolve(target, 'src/presentation-kit'), { recursive: true, force: true })
await cp(resolve(root, 'src/presentation-kit'), resolve(target, 'src/presentation-kit'), { recursive: true })
for (const file of ['index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'package-lock.json', '.gitignore']) await cp(resolve(root, file), resolve(target, file))
for (const file of ['browser.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'diagnostics.mjs', 'validation.mjs']) await cp(resolve(root, 'scripts', file), resolve(target, 'scripts', file))
for (const file of ['main.tsx', 'Landing.tsx', 'PresentationErrorBoundary.tsx']) await cp(resolve(root, 'src', file), resolve(target, 'src', file))
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
pkg.scripts.test = 'vitest run --passWithNoTests'
delete pkg.scripts['test:integration']
await writeFile(resolve(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
await writeFile(resolve(target, 'src/index.css'), '/* Host styles are opt-in. */\n')
await writeFile(resolve(target, 'presentation.config.json'), '{ "slug": "example", "reference": false }\n')
await writeFile(resolve(target, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly RegistryEntry[] = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]
export function findPresentation(pathname: string, registry = presentations) { return registry.find(entry => '/' + entry.slug === pathname.replace(/\\/$/, '')) }
`)
await writeFile(resolve(target, 'src/presentations/example/Talk.tsx'), `import { Presentation } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <div>{payload}</div> }
const steps: Step<string>[] = [{ id: 'start', era: 'example', title: 'Example', caption: 'Replace this example with your presentation.', Scene, payload: 'Your scene goes here' }]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }
`)
console.log('Bootstrap snapshot aligned with canonical kit and browser scripts.')
