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
