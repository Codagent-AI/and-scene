import { afterEach, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { STEPS, SampleScene } from '../src/presentations/how-to-make-a-presentation/steps'
import { REFERENCE } from '../scripts/reference.mjs'
import { presentations, resolvePresentation } from '../src/presentations'
import { Landing } from '../src/Landing'
afterEach(cleanup)
it('I-26 registry resolves all explicit entries and landing preserves every route', () => {
 render(<Landing />)
 for(const entry of presentations) { expect(resolvePresentation('/'+entry.slug)).toBe(entry);expect(document.querySelector(`a[href="/${entry.slug}"]`)).toBeTruthy() }
 expect(resolvePresentation('/unknown')).toBeUndefined(); expect(resolvePresentation('/')).toBeUndefined()
 expect(resolvePresentation('/how-to-make-a-presentation/')).toBe(presentations[0])
})
it('I-35 reference metadata has exactly nine normative eras titles and captions', () => {
 expect(STEPS.map(({era,title,caption})=>({era,title,caption}))).toEqual(REFERENCE.steps)
 expect(presentations[0].title).toBe(REFERENCE.title)
})
it('I-36 I-37 I-38 I-39 I-40 sample accumulates the specified entities without moving or replacing them', () => {
 const view=render(<SampleScene payload={STEPS[0].payload} />)
 const seen=new Map<string, {node:Element;left:string;top:string}>()
 const expected=[['you','prompt'],['skill','conversation','question'],['tray','card-1'],['card-2','morph-1','card-3','morph-2'],['ghost','depth'],['kit'],['verify','verify-link'],['modify','edited'],['reveal']]
 for(let i=0;i<9;i++) {
  view.rerender(<SampleScene payload={STEPS[i].payload} />)
  for(const id of expected[i])expect(document.querySelector(`[data-presentation-entity="sample:${id}"]`)).toBeTruthy()
  for(const [id,previous] of seen) {
   const node=document.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement
   expect(node).toBe(previous.node);expect(node.style.left).toBe(previous.left);expect(node.style.top).toBe(previous.top)
  }
  for(const node of document.querySelectorAll<HTMLElement>('[data-presentation-entity]'))seen.set(node.dataset.presentationEntity!,{node,left:node.style.left,top:node.style.top})
 }
 expect(document.querySelector('[data-presentation-entity="sample:tray"] [data-presentation-node="frame"]')).toBeNull()
 expect(document.querySelector('[data-presentation-entity="sample:verify"]')?.textContent).toContain('build + render')
 expect(document.querySelector('[data-presentation-entity="sample:reveal"]')?.textContent).toContain('You’re looking at one')
 expect(document.querySelector('[data-presentation-entity="sample:card-1"]')?.textContent).toContain('visual')
 expect(document.querySelector('[data-presentation-entity="sample:morph-1"]')?.textContent).toContain('morph')
})

const node=(id:string)=>document.querySelector<HTMLElement>(`[data-presentation-entity="sample:${id}"]`)!
function bounds(id:string) {
 const element=node(id),x=parseFloat(element.style.left),y=parseFloat(element.style.top)
 return {x,y,right:x+parseFloat(element.style.width),bottom:y+parseFloat(element.style.height)}
}
function pathOf(id:string) {return node(id).querySelector('path[marker-end]')!}
it('I-37 conversation arrow points both ways between participants with the question above',()=>{
 render(<SampleScene payload={{beat:2}}/>)
 const path=pathOf('conversation'),you=bounds('you'),skill=bounds('skill'),question=bounds('question')
 expect(path.getAttribute('marker-start')).not.toBeNull()
 expect(path.getAttribute('marker-start')).toBe(path.getAttribute('marker-end'))
 expect(node('conversation').querySelector('marker')?.getAttribute('orient')).toBe('auto-start-reverse')
 expect(path.getAttribute('d')).toBe('M 185 72 L 610 72')
 expect(you.right).toBeLessThan(185);expect(skill.x).toBeGreaterThan(610)
 expect(72).toBeGreaterThan(you.y);expect(72).toBeLessThan(you.bottom)
 expect(72).toBeGreaterThan(skill.y);expect(72).toBeLessThan(skill.bottom)
 expect(question.bottom).toBeLessThan(72)
 expect(node('prompt').textContent).toContain('a topic')
})
it('I-38 tray cards link morphs outside cards and depth docks beneath you with a dashed ghost',async()=>{
 render(<SampleScene payload={{beat:5}}/>)
 const tray=bounds('tray'),you=bounds('you'),depth=bounds('depth')
 for(const id of ['card-1','card-2','card-3','ghost']) {
  const card=bounds(id);expect(card.x).toBeGreaterThan(tray.x);expect(card.right).toBeLessThan(tray.right);expect(card.y).toBeGreaterThan(tray.y);expect(card.bottom).toBeLessThan(tray.bottom)
 }
 for(const [i,id] of ['morph-1','morph-2'].entries()) {
  const link=bounds(id);expect(link.x).toBeGreaterThanOrEqual(bounds(`card-${i+1}`).right);expect(link.right).toBeLessThanOrEqual(bounds(`card-${i+2}`).x)
  expect(node(`card-${i+1}`).contains(node(id))).toBe(false)
 }
 expect(depth.x).toBe(you.x);expect(depth.y-you.bottom).toBeGreaterThanOrEqual(0);expect(depth.y-you.bottom).toBeLessThanOrEqual(12)
 expect(node('depth').textContent).toBe('partial ↔ full')
 const css=await import('node:fs/promises').then(fs=>fs.readFile('src/presentations/how-to-make-a-presentation/presentation.css','utf8'))
 expect(css).toMatch(/\.ghost-card\s*\{[^}]*border:\s*1px dashed/)
})
it('I-39 kit attaches at the unframed tray bottom and verification chains after cards in the same row with a pass',async()=>{
 render(<SampleScene payload={{beat:7}}/>)
 const tray=bounds('tray'),kit=bounds('kit'),last=bounds('card-3'),verify=bounds('verify')
 expect(Math.abs(kit.y-tray.bottom)).toBeLessThanOrEqual(1);expect(kit.x).toBeGreaterThan(tray.x);expect(kit.right).toBeLessThan(tray.right)
 expect(node('kit').textContent).toContain('shared scene kit')
 expect(verify.x).toBeGreaterThan(last.right);expect(verify.y).toBeGreaterThanOrEqual(last.y);expect(verify.bottom).toBeLessThanOrEqual(last.bottom)
 expect(pathOf('verify-link').getAttribute('d')).toBe('M 625 225 L 648 225')
 expect(625).toBeGreaterThan(last.right);expect(648).toBeLessThan(verify.x)
 for(const box of [last,verify]){expect(225).toBeGreaterThan(box.y);expect(225).toBeLessThan(box.bottom)}
 expect(node('verify').textContent).toContain('build + render ✓');expect(node('verify').querySelector('svg')).toBeTruthy()
 const css=await import('node:fs/promises').then(fs=>fs.readFile('src/presentations/how-to-make-a-presentation/presentation.css','utf8'))
 expect(css).toMatch(/\.verify-node\s*\{[^}]*color:\s*#315b32/)
 const trayRule=css.match(/\.tray\s*\{([^}]*)\}/)![1];expect(trayRule).not.toMatch(/border\s*:|outline\s*:/)
})
it('I-40 modify arc reaches the edited card and the labeled reveal encloses the prior diagram',()=>{
 render(<SampleScene payload={{beat:9}}/>)
 const skill=bounds('skill'),edited=bounds('card-3'),flag=bounds('edited')
 expect(pathOf('modify').getAttribute('d')).toBe('M 702 114 C 826 118 827 327 588 329 Q 549 329 549 260')
 expect(702).toBeGreaterThan(skill.x);expect(702).toBeLessThan(skill.right);expect(114-skill.bottom).toBeLessThan(12)
 expect(549).toBeGreaterThan(edited.x);expect(549).toBeLessThan(edited.right);expect(260-edited.bottom).toBeLessThan(12)
 expect(flag.x).toBe(edited.x);expect(flag.bottom).toBeGreaterThanOrEqual(edited.y)
 const frame=bounds('reveal')
 for(const id of ['you','prompt','skill','question','tray','kit','verify','edited']) {
  const item=bounds(id);expect(frame.x).toBeLessThan(item.x);expect(frame.y).toBeLessThan(item.y);expect(frame.right).toBeGreaterThan(item.right);expect(frame.bottom).toBeGreaterThan(item.bottom)
 }
 expect(node('reveal').getAttribute('data-presentation-node')).toBe('frame');expect(node('reveal').textContent).toContain('You’re looking at one')
})
