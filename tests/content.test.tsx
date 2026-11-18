import { it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { entities, entitiesAt, entityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { Scene as StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'
import { reference } from '../scripts/reference.mjs'
import { assertReference } from '../scripts/verify.mjs'
import { Router } from '../src/Router'
import { Presentation } from '../src/presentation-kit'
import { scaffoldPlan, bootstrapDirectory } from '../skills/presentation/scaffold.mjs'
import { diagnose } from '../scripts/diagnostics.mjs'
it('I-21 scaffold planning selects only missing anchors', () => {
  for (const anchors of [{build:false,kit:false,index:false},{build:true,kit:false,index:false},{build:true,kit:true,index:true}]) {
    expect(scaffoldPlan({root:'/app',monorepo:false,anchors}).missing).toEqual(Object.keys(anchors).filter(k=>!anchors[k as keyof typeof anchors]))
  }
})
it('I-24 bootstrap paths are skill-relative independent of cwd', () => { expect(bootstrapDirectory).toBe(`${process.cwd()}/skills/presentation/templates/bootstrap`) })
it('I-25 scaffold targets standalone monorepo and existing apps', () => {
  const anchors={build:false,kit:false,index:false}
  expect(scaffoldPlan({root:'/project',monorepo:false,anchors}).target).toBe('/project')
  expect(scaffoldPlan({root:'/project',monorepo:true,anchors}).target).toBe('/project/presentations')
  expect(scaffoldPlan({root:'/project/app',monorepo:true,anchors:{build:true,kit:true,index:true}}).target).toBe('/project/app')
})
it('I-27 landing and unknown paths enumerate the explicit lazy registry', async () => {
  const view = render(<Router pathname="/" />); expect(screen.getByRole('link').getAttribute('href')).toBe('/how-to-make-a-presentation')
  view.rerender(<Router pathname="/unknown" />); expect(screen.getByText('Ideas, in motion.')).toBeTruthy()
  view.rerender(<Router pathname="/how-to-make-a-presentation" />); expect(await screen.findByText('You have a topic')).toBeTruthy()
})
it('I-31 generated sample captions and next previous follow evolving payloads', () => {
  render(<Presentation steps={steps} title="Sample" />)
  expect(screen.getByText(steps[0].caption)).toBeTruthy(); fireEvent.click(screen.getByLabelText('Next step')); expect(screen.getByText(steps[1].caption)).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Previous step')); expect(screen.getByText(steps[0].caption)).toBeTruthy()
})
it('I-35 canonical sample metadata matches all nine normative titles captions and eras', () => {
  expect(steps).toHaveLength(9); expect(steps.map(({title,caption})=>({title,caption}))).toEqual(reference)
  expect(steps.map(s=>s.era)).toEqual(['the ask','the ask','the gathering','the gathering','the gathering','the build','the build','the loop','the reveal'])
})
it('I-36 reference scene accumulates stable fixed entities and all normative scene intents', () => {
  expect(new Set(entities.map(e=>e.id)).size).toBe(entities.length)
  for(let i=1;i<9;i++) for(const old of entitiesAt(i-1)) expect(entitiesAt(i).find(e=>e.id===old.id)).toEqual(old)
  expect(entitiesAt(0).map(e=>e.id)).toEqual(['you','prompt'])
  expect(entitiesAt(1).map(e=>e.id)).toEqual(expect.arrayContaining(['skill','question','conversation']))
  expect(entitiesAt(2).map(e=>e.id)).toEqual(expect.arrayContaining(['tray','card-1']))
  expect(entitiesAt(3).map(e=>e.id)).toEqual(expect.arrayContaining(['card-2','card-3','morph-1','morph-2']))
  const get=(id:string)=>entities.find(e=>e.id===id)!
  expect(get('morph-1').x).toBeGreaterThan(get('card-1').x+get('card-1').w); expect(get('morph-1').x+get('morph-1').w).toBeLessThanOrEqual(get('card-2').x)
  expect(get('morph-2').x).toBeGreaterThan(get('card-2').x+get('card-2').w)
  expect(get('ghost').from).toBe(4); expect(get('depth').from).toBe(4)
  expect(get('scene-kit').y).toBe(get('tray').y+get('tray').h); expect(get('scene-kit').w).toBeLessThan(get('tray').w)
  expect(get('verify').y).toBe(get('card-1').y); expect(get('verify').from).toBe(6); expect(get('verify').text).toContain('✓')
  expect(get('modify').from).toBe(7); expect(get('edited').from).toBe(7); expect(get('reveal').from).toBe(8)
  expect(entities.every(e=>e.x>=0 && e.y>=0 && e.x+e.w<=880 && e.y+e.h<=380)).toBe(true)
  expect(steps.every(s=>s.Scene===steps[0].Scene && s.groupKey===steps[0].groupKey)).toBe(true)
  expect(entityId('you')).toBe('how-to-make-a-presentation:you')
  // The modification arc actually joins the conversation to the edited card.
  expect(get('modify').y).toBe(get('skill').y+get('skill').h)
  expect(get('modify').x+95).toBeGreaterThan(get('skill').x)
  expect(get('modify').x+95).toBeLessThan(get('skill').x+get('skill').w)
  expect(get('modify').x).toBe(get('edited').x+get('edited').w)
  render(<StoryScene payload={7} />)
  expect(document.querySelector('[data-modify-path]')?.getAttribute('d')).toBe('M95 0 C230 0 230 60 0 60')
})
it('I-37 sample validator rejects missing and out of order metadata', () => {
  expect(()=>assertReference([])).toThrow('nine'); expect(()=>assertReference([...reference].reverse())).toThrow('step 0')
  expect(()=>assertReference(reference.map((x,i)=>i?x:{...x,caption:'wrong'}))).toThrow('caption')
})
it('I-43 collisions warn with step elements and allow-overlap exempts subtrees', () => {
  const a={left:0,top:0,right:20,bottom:20,owner:'A',allowed:false},b={...a,owner:'B'}
  const common={active:[],attribution:{size:12,color:'green',decoration:'none'}}
  expect(diagnose({...common,text:[a,b]},2)).toEqual(['step 2: overlap A / B'])
  expect(diagnose({...common,text:[a,{...b,allowed:true}]},2)).toEqual([])
  expect(diagnose({...common,text:[a,{...b,left:21}]},2)).toEqual([])
})
it('I-44 active navigation warnings identify affected chrome only when indistinct', () => {
  const common={text:[],attribution:{size:12,color:'green',decoration:'none'}}
  expect(diagnose({...common,active:[{owner:'progress',current:'a',inactive:'a'},{owner:'toc',current:'a',inactive:'a'}]},1)).toEqual(['step 1: indistinct active progress','step 1: indistinct active toc'])
  expect(diagnose({...common,active:[{owner:'progress',current:'a',inactive:'b'}]},1)).toEqual([])
})
it('I-45 missing tiny and browser-default attribution warns with styling hook', () => {
  for(const attribution of [null,{size:8,color:'green',decoration:'none'},{size:16,color:'rgb(0, 0, 238)',decoration:'underline'}]) expect(diagnose({text:[],active:[],attribution},4)[0]).toContain('step 4: style [data-presentation-attribution]')
  expect(diagnose({text:[],active:[],attribution:{size:12,color:'green',decoration:'none'}},4)).toEqual([])
})
