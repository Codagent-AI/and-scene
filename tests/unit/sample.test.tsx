import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { Presentation } from '../../src/presentation-kit'
import { EvolvingScene, geometry, visibleEntities } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { entities } from '../../src/presentations/how-to-make-a-presentation/entities'
import reference from '../../scripts/reference.json'
import { presentations } from '../../src/presentations'
import { Router } from '../../src/Router'
const sample='src/presentations/how-to-make-a-presentation/'
function entity(id: string) { return document.querySelector(`[data-entity="${id}"]`) as HTMLElement }
describe('canonical sample',()=>{
 it('matches independently transcribed nine-step metadata',()=>{
  expect(STEPS.map(({id,era,title,caption})=>({id,era,title,caption}))).toEqual(reference.steps)
  expect(presentations[0].title).toBe(reference.title);expect(STEPS).toHaveLength(9)
 })
 it('accumulates actual retained DOM coordinates and content across every adjacent pair',()=>{
  const v=render(<EvolvingScene payload={{beat:1}}/>)
  for(let beat=2;beat<=9;beat++) {
   const before=Object.fromEntries(visibleEntities(beat-1).map(id=>[id,{node:entity(id),style:entity(id).getAttribute('style'),text:entity(id).textContent}]))
   v.rerender(<EvolvingScene payload={{beat}}/>)
   for(const [id,previous] of Object.entries(before)) {expect(entity(id)).toBe(previous.node);expect(entity(id).getAttribute('style')).toBe(previous.style); if(id!=='card2') expect(entity(id).textContent).toBe(previous.text);expect(visibleEntities(beat)).toContain(id)}
   expect(entity('you').style.top).toBe('64px');if(beat>=3)expect(geometry.tray.y).toBeGreaterThan(geometry.you.y+geometry.you.h)
  }
  expect(Object.values(entities).every(id=>id.startsWith('make-presentation:'))).toBe(true)
  expect(entity('you').closest('[data-presentation-appear]')).toBeNull()
 })
 it('introduces you prompt skill bidirectional connection and above-arrow question at the required beats',()=>{
  const v=render(<EvolvingScene payload={{beat:1}}/>);expect(entity('you')).toBeTruthy();expect(entity('prompt').textContent).toContain('topic');expect(entity('skill')).toBeNull()
  const you=entity('you');v.rerender(<EvolvingScene payload={{beat:2}}/>);expect(entity('you')).toBe(you);expect(entity('skill')).toBeTruthy();expect(entity('conversation').textContent).toContain('↔');expect(geometry.conversation.x).toBeGreaterThan(geometry.you.x+geometry.you.w);expect(geometry.conversation.x+geometry.conversation.w).toBeLessThan(geometry.skill.x);expect(geometry.question.y+geometry.question.h).toBeLessThan(geometry.conversation.y)
 })
 it('places title caption visual on cards and morph labels between growing cards',()=>{
  const v=render(<EvolvingScene payload={{beat:3}}/>);expect(entity('card1').textContent).toContain('title · caption · visual');expect(entity('card2')).toBeNull();const card=entity('card1');const before=card.getAttribute('style')
  v.rerender(<EvolvingScene payload={{beat:4}}/>);expect(entity('card1')).toBe(card);expect(card.getAttribute('style')).toBe(before)
  for(const id of ['card2','card3']) expect(entity(id).textContent).toContain('title · caption · visual')
  expect(entity('morph1').textContent).toContain('morph');expect(entity('card1').textContent).not.toContain('morph');expect(geometry.morph1.x).toBeGreaterThan(geometry.card1.x+geometry.card1.w);expect(geometry.morph1.x+geometry.morph1.w).toBeLessThan(geometry.card2.x)
 })
 it('docks partial-full control to you and socket to tray without a new tray frame',()=>{
  const v=render(<EvolvingScene payload={{beat:5}}/>);expect(entity('depth').textContent).toBe('partial ↔ full');expect(geometry.depth.x).toBe(geometry.you.x);expect(geometry.depth.y).toBe(geometry.you.y+geometry.you.h+5);expect(entity('ghost')).toBeTruthy();expect(entity('socket')).toBeNull()
  v.rerender(<EvolvingScene payload={{beat:6}}/>);expect(entity('socket').textContent).toContain('shared scene kit');expect(geometry.socket.y).toBeLessThan(geometry.tray.y+geometry.tray.h);expect(geometry.socket.y+geometry.socket.h).toBeGreaterThan(geometry.tray.y+geometry.tray.h);expect(document.querySelector('[data-presentation-frame]')).toBeNull()
  expect(readFileSync(sample+'presentation.css','utf8')).toMatch(/\.making \.ghost\s*\{[^}]*border: 1px dashed/)
 })
 it('chains same-row verification resolves build-render to green pass and adds modify flag',async()=>{
  const v=render(<EvolvingScene payload={{beat:7}}/>);expect(geometry.verify.y).toBe(geometry.card1.y);expect(geometry.verify.x).toBeGreaterThan(geometry.card3.x+geometry.card3.w);expect(entity('pipeline').textContent).toBe('→');expect(entity('verify').textContent).toContain('build + render')
  const pass=entity('verify').querySelector('.verify-pass') as HTMLElement
  await waitFor(()=>expect(Number(pass.style.opacity)).toBe(1),{timeout:2500});expect((entity('verify').querySelector('.verify-checks') as HTMLElement).style.opacity).toBe('0');expect(readFileSync(sample+'presentation.css','utf8')).toMatch(/\.making \.verify-pass\s*\{[^}]*color: #2d6f38/)
  v.rerender(<EvolvingScene payload={{beat:8}}/>);expect(entity('card2').querySelector('.edit-flag')!.textContent).toContain('edited');const arc=entity('modify').querySelector('path')!;expect(arc.getAttribute('d')).toContain('M230 0');expect(geometry.modify.y).toBeGreaterThan(geometry.conversation.y);expect(geometry.modify.y+geometry.modify.h).toBeGreaterThan(geometry.tray.y)
 })
 it('reveals enclosing labeled frame with motion entrance and retains prior entities',()=>{
  render(<EvolvingScene payload={{beat:9}}/>);const g=geometry.reveal
  for(const id of visibleEntities(8)) {expect(entity(id)).toBeTruthy();const r=geometry[id];expect(r.x).toBeGreaterThan(g.x);expect(r.y).toBeGreaterThan(g.y);expect(r.x+r.w).toBeLessThan(g.x+g.w);expect(r.y+r.h).toBeLessThan(g.y+g.h)}
  expect(entity('reveal').textContent).toContain('THIS IS ONE');expect(entity('reveal').style.opacity).toBe('0')
 })
})
describe('registry routing and styling contracts',()=>{
 it('maps explicit registry entries to existing Talk files and lazy routes',async()=>{
  for(const entry of presentations) {expect(readFileSync(`src/presentations/${entry.slug}/Talk.tsx`,'utf8')).toContain('Presentation');expect((await entry.load()).default).toBeTypeOf('function')}
  expect(readFileSync('src/presentations/index.ts','utf8')).not.toContain('import.meta.glob')
 })
 it('renders landing unknown and multiple lazy routes preserving old entries after append',async()=>{
  const old=presentations.map(e=>({...e}));const extra={slug:'second',title:'Second',load:async()=>({default:()=> <p>second scene</p>})};const entries=[...presentations,extra]
  const v=render(<Router entries={entries} path="/"/>);expect(screen.getByText('Second')).toBeTruthy();expect(screen.getByText(reference.title)).toBeTruthy()
  v.rerender(<Router entries={entries} path="/missing"/>);expect(screen.getByText('Second')).toBeTruthy()
  for(const e of entries) {v.rerender(<Router entries={entries} path={`/${e.slug}`}/>);if(e.slug==='second')await screen.findByText('second scene');else await screen.findByRole('main',{name:reference.title})}
  expect(presentations).toEqual(old);expect(entries.slice(0,-1)).toEqual(old)
 })
 it('keeps kit style-neutral with no external visual defaults or framework coupling',()=>{
  function sources(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?sources(path.join(dir,e.name)):[path.join(dir,e.name)])}
  const files=sources('src/presentation-kit').filter(f=>!f.endsWith('type-contract.tsx'))
  for(const f of files){const s=readFileSync(f,'utf8');expect(s).not.toMatch(/#[a-f\d]{3,8}\b|(?:background|color|fontFamily|fontSize|borderRadius|boxShadow|textShadow)\s*:/i);expect(s).not.toMatch(/import\s+['"].*\.css|tailwind|presentations\//i)}
  const deps=readFileSync('package.json','utf8')+readFileSync('vite.config.ts','utf8');expect(deps).not.toMatch(/tailwind|bootstrap|material-ui/)
  expect(readFileSync('tsconfig.app.json','utf8')).toContain('"src"')
 })
 it('styles active navigation and attribution locally with effective declarations',()=>{
  const css=readFileSync(sample+'presentation.css','utf8');expect(css).toMatch(/\[data-presentation-progress\]\[data-presentation-active\]\s*\{[^}]*background: #365d40; color: #fff/);expect(css).toMatch(/\[data-presentation-toc-entry\]\[data-presentation-active\]\s*\{[^}]*font-weight: 700/);expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size: 12px; color: #596b55; text-decoration: none/)
 })
 it('public step hooks track the rendered active caption and diagram',()=>{
  render(<Presentation steps={STEPS} title={reference.title}/>);for(let i=0;i<9;i++){expect(document.querySelector('main')!.getAttribute('data-step-index')).toBe(String(i));expect(document.querySelector('main')!.getAttribute('data-step-count')).toBe('9');expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe(reference.steps[i].caption);if(i<8)fireEvent.keyDown(window,{key:'ArrowRight'})}
 })
})
