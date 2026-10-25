import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { EventEmitter } from 'node:events'
import { Router } from '../src/Router'
import { Landing } from '../src/Landing'
import { findPresentation, presentations, presentationRoutes } from '../src/presentations'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
// @ts-expect-error JavaScript tooling is exercised through its public interface.
import { detectAnchors, resolveTarget, scaffold, templateRoot } from '../skills/presentation/scaffold.mjs'
// @ts-expect-error JavaScript tooling is exercised through its public interface.
import { collisionWarnings, indistinct, attributionWarnings } from '../scripts/diagnostics.mjs'
// @ts-expect-error JavaScript tooling is exercised through its public interface.
import { REFERENCE_STEPS, REFERENCE_TITLE, validateReference } from '../scripts/reference.mjs'
// @ts-expect-error JavaScript tooling is exercised through its public interface.
import { browserErrors, HOST } from '../scripts/browser.mjs'

async function temp(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'and-scene-unit-'))
  try { await run(root) } finally { await rm(root, { recursive: true, force: true }) }
}
const pkg = { scripts: { build: 'custom-build' }, dependencies: { react: '19', vite: '8', typescript: '6' } }
it('I-23 anchor detection accepts cosmetic layout and partial anchors', async () => temp(async root => {
  expect(await detectAnchors(root)).toEqual({ build: false, kit: false, index: false })
  await writeFile(join(root, 'package.json'), JSON.stringify(pkg)); expect((await detectAnchors(root)).build).toBe(true)
  await mkdir(join(root, 'src'))
  await writeFile(join(root, 'src', 'differently-named.tsx'), 'export type Step = Scene; function Presentation(){}; const layoutId="present browse"; function useFitScale(){}; const entries=[{slug:"x",title:"X",load:()=>import("./X")}];')
  expect(await detectAnchors(root)).toEqual({ build: true, kit: true, index: true })
  const result = await scaffold(root, { install: false }); expect(result.created).toEqual([])
  expect(JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))).toEqual(pkg)
}))
it('I-23 partial scaffold preserves existing build and unrelated files', async () => temp(async root => {
  await writeFile(join(root, 'package.json'), JSON.stringify(pkg)); await writeFile(join(root, 'keep.txt'), 'preserve me')
  const result = await scaffold(root, { confirmed: true, install: false })
  expect(result.anchors).toEqual({ build: true, kit: false, index: false })
  expect(await readFile(join(root, 'keep.txt'), 'utf8')).toBe('preserve me')
  expect(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).scripts.build).toBe('custom-build')
  expect((await detectAnchors(root)).kit).toBe(true); expect((await detectAnchors(root)).index).toBe(true)
}))
it.each(['workspaces','pnpm','packages','apps'])('I-26 %s monorepo targets presentations without changing root', async signal => temp(async root => {
  if (signal === 'workspaces') await writeFile(join(root,'package.json'),JSON.stringify({ ...pkg, workspaces: ['packages/*'] }))
  else if (signal === 'pnpm') await writeFile(join(root,'pnpm-workspace.yaml'),'packages: []')
  else await mkdir(join(root,signal))
  expect(await resolveTarget(root)).toBe(join(root,'presentations'))
  await scaffold(root,{ confirmed:true, install:false })
  if (signal === 'workspaces') expect(JSON.parse(await readFile(join(root,'package.json'),'utf8')).scripts.build).toBe('custom-build')
}))
it('I-26 standalone root and existing app take precedence', async () => temp(async root => {
  expect(await resolveTarget(root)).toBe(root)
  await scaffold(root,{ install:false }); await mkdir(join(root,'apps'))
  expect(await resolveTarget(root)).toBe(root)
}))
it('I-27 non-empty scaffold requires confirmation and reports target without writes', async () => temp(async root => {
  await writeFile(join(root,'keep.txt'),'existing')
  await expect(scaffold(root,{ install:false })).rejects.toThrow(`confirmation required before scaffolding target: ${root}`)
  await expect(readFile(join(root,'package.json'))).rejects.toThrow()
}))
it('I-25 templates resolve from the skill location', () => {
  expect(templateRoot).toBe(resolve('skills/presentation/templates/bootstrap'))
})
it('I-28 registry routing preserves multiple entries and unknown route fallback', async () => {
  const entries = presentationRoutes([
    { slug: 'one', title: 'One', load: async () => ({ default: () => <h1>One route</h1> }) },
    { slug: 'two', title: 'Two', load: async () => ({ default: () => <h1>Two route</h1> }) },
  ])
  expect(findPresentation('/one',entries)?.slug).toBe('one'); expect(findPresentation('/two/',entries)?.slug).toBe('two'); expect(findPresentation('/unknown',entries)).toBeUndefined()
  const { rerender } = render(<Router path="/one" entries={entries} />); expect(await screen.findByText('One route')).toBeTruthy()
  rerender(<Router path="/two" entries={entries} />); expect(await screen.findByText('Two route')).toBeTruthy()
  rerender(<Router path="/unknown" entries={entries} />); expect(screen.getByText('Ideas, in motion.')).toBeTruthy()
})
it('I-28 landing enumerates explicit registry', () => {
  render(<Landing />)
  presentations.forEach(entry => expect(screen.getByRole('link',{name:entry.title}).getAttribute('href')).toBe(`/${entry.slug}`))
})
it('I-37 reference metadata matches all normative values', () => {
  expect(() => validateReference(STEPS,REFERENCE_TITLE)).not.toThrow(); expect(STEPS).toHaveLength(9)
})
it.each(['missing','count','order','title','caption','era'])('I-40 rejects %s reference fault', fault => {
  let actual = structuredClone(REFERENCE_STEPS)
  if (fault === 'missing') actual = undefined
  if (fault === 'count') actual.pop()
  if (fault === 'order') [actual[0],actual[1]] = [actual[1],actual[0]]
  if (['title','caption','era'].includes(fault)) actual[3][fault] = 'wrong'
  expect(() => validateReference(actual,REFERENCE_TITLE)).toThrow('sample:')
})
it('I-39 sample accumulates stable entities at fixed coordinates', () => {
  const SampleScene = STEPS[0].Scene
  const { container, rerender } = render(<SampleScene payload={1} />)
  const entities = new Map<string,Element>()
  for (let beat=1; beat<=9; beat++) {
    rerender(<SampleScene payload={beat} />)
    entities.forEach((element,id) => { expect(container.querySelector(`[data-presentation-entity="${id}"]`)).toBe(element) })
    container.querySelectorAll('[data-presentation-entity]').forEach(element => {
      const id = element.getAttribute('data-presentation-entity')!; entities.set(id,element)
    })
    const you = container.querySelector('[data-presentation-entity$=":you"]') as HTMLElement
    expect(you.style.left).toBe('40px'); expect(you.style.top).toBe('65px')
  }
  expect(entities.has('how-to-make-a-presentation:reveal')).toBe(true)
})
it('I-42 preview uses deterministic IPv4 host', () => expect(HOST).toBe('127.0.0.1'))
it('I-43 browser errors retain step attribution for console and page failures', () => {
  const page = new EventEmitter(), collector = browserErrors(page)
  collector.setStep(3); page.emit('console',{ type:()=> 'error',text:()=> 'broken' })
  collector.setStep(4); page.emit('pageerror',new Error('uncaught'))
  expect(collector.errors[0]).toContain('step 3 console.error: broken'); expect(collector.errors[1]).toContain('step 4 pageerror: uncaught')
  expect(() => collector.assertClean()).toThrow('browser:')
})
it('I-46 collision filtering respects visibility, ancestry and explicit exemptions', () => {
  const item = { id:1,ancestors:[],label:'first',visible:true,allowed:false,x:0,y:0,width:100,height:20 }
  const other = { ...item,id:2,label:'second',x:10 }
  expect(collisionWarnings([item,other])).toEqual(['overlap: first <> second'])
  for (const override of [{ visible:false },{ allowed:true },{ ancestors:[1] },{ x:200 }]) expect(collisionWarnings([item,{...other,...override}])).toEqual([])
})
it('I-47 active chrome diagnostic distinguishes meaningful style changes', () => {
  expect(indistinct({color:'red',fontWeight:'400'},{color:'red',fontWeight:'400'})).toBe(true)
  expect(indistinct({color:'red'},{color:'green'})).toBe(false); expect(indistinct(null,{})).toBe(false)
})
it('I-48 attribution diagnostics cover missing hidden undersized and browser defaults', () => {
  const good = {visible:true,fontSize:12,color:'rgb(100, 120, 110)',fontFamily:'Arial',textDecoration:'none'}
  expect(attributionWarnings(good)).toEqual([])
  for (const value of [null,{...good,visible:false},{...good,fontSize:8},{...good,color:'rgb(0, 0, 238)'},{...good,fontFamily:'"Times New Roman"',textDecoration:'underline'}]) expect(attributionWarnings(value).join(' ')).toContain('[data-presentation-attribution]')
})
it('I-38 each canonical beat adds the required scene intent', () => {
  const SampleScene = STEPS[0].Scene
  const { container, rerender } = render(<SampleScene payload={1} />)
  const expected = [
    ['you','prompt'], ['skill','conversation','question'], ['tray','card-0'], ['card-1','card-2','morph-0','morph-1'],
    ['ghost','depth'], ['kit'], ['verify','verify-link'], ['modify'], ['reveal'],
  ]
  expected.forEach((added,i) => {
    rerender(<SampleScene payload={i+1} />)
    for (const id of added) expect(container.querySelector(`[data-presentation-entity="how-to-make-a-presentation:${id}"]`)).toBeTruthy()
    if (i===2) expect(container.textContent).toContain('title · caption · visual')
    if (i===3) expect(container.querySelector('[data-presentation-entity$=":morph-0"]')?.textContent).toContain('morph')
    if (i===5) expect(container.querySelector('[data-presentation-entity$=":kit"]')?.textContent).toContain('shared scene kit')
    if (i===6) { const verify=container.querySelector('[data-presentation-entity$=":verify"]') as HTMLElement; expect(verify.style.top).toBe('210px'); expect(verify.textContent).toContain('build + render') }
    if (i===7) expect(container.querySelector('.edited')?.textContent).toContain('edited')
    if (i===8) expect(container.querySelector('[data-presentation-entity$=":reveal"]')?.textContent).toContain('This is the presentation.')
  })
})
async function seedAnchor(root: string, kind: string) {
  if (kind==='build') await writeFile(join(root,'package.json'),JSON.stringify(pkg))
  else {
    await mkdir(join(root,'src'),{recursive:true})
    const text=kind==='kit' ? 'export type Step = Scene; function Presentation(){}; const layoutId="present browse"; function useFitScale(){};' : 'const registry=[{slug:"existing",title:"Existing",load:()=>import("./Existing")}];'
    await writeFile(join(root,'src',`${kind}.tsx`),text)
  }
}
it.each(['build','kit','index'])('I-26 standalone with only %s anchor stays at root', async kind => temp(async root => {
  await seedAnchor(root,kind); expect(await resolveTarget(root)).toBe(root)
}))
it.each(['build','kit','index'])('I-26 monorepo with only %s anchor preserves root and scaffolds child', async kind => temp(async root => {
  await seedAnchor(root,kind); await mkdir(join(root,'apps'))
  const preservedFile=kind==='build'?'package.json':`src/${kind}.tsx`
  const before=await readFile(join(root,preservedFile),'utf8')
  expect(await resolveTarget(root)).toBe(join(root,'presentations'))
  const result=await scaffold(root,{confirmed:true,install:false})
  expect(result.target).toBe(join(root,'presentations')); expect(await readFile(join(root,preservedFile),'utf8')).toBe(before)
  expect(await detectAnchors(join(root,'presentations'))).toEqual({build:true,kit:true,index:true})
}))
it('I-26 complete monorepo root takes precedence over a complete child', async () => temp(async root => {
  await scaffold(root,{install:false}); await mkdir(join(root,'apps'))
  await mkdir(join(root,'presentations')); await scaffold(join(root,'presentations'),{install:false})
  expect(await resolveTarget(root)).toBe(root); expect((await scaffold(root,{install:false})).created).toEqual([])
}))
it('I-26 partial target app adds missing anchors without touching root or existing child build', async () => temp(async root => {
  const rootPackage=JSON.stringify({workspaces:['apps/*']}); await writeFile(join(root,'package.json'),rootPackage)
  const target=join(root,'presentations'); await mkdir(target); await seedAnchor(target,'build')
  const result=await scaffold(root,{confirmed:true,install:false}); expect(result.target).toBe(target)
  expect(result.anchors).toEqual({build:true,kit:false,index:false})
  expect(await readFile(join(root,'package.json'),'utf8')).toBe(rootPackage)
  expect(JSON.parse(await readFile(join(target,'package.json'),'utf8')).scripts.build).toBe('custom-build')
}))
