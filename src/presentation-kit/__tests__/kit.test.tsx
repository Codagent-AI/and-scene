import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { useEffect } from 'react'
import { Appear } from '../nodes/Appear'
import { Presentation } from '../Presentation'
import { computeFitScale } from '../useFitScale'
import { DESIGN_H, DESIGN_W } from '../constants'
import { isInteractiveTarget } from '../usePresentationNav'
import type { SceneProps, Step } from '../types'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function Scene({ payload }: SceneProps<{ text: string }>) { return <div>{payload.text}</div> }
const steps: Step<{text:string}>[] = [
 {id:'a',era:'start',title:'First',caption:'Intro',Scene,payload:{text:'one'},groupKey:'same'},
 {id:'b',era:'start',title:'Second',caption:'More',Scene,payload:{text:'two'},groupKey:'same'},
 {id:'c',era:'end',title:'Third',caption:'Done',Scene,payload:{text:'three'}},
]

afterEach(cleanup)

describe('presentation kit', () => {
 it('derives index, exposes active state and jumps to era start', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" attribution={false}/>);
  expect(screen.getByText('one')).toBeTruthy(); expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  fireEvent.click(screen.getByText('end')); expect(screen.getByText('three')).toBeTruthy(); expect(document.querySelector('[data-step-index="2"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-toc-entry][aria-current="true"]')).toBeTruthy()
 })
 it('switches browse and present while preserving position and chrome visibility', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" attribution={false}/>);
  fireEvent.keyDown(window,{key:'ArrowRight'}); expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.click(screen.getAllByLabelText('Toggle presentation mode')[0]!); expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
  expect(screen.queryByText('More')).toBeNull(); expect(screen.getByText('Second')).toBeTruthy()
 })
 it('shows the table of contents only on wide browse viewports and reacts to resize', () => {
  const originalWidth = window.innerWidth
  window.innerWidth = 1024
  render(<Presentation steps={steps} title="Demo" initialMode="browse" attribution={false}/>)
  expect(document.querySelector('[data-presentation-toc]')).toBeTruthy()
  window.innerWidth = 600
  fireEvent(window, new Event('resize'))
  expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  window.innerWidth = originalWidth
 })
 it('clamps boundaries, ignores controls, and handles horizontal swipes', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="present" attribution={false}/>);
  fireEvent.keyDown(window,{key:'ArrowLeft'}); expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  const button=screen.getByLabelText('Toggle presentation mode'); button.focus(); fireEvent.keyDown(button,{key:'ArrowRight'}); expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  fireEvent.touchStart(screen.getByText('one').parentElement!.parentElement!,{changedTouches:[{clientX:200}]}); fireEvent.touchEnd(screen.getByText('one').parentElement!.parentElement!,{changedTouches:[{clientX:100}]});
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.keyDown(window,{key:'ArrowRight'}); fireEvent.keyDown(window,{key:'ArrowRight'}); expect(document.querySelector('[data-step-index="2"]')).toBeTruthy()
 })
 it('keeps grouped scene mounted and remounts an ungrouped scene', () => {
  let mounts=0; function Count({payload}:SceneProps<{text:string}>){ useEffect(()=>{mounts++},[]); return <div>{payload.text}</div> }
  const local=steps.map(s=>({...s,Scene:Count}))
  const view=render(<Presentation steps={local} title="x" initialMode="present" attribution={false}/>); fireEvent.keyDown(window,{key:'ArrowRight'}); expect(mounts).toBe(1)
  fireEvent.keyDown(window,{key:'ArrowRight'}); expect(mounts).toBe(2); view.unmount(); cleanup()
 })
 it('does not wrap continuing entities in newcomer Appear', () => { const {container}=render(<Appear isNew={false}><span>persist</span></Appear>); expect(container.querySelector('[data-presentation-node]')).toBeNull(); expect(container.firstElementChild?.tagName).toBe('SPAN') })
 it('calculates uniform fit and exports default canvas size',()=>{expect(DESIGN_W).toBe(880);expect(DESIGN_H).toBe(380);expect(computeFitScale(1000,800,'present')).toBeCloseTo(Math.min(920/880,656/380))})
 it('defaults attribution to the origin repo and leaves brand slot opt-in',()=>{render(<Presentation steps={steps} title="Demo" initialMode="present"/>); const link=screen.getByText('made by and-scene') as HTMLAnchorElement; expect(link.href).toBe('https://github.com/Codagent-AI/and-scene'); expect(document.querySelector('[data-presentation-header] a')).toBeNull(); expect(document.querySelector('[data-presentation-step-marker]')?.textContent).toBe('1'); expect(link.hasAttribute('data-presentation-attribution')).toBe(true)})
 it('guards interactive targets',()=>{const input=document.createElement('input'); expect(isInteractiveTarget(input)).toBe(true); expect(isInteractiveTarget(document.createElement('div'))).toBe(false)})
 it('kit source contains no visual style defaults or Tailwind references',()=>{
  const dir=join(process.cwd(),'src/presentation-kit'); const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(d,e.name)):[join(d,e.name)]);
  const source=files(dir).filter(f=>/\.(tsx?|css)$/.test(f) && !f.includes('/__tests__/')).map(f=>readFileSync(f,'utf8')).join('\n');
  expect(source).not.toMatch(/\b(?:color|background(?:Color)?|font(?:Family|Size|Weight)?|border(?:Radius|Color|Width)?|boxShadow)\s*:/i); expect(source.toLowerCase()).not.toContain('tailwind')
 })
})
