import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { nodes, entity } from '../src/presentations/how-to-make-a-presentation/entities'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
afterEach(cleanup)
describe('reference scene', () => {
  it('I-33 conversation accumulates from you and prompt to skill and question', () => {
    const {container,rerender}=render(<Scene payload={1} stepIndex={0}/> )
    expect(container.querySelector('[data-entity="you"]')).toBeTruthy()
    expect(container.querySelector('[data-entity="prompt"]')).toBeTruthy()
    expect(container.querySelector('[data-entity="skill"]')).toBeNull()
    const you=container.querySelector('[data-entity="you"]')
    rerender(<Scene payload={2} stepIndex={1}/>)
    expect(container.querySelector('[data-entity="you"]')).toBe(you)
    expect(container.querySelector('[data-entity="question"]')).toBeTruthy()
    expect(container.querySelector('.conversation-line')?.textContent).toContain('←')
    expect(nodes.find(n=>n.name==='question')!.y).toBeLessThan(nodes.find(n=>n.name==='skill')!.y)
  })
  it('I-34 tray and cards show their parts and links own morph labels',()=>{
    const {container}=render(<Scene payload={4} stepIndex={3}/>)
    expect(container.querySelectorAll('.card')).toHaveLength(3)
    expect(container.querySelectorAll('.card small')[0].textContent).toBe('title · caption · visual')
    expect(container.querySelector('.card')?.textContent).not.toContain('morphs')
    expect(container.querySelector('.card-links')?.textContent).toContain('morphs')
    expect(container.querySelector('[data-entity="tray"]')).toBeTruthy()
  })
  it('I-35 ghost depth and socket dock at fixed positions without tray framing',()=>{
    const {container}=render(<Scene payload={6} stepIndex={5}/>)
    for(const name of ['ghost','depth','scene-kit']) expect(container.querySelector(`[data-entity="${name}"]`)).toBeTruthy()
    const tray=nodes.find(n=>n.name==='tray')!,socket=nodes.find(n=>n.name==='scene-kit')!
    expect(socket.y).toBe(tray.y+tray.h)
    expect(container.querySelector('[data-entity="tray"]')?.className).not.toContain('frame')
  })
  it('I-36 verification follows cards and modification flags the edited card',()=>{
    const {container}=render(<Scene payload={8} stepIndex={7}/>)
    expect(container.querySelector('[data-entity="verify"]')?.textContent).toContain('build + render')
    expect(nodes.find(n=>n.name==='verify')!.x).toBeGreaterThan(nodes.find(n=>n.name==='card-3')!.x)
    expect(nodes.find(n=>n.name==='verify')!.y).toBe(nodes.find(n=>n.name==='card-3')!.y)
    expect(container.querySelector('.modify-arc path')).toBeTruthy()
    expect(container.querySelector('[data-entity="card-2"] .edited')).toBeTruthy()
  })
  it('I-37 all nine beats preserve existing entity instances and coordinates and reveal surrounds them',()=>{
    const {container,rerender}=render(<Scene payload={1} stepIndex={0}/>)
    const previous=new Map<string,{element:Element,style:string|null}>()
    for(let beat=1;beat<=9;beat++) {
      rerender(<Scene payload={beat} stepIndex={beat-1}/>)
      for(const n of nodes.filter(n=>n.at<=beat)) {
        const element=container.querySelector(`[data-entity="${n.name}"]`)!
        const old=previous.get(n.name)
        if(old) {expect(element).toBe(old.element);expect(element.getAttribute('style')).toBe(old.style)}
        previous.set(n.name,{element,style:element.getAttribute('style')})
        expect(entity(n.name)).toContain('how-to-make-a-presentation:')
      }
    }
    expect(container.querySelector('.reveal')?.textContent).toContain('THIS PRESENTATION IS THE EXAMPLE')
    expect(STEPS).toHaveLength(9)
    expect(new Set(STEPS.map(s=>s.groupKey)).size).toBe(1)
  })
})
