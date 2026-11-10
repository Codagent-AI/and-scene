import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { STEPS, SampleScene } from '../src/presentations/how-to-make-a-presentation/steps'
import { diagram, entity } from '../src/presentations/how-to-make-a-presentation/entities'
import { presentations, resolvePresentation } from '../src/presentations'
import expected from '../scripts/reference-outline.json'
it('I-9 registry resolution preserves explicit entries, landing and unknown fallback', () => {
 const before=[...presentations]
 const added=[...presentations,{ slug:'other',title:'Other',load:presentations[0].load }]
 expect(added.slice(0,-1)).toEqual(before)
 expect(new Set(added.map(p=>p.slug)).size).toBe(added.length)
 expect(resolvePresentation('/how-to-make-a-presentation/')).toBe(presentations[0])
 expect(resolvePresentation('/unknown')).toBeUndefined();expect(resolvePresentation('/')).toBeUndefined()
})
it('I-30 exact nine-step normative metadata and route', () => {
 expect(STEPS.map(({id,era,title,caption})=>({id,era,title,caption}))).toEqual(expected)
 expect(STEPS).toHaveLength(9)
 expect(presentations[0].title).toBe('How to Use This Skill to Make a Presentation')
})
it('I-31 accumulation keeps every continuing ID and coordinate in one group', () => {
 for(let beat=2;beat<=9;beat++) {
  for(const old of diagram(beat-1)) expect(diagram(beat).find(x=>x.id===old.id)).toEqual(old)
 }
 expect(new Set(STEPS.map(s=>s.groupKey)).size).toBe(1)
 expect(new Set(STEPS.map(s=>s.Scene)).size).toBe(1)
})
it('I-32 opening conversation adds you prompt skill arrow question above', () => {
 expect(diagram(1).map(x=>x.id)).toEqual(['you','prompt'])
 const two=diagram(2)
 expect(two.find(x=>x.id==='conversation')!.text).toBe('⟷')
 expect(two.find(x=>x.id==='question')!.y).toBeLessThan(two.find(x=>x.id==='conversation')!.y)
 expect(two.find(x=>x.id==='skill')).toBeTruthy()
 const {container}=render(<SampleScene payload={{beat:2}} />)
 expect(container.querySelector(`[data-presentation-entity="${entity('question')}"]`)!.textContent).toBe('one question at a time')
})
it('I-33 cards accumulate with fields and morph labels on links', () => {
 expect(diagram(3).filter(x=>x.kind==='card')).toHaveLength(1)
 const four=diagram(4)
 expect(four.filter(x=>x.kind==='card')).toHaveLength(3)
 four.filter(x=>x.kind==='card').forEach(x=> {expect(x.detail).toBe('title · caption · visual');expect(x.text).not.toContain('morph')})
 expect(four.filter(x=>x.kind==='link').map(x=>x.text)).toEqual(['morph →','morph →'])
 expect(four.find(x=>x.id==='tray')!.y).toBeGreaterThan(four.find(x=>x.id==='you')!.y)
})
it('I-34 ghost card and depth control docked on you', () => {
 const five=diagram(5),depth=five.find(x=>x.id==='depth')!,you=five.find(x=>x.id==='you')!
 expect(five.find(x=>x.id==='ghost')!.kind).toBe('ghost')
 expect(depth.text).toBe('partial ⟷ full');expect(depth.x).toBe(you.x);expect(depth.y).toBeGreaterThanOrEqual(you.y+you.h)
})
it('I-35 labeled scene kit socket at unframed tray bottom', () => {
 const six=diagram(6),kit=six.find(x=>x.id==='kit')!,tray=six.find(x=>x.id==='tray')!
 expect(kit.y).toBe(tray.y+tray.h);expect(kit.text).toContain('shared scene kit')
 const {container}=render(<SampleScene payload={{beat:6}} />)
 expect(container.querySelector('[data-presentation-node="frame"]')).toBeNull()
})
it('I-36 verify follows cards in tray with build render pass', () => {
 const seven=diagram(7),verify=seven.find(x=>x.id==='verify')!,card=seven.find(x=>x.id==='card-3')!,tray=seven.find(x=>x.id==='tray')!
 expect(verify.y).toBe(card.y);expect(verify.x).toBeGreaterThan(card.x+card.w)
 expect(verify.x+verify.w).toBeLessThan(tray.x+tray.w)
 expect(verify.text).toBe('✓ pass');expect(verify.detail).toBe('build + render')
})
it('I-37 modify reaches edited card and final reveal surrounds retained diagram', () => {
 const {container,rerender}=render(<SampleScene payload={{beat:8}} />)
 expect(container.querySelector('[data-edited="true"]')!.getAttribute('data-presentation-entity')).toBe(entity('card-2'))
 expect(container.querySelector('.modify-arc path')!.getAttribute('d')).toBe('M 605 142 Q 605 173 386 174 L 386 190')
 rerender(<SampleScene payload={{beat:9}} />)
 const frame=diagram(9).find(x=>x.id==='reveal')!
 for(const e of diagram(8)){expect(e.x).toBeGreaterThan(frame.x);expect(e.x+e.w).toBeLessThan(frame.x+frame.w);expect(e.y+e.h).toBeLessThan(frame.y+frame.h)}
 expect(container.querySelector('[data-presentation-node="frame"]')!.textContent).toContain('YOU’RE LOOKING AT ONE')
})
