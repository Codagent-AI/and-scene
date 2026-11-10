// @vitest-environment node

import { it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { plan, selectTarget, scaffold, templateRoot } from '../skills/presentation/scripts/scaffold.mjs'
it('I-2 contract override recognizes custom anchors and preserves complete targets', async () => {
 const root = await mkdtemp(path.join(tmpdir(),'scene-anchors-'))
 try {
   await writeFile(path.join(root,'custom-build'),'unchanged')
   const result = await plan(root,{build:true,kit:true,index:true})
   expect(result.complete).toBe(true)
   await scaffold(result,{install:false})
   expect(await readFile(path.join(root,'custom-build'),'utf8')).toBe('unchanged')
 } finally { await rm(root,{recursive:true,force:true}) }
})
it('I-3 targets and confirmation guard cover standalone, monorepo and existing app', async () => {
 expect(selectTarget('/repo')).toBe('/repo')
 expect(selectTarget('/repo',{monorepo:true})).toBe('/repo/presentations')
 expect(selectTarget('/repo',{complete:true,monorepo:true})).toBe('/repo')
 for (const signal of ['workspaces','pnpm-workspace.yaml','apps','packages']) {
   const root = await mkdtemp(path.join(tmpdir(),'scene-target-'))
   try {
     if (signal === 'workspaces') await writeFile(path.join(root,'package.json'),JSON.stringify({workspaces:['apps/*']}))
     else if (signal.endsWith('yaml')) await writeFile(path.join(root,signal),'packages: []')
     else await mkdir(path.join(root,signal))
     const result = await plan(root)
     expect(result.target).toBe(path.join(root,'presentations'))
     await expect(scaffold(result,{install:false})).rejects.toThrow('Confirm scaffold target')
   } finally { await rm(root,{recursive:true,force:true}) }
 }
})
it('I-4 template root is relative to the module, not caller working directory', () => {
 expect(templateRoot).toBe(path.resolve('skills/presentation/templates/bootstrap') + path.sep)
})
it('I-2 partial scaffold copies missing anchors while preserving existing build and kit bytes', async () => {
 const root = await mkdtemp(path.join(tmpdir(),'scene-partial-'))
 try {
  await mkdir(path.join(root,'src/presentation-kit'),{recursive:true})
  await writeFile(path.join(root,'src/presentation-kit/Presentation.tsx'),'custom kit')
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{build:'custom-build'},dependencies:{react:'^19.0.0'},devDependencies:{vite:'^8.0.0'}}))
  await writeFile(path.join(root,'index.html'),'custom host')
  const result = await plan(root)
  expect(result.anchors).toEqual({build:true,kit:true,index:false})
  await scaffold(result,{confirmed:true,install:false})
  expect(await readFile(path.join(root,'src/presentation-kit/Presentation.tsx'),'utf8')).toBe('custom kit')
  expect(await readFile(path.join(root,'index.html'),'utf8')).toBe('custom host')
  const pkg = JSON.parse(await readFile(path.join(root,'package.json'),'utf8'))
  expect(pkg.scripts.build).toBe('custom-build')
  expect(pkg.dependencies.motion).toBeTruthy()
  expect(await readFile(path.join(root,'src/presentations/index.ts'),'utf8')).toContain('how-to-make-a-presentation')
 } finally { await rm(root,{recursive:true,force:true}) }
})
