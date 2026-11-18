import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { fitScale } from '../src/presentation-kit/useFitScale'

it('F-1 all visible diagram labels have a readable projected font at 390x844 in every state and mode',()=>{
 const {container,rerender}=render(<Scene payload={1}/>);
 for(let beat=1;beat<=9;beat++) {
  rerender(<Scene payload={beat}/>);
  const text=container.querySelectorAll<HTMLElement>('[data-presentation-diagram-text]');
  expect(text.length).toBeGreaterThan(0);
  for(const mode of ['browse','present'] as const) {
   const scale=fitScale(390,844,mode);
   for(const label of text) {
    const font=parseFloat(label.style.fontSize);
    expect(Number.isFinite(font),label.textContent??'').toBe(true);
    expect(font*scale,label.textContent??'').toBeGreaterThanOrEqual(12);
   }
  }
 }
 // Every visible text node must participate in the size contract, rather than
 // leaving a decorative detail or late reveal at the old undersized font.
 const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
 while(walker.nextNode())if(walker.currentNode.textContent?.trim())expect(walker.currentNode.parentElement?.hasAttribute('data-presentation-diagram-text')).toBe(true);
})

it('F-1 large type preserves required step-card parts and verification information',()=>{
 render(<Scene payload={9}/>);
 for(const part of ['title','caption','visual'])expect(screen.getAllByText(part)).toHaveLength(3);
 for(const label of ['you','a topic','the skill','one question at a time','partial ↔ full','shared scene kit','verify','build','render','YOU’RE LOOKING AT ONE'])expect(screen.getByText(label)).toBeTruthy();
 expect(screen.getByLabelText('verification passed')).toBeTruthy();
})

it('F-1 diagram CSS cannot silently replace the explicit readable font with smaller detail text',()=>{
 const css=readFileSync('src/presentations/how-to-make-a-presentation/presentation.css','utf8');
 // Chrome is styled independently. Scene label sizes come from the rendered
 // text contract, without per-node/detail font overrides or local rescaling.
 const scene=css.slice(css.indexOf('.how-to .entity {'),css.indexOf('@media'));
 expect(scene).not.toMatch(/font-size\s*:|font\s*:|transform\s*:|zoom\s*:/);
 expect(scene).toContain('white-space: nowrap');
})
