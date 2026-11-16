import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'skills/presentation/templates/bootstrap')
await mkdir(target, { recursive: true })
for (const path of ['src/presentation-kit','scripts/lib','scripts/verify.mjs','scripts/inspect-presentation.mjs','src/main.tsx','src/Router.tsx','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','eslint.config.js','.gitignore','vitest.config.ts']) {
  await mkdir(dirname(join(target,path)), { recursive: true })
  await cp(join(root,path),join(target,path),{ recursive:true })
}
const pkg=JSON.parse(await readFile(join(target,'package.json'),'utf8'))
pkg.scripts.verify='node scripts/verify.mjs --slug example'
delete pkg.scripts['test:browser']
await writeFile(join(target,'package.json'),JSON.stringify(pkg,null,2)+'\n')
const tsconfig=await readFile(join(target,'tsconfig.app.json'),'utf8')
await writeFile(join(target,'tsconfig.app.json'),tsconfig.replace(', "tests/contracts.tsx"',''))
await mkdir(join(target,'src/presentations/example'),{recursive:true})
await cp(join(root,'skills/presentation/templates/presentation'),join(target,'src/presentations/example'),{recursive:true})
await writeFile(join(target,'src/presentations/index.ts'),`import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [{slug:'example',title:'Your presentation',load:()=>import('./example/Talk')}]
`)
await writeFile(join(target,'src/Landing.tsx'),`import { presentations } from './presentations'
export function Landing() { return <main><h1>Presentations</h1>{presentations.map(p=><p key={p.slug}><a href={'/'+p.slug}>{p.title}</a></p>)}</main> }
`)
await writeFile(join(target,'src/index.css'),'/* Host CSS belongs here. Presentation-specific CSS belongs with its presentation. */\n')
await mkdir(join(target,'tests'),{recursive:true})
await writeFile(join(target,'tests/setup.ts'),'')
await writeFile(join(target,'tests/fit.test.ts'),`import {expect,it} from 'vitest'
import {fitScale} from '../src/presentation-kit/useFitScale'
it('fits the design canvas',()=>expect(fitScale(390,844,'browse')).toBeGreaterThan(0))
`)
console.log('Synced style-neutral bootstrap, canonical kit, scripts and lock data.')
