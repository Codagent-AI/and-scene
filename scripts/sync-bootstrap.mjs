// Release snapshot maintenance. Never run this against a consumer project.
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await rm(target, { recursive: true, force: true })
await mkdir(`${target}/src/presentations/welcome`, { recursive: true })
for (const file of ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', 'package-lock.json']) await cp(file, `${target}/${file}`)
for (const file of ['main.tsx','Router.tsx','Landing.tsx']) await cp(`src/${file}`,`${target}/src/${file}`)
await writeFile(`${target}/src/index.css`, '/* Host styling belongs here. The bootstrap intentionally has no visual defaults. */\n')
await cp('src/presentation-kit', `${target}/src/presentation-kit`, { recursive: true })
await mkdir(`${target}/scripts`, { recursive: true })
for (const file of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs','reference.json']) await cp(`scripts/${file}`, `${target}/scripts/${file}`)
const pkg=JSON.parse(await readFile('package.json','utf8'))
pkg.scripts.test='vitest run --passWithNoTests'
delete pkg.scripts['test:integration']; delete pkg.scripts['test:e2e']
await writeFile(`${target}/package.json`,JSON.stringify(pkg,null,2)+'\n')
await writeFile(`${target}/.gitignore`,'node_modules/\ndist/\nartifacts/\n*.log\n')
await writeFile(`${target}/scripts/presentation.json`,JSON.stringify({slug:'welcome'})+'\n')
await writeFile(`${target}/src/presentations/index.ts`, `import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly RegistryEntry[] = [{ slug: 'welcome', title: 'Welcome', load: () => import('./welcome/Talk') }]
`)
await writeFile(`${target}/src/presentations/welcome/Talk.tsx`, `import { Presentation, Box } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Box layoutId="welcome:idea">{payload}</Box> }
const steps: Step<string>[] = [{ id: 'welcome', era: 'start', title: 'Your first scene', caption: 'Add your own presentation and local CSS.', Scene, payload: 'One idea, ready to grow.' }]
export default function Talk() { return <Presentation steps={steps} title="Welcome" /> }
`)
console.log('Bootstrap snapshot synchronized (neutral welcome route).')
