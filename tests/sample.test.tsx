import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { motion } from 'motion/react'
import { sceneState } from '../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { presentations } from '../src/presentations'
import { Router } from '../src/Router'
import { resolveRoute } from '../src/routing'
import { validateOutline } from '../scripts/verify.mjs'
import reference from '../scripts/reference.json'
describe('sample and registry contracts', () => {
  it('I-26 explicit lazy registry landing routes and unknown fallback', async () => {
    expect(presentations[0].slug).toBe(reference.slug)
    expect(resolveRoute('/'+reference.slug)?.load).toBe(presentations[0].load)
    expect(resolveRoute('/'+reference.slug+'/')?.slug).toBe(reference.slug)
    expect(resolveRoute('/unknown')).toBeUndefined()
    expect(resolveRoute('/other',[...presentations,{slug:'other',title:'Other',load:presentations[0].load}])?.title).toBe('Other')
    const { rerender }=render(<Router pathname="/" />)
    expect(screen.getByRole('link',{name:/How to Use This Skill/}).getAttribute('href')).toBe('/'+reference.slug)
    rerender(<Router pathname="/unknown" />);expect(screen.getByRole('heading').textContent).toBe('Ideas, in motion.')
    const loaded=await presentations[0].load();expect(typeof loaded.default).toBe('function')
  })
  it('I-33 exact outline rejects missing malformed and reordered samples', () => {
    expect(()=>validateOutline(STEPS,reference.steps)).not.toThrow()
    expect(()=>validateOutline([],reference.steps)).toThrow('Expected 9')
    for(const field of ['title','caption','era']) expect(()=>validateOutline([{...reference.steps[0],[field]:'wrong'},...reference.steps.slice(1)],reference.steps)).toThrow(field)
    expect(()=>validateOutline([STEPS[1],STEPS[0],...STEPS.slice(2)],reference.steps)).toThrow('step 0')
    expect(new Set(STEPS.map(s=>s.id)).size).toBe(9)
  })
  it('I-34 first beat has you and prompt', () => {
    expect(sceneState(1).map(e=>e.id)).toEqual(['how-to:you','how-to:prompt'])
  })
  it('I-35 interview adds skill bidirectional link and question above', () => {
    const state=sceneState(2),get=(id:string)=>state.find(e=>e.id===`how-to:${id}`)!
    expect(get('conversation').text).toBe('↔');expect(get('question').y).toBeLessThan(get('conversation').y)
    expect(get('skill').x).toBeGreaterThan(get('you').x)
  })
  it('I-36 tray card parts and morph annotations live on links', () => {
    render(<StoryScene payload={{beat:4}} step={STEPS[3]} />)
    const cards=document.querySelectorAll('.card')
    for(const card of cards) { expect(card.textContent).toContain('titlecaptionvisual');expect(card.textContent).not.toContain('morphs') }
    expect(document.querySelectorAll('.link').length).toBe(2);expect(sceneState(3).some(e=>e.kind==='tray')).toBe(true)
  })
  it('I-37 I-42 accumulated entities never rearrange and stay within canvas', () => {
    for(let beat=2;beat<=9;beat++) {
      const before=sceneState(beat-1),after=sceneState(beat)
      for(const entity of before) expect(after.find(e=>e.id===entity.id)).toEqual(entity)
      for(const entity of after) { expect(entity.x).toBeGreaterThanOrEqual(0);expect(entity.x+entity.w).toBeLessThanOrEqual(880);expect(entity.y+entity.h).toBeLessThanOrEqual(380) }
    }
    expect(STEPS.every(s=>s.Scene===STEPS[0].Scene&&s.groupKey===STEPS[0].groupKey)).toBe(true)
  })
  it('I-38 depth docks to you and ghost marks unspecified steps', () => {
    const state=sceneState(5),you=state.find(e=>e.id==='how-to:you')!,depth=state.find(e=>e.id==='how-to:depth')!
    expect(depth.x).toBe(you.x);expect(depth.y).toBeGreaterThan(you.y)
    expect(depth.text).toBe('partial ↔ full');expect(state.find(e=>e.kind==='ghost')?.text).toBe('…')
  })
  it('I-39 scene kit socket attaches at unframed tray bottom', () => {
    const state=sceneState(6),socket=state.find(e=>e.kind==='socket')!,tray=state.find(e=>e.kind==='tray')!
    expect(socket.y).toBe(tray.y+tray.h);expect(socket.text).toContain('shared scene kit');expect(state.some(e=>e.kind==='frame')).toBe(false)
  })
  it('I-40 verification is chained in row with build render and pass', () => {
    const state=sceneState(7),node=state.find(e=>e.kind==='verify')!,card=state.find(e=>e.kind==='card')!
    expect(node.y).toBe(card.y);expect(node.x).toBeGreaterThan(state.find(e=>e.kind==='ghost')!.x)
    render(<StoryScene payload={{beat:7}} step={STEPS[6]} />)
    expect(screen.getByText('build + render')).toBeTruthy();expect(screen.getByText('✓ pass')).toBeTruthy()
  })
  it('I-41 modify arc flags an existing card', () => {
    render(<StoryScene payload={{beat:8}} step={STEPS[7]} />)
    expect(document.querySelector('.modify svg path')?.getAttribute('d')).toContain('Q')
    expect(document.querySelector('.card.edited')?.textContent).toContain('02titlecaptionvisualedited')
    expect(sceneState(8).find(e=>e.kind==='modify')?.y).toBeLessThan(sceneState(8).find(e=>e.kind==='card')!.y)
  })
  it('I-42 final frame encloses prior diagram and reveals output', () => {
    const state=sceneState(9),frame=state.find(e=>e.kind==='frame')!
    for(const e of sceneState(8)) {expect(e.x).toBeGreaterThan(frame.x);expect(e.y).toBeGreaterThan(frame.y);expect(e.x+e.w).toBeLessThan(frame.x+frame.w);expect(e.y+e.h).toBeLessThan(frame.y+frame.h)}
    expect(frame.text).toBe('THIS IS THE OUTPUT.')
  })
  it('I-7 coordinate-heavy raw motion is composable alongside kit', () => {
    render(<motion.div layoutId="raw:identity" style={{position:'absolute',left:230,top:100}}>Raw author shape</motion.div>)
    expect(screen.getByText('Raw author shape').style.left).toBe('230px')
  })
})
