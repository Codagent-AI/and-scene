import { it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneRect } from '../src/presentations/how-to-make-a-presentation/entities'
import { entities, entitiesAt, entityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { Scene as StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'
import { reference } from '../scripts/reference.mjs'
import { assertReference } from '../scripts/verify.mjs'
import { Router } from '../src/Router'
import { Presentation } from '../src/presentation-kit'
import { scaffoldPlan, bootstrapDirectory, detectMonorepo } from '../skills/presentation/scaffold.mjs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import TemplateTalk from '../.test-work/contracts/src/presentations/template-contract/Talk'
import { steps as templateSteps } from '../.test-work/contracts/src/presentations/template-contract/steps'
import { readFileSync } from 'node:fs'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { diagnose } from '../scripts/diagnostics.mjs'
it('I-21 scaffold planning selects only missing anchors', () => {
  for (const anchors of [{build:false,kit:false,index:false},{build:true,kit:false,index:false},{build:true,kit:true,index:true}]) {
    expect(scaffoldPlan({root:'/app',monorepo:false,anchors}).missing).toEqual(Object.keys(anchors).filter(k=>!anchors[k as keyof typeof anchors]))
  }
  expect(scaffoldPlan({ root:'/mono', project:{packageJSON:{workspaces:['apps/*']}}, anchors:{build:true,kit:false,index:false} })).toEqual({target:'/mono/presentations',missing:['build','kit','index']})
  expect(scaffoldPlan({ root:'/mono', monorepo:true, anchors:{build:true}, childAnchors:{build:true} }).missing).toEqual(['kit','index'])
})
it('I-24 bootstrap path is anchored to the skill module rather than process cwd', () => { expect(bootstrapDirectory).toBe(resolve(dirname(fileURLToPath(import.meta.url)), '../skills/presentation/templates/bootstrap')) })
it('I-25 scaffold targets standalone monorepo and existing apps', () => {
  const anchors={build:false,kit:false,index:false}
  expect(scaffoldPlan({root:'/project',monorepo:false,anchors}).target).toBe('/project')
  expect(scaffoldPlan({root:'/project',monorepo:true,anchors}).target).toBe('/project/presentations')
  expect(scaffoldPlan({root:'/project/app',monorepo:true,anchors:{build:true,kit:true,index:true}}).target).toBe('/project/app')
  for (const project of [{packageJSON:{workspaces:['apps/*']}},{packageJSON:{workspaces:{packages:['packages/*']}}},{entries:['pnpm-workspace.yaml']},{entries:['packages']},{entries:['apps']}]) {
    expect(detectMonorepo(project)).toBe(true)
    expect(scaffoldPlan({root:'/project',project,anchors:{build:true,kit:false,index:false}})).toEqual({target:'/project/presentations',missing:['build','kit','index']})
  }
  expect(detectMonorepo({packageJSON:{},entries:['src']})).toBe(false)
})
it('I-27 landing and unknown paths enumerate the explicit lazy registry', async () => {
  const view = render(<Router pathname="/" />); expect(screen.getByRole('link').getAttribute('href')).toBe('/how-to-make-a-presentation')
  view.rerender(<Router pathname="/unknown" />); expect(screen.getByText('Ideas, in motion.')).toBeTruthy()
  view.rerender(<Router pathname="/how-to-make-a-presentation" />); expect(await screen.findByText('You have a topic')).toBeTruthy()
})
it('I-31 materialized presentation templates render captions navigation and stable typed scenes', () => {
  const view = render(<TemplateTalk />)
  expect(screen.getByText(templateSteps[0].caption)).toBeTruthy()
  expect(screen.getByLabelText('Next step').hasAttribute('disabled')).toBe(true)
  expect(screen.getByLabelText('Previous step').hasAttribute('disabled')).toBe(true)
  view.unmount()
  const expanded = [...templateSteps, { ...templateSteps[0], id:'next', title:'Next beat', caption:'The next paragraph.', payload:{label:'Next idea'} }]
  render(<Presentation steps={expanded} title="Template contract" />)
  const node = document.querySelector('[data-presentation-node]')!
  fireEvent.click(screen.getByLabelText('Next step'))
  expect(screen.getByText('The next paragraph.')).toBeTruthy()
  expect(screen.getByText('Next idea')).toBe(node)
  expect(document.querySelector('[data-presentation-node]')).toBe(node)
  fireEvent.click(screen.getByLabelText('Previous step'))
  expect(screen.getByText(templateSteps[0].caption)).toBeTruthy()
  expect(node.textContent).toBe(templateSteps[0].payload.label)
  expect(document.querySelector('[data-presentation-node]')).toBe(node)
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
  expect(get('modify').x+65).toBeGreaterThan(get('skill').x)
  expect(get('modify').x+65).toBeLessThan(get('skill').x+get('skill').w)
  expect(get('modify').x).toBe(get('edited').x+get('edited').w)
  render(<StoryScene payload={7} />)
  expect(document.querySelector('[data-modify-path]')?.getAttribute('d')).toBe('M65 0 C270 0 270 14 0 14')
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

function withStoryStyles(check: () => void) {
  const stylesheet = document.createElement('style')
  stylesheet.textContent = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/presentations/how-to-make-a-presentation/presentation.css'), 'utf8')
  document.head.append(stylesheet)
  try { check() } finally { stylesheet.remove() }
}
it('F-001 reference labels stay readable at phone fit scale without scene reflow', () => withStoryStyles(() => {
    const view = render(<div className="skill-story"><StoryScene payload={4} /></div>)
    for (const beat of [4, 8]) {
      view.rerender(<div className="skill-story"><StoryScene payload={beat} /></div>)
      const layer = document.querySelector('[data-presentation-layer]')!
      const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT)
      const scale = fitScale(390, 844, 'browse')
      let labels = 0
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent!.trim()
        if (!text) continue
        const element = walker.currentNode.parentElement!
        const effectiveSize = parseFloat(getComputedStyle(element).fontSize) * scale
        expect(effectiveSize, `beat ${beat + 1}: ${text}`).toBeGreaterThanOrEqual(12)
        labels++
      }
      expect(labels).toBeGreaterThan(15)
      for (const card of layer.querySelectorAll('[data-presentation-node="box"].entity-card')) {
        expect(Array.from(card.querySelectorAll('span')).map(el => el.textContent)).toEqual(['Title', 'Caption', 'Visual'])
      }
    }
    // Geometry is the same fixed model at either viewport; earlier entities
    // retain their coordinates and identities as the later beats accumulate.
    expect(entitiesAt(4).every(e => entitiesAt(8).includes(e))).toBe(true)
    expect(entities.every(e => e.x >= 0 && e.y >= 0 && e.x + e.w <= 880 && e.y + e.h <= 380)).toBe(true)
}))

it('F-002 reference label bands and card budgets prevent cross-entity crowding', () => withStoryStyles(() => {
  render(<div className="skill-story"><StoryScene payload={8} /></div>)
  const row = entities.filter(e => ['card', 'ghost', 'verify'].includes(e.kind))
  const rowBottom = Math.max(...row.map(e => e.y + e.h))
  const socket = entities.find(e => e.id === 'scene-kit')!
  const overlaps = (a: SceneRect, b: SceneRect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  for (const card of row.filter(e => e.kind !== 'ghost')) {
    const node = document.querySelector(`[data-entity="${card.id}"]`)!
    const css = getComputedStyle(node)
    const available = card.w - [css.paddingLeft, css.paddingRight, css.borderLeftWidth, css.borderRightWidth].reduce((sum, v) => sum + parseFloat(v), 0)
    // With 32px type, the seven-letter card part needs breathing room;
    // the verify words also need substantially more space than before.
    expect(available, card.id).toBeGreaterThanOrEqual(card.kind === 'card' ? 140 : 120)
  }
  const links = entities.filter(e => e.kind === 'morph')
  for (const link of links) {
    const label = link.labelRect!
    expect(label).toBeDefined()
    expect(label.y - rowBottom).toBeGreaterThanOrEqual(8)
    expect(label.x + label.w / 2).toBe(link.x + link.w / 2)
    for (const body of [...row, socket]) expect(overlaps(label, body), `${link.id} / ${body.id}`).toBe(false)
    const node = document.querySelector(`[data-entity="${link.id}"]`)!
    const text = node.querySelector('small')!
    expect(text.textContent).toBe('morph')
    expect(text.style.left).toBe(`${label.x - link.x}px`)
    expect(text.style.top).toBe(`${label.y - link.y}px`)
    expect(text.style.width).toBe(`${label.w}px`)
    expect(node.querySelector('[data-morph-link]')).toBeTruthy()
  }
  expect(overlaps(links[0].labelRect!, links[1].labelRect!)).toBe(false)
  expect(socket.y - rowBottom).toBeGreaterThanOrEqual(24)
  const reveal = document.querySelector('[data-entity="reveal"] span')!
  expect(getComputedStyle(reveal).top).toBe('4px')
  const edited = entities.find(e => e.id === 'edited')!
  const target = entities.find(e => e.id === 'card-3')!
  expect(edited.x + edited.w / 2).toBe(target.x + target.w / 2)
}))
