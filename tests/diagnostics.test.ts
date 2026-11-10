import { expect, it, vi } from 'vitest'
import { inspectDocument } from '../scripts/diagnostics.mjs'
it('I-39 collision exemptions respect visible text and explicit subtree markers', () => {
 document.body.innerHTML = '<div>first</div><div>second</div><aside data-presentation-attribution><a href="#">credit</a></aside>'
 const rect = { left:0,top:0,right:100,bottom:20,width:100,height:20 }
 vi.spyOn(Element.prototype,'getBoundingClientRect').mockReturnValue(rect as DOMRect)
 Object.defineProperty(Element.prototype,'checkVisibility',{ configurable:true, value: () => true })
 Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList
 expect(inspectDocument().some((w: string) => w.includes('overlap'))).toBe(true)
 document.body.innerHTML = '<section data-allow-overlap="true"><div>first</div><div>second</div></section>'
 expect(inspectDocument().some((w: string) => w.includes('overlap'))).toBe(false)
 document.body.innerHTML = '<div style="visibility:hidden">hidden</div><div>visible</div>'
 expect(inspectDocument().some((w: string) => w.includes('overlap'))).toBe(false)
 document.body.innerHTML = ''
 vi.restoreAllMocks()
})
it('I-40 missing attribution emits styling-hook warning', () => {
 document.body.innerHTML = ''
 expect(inspectDocument()).toContain('missing attribution: style [data-presentation-attribution]')
})
it('I-40 active chrome and default or small attribution diagnostics distinguish polished variants', () => {
 const rect = { left:0,top:0,right:100,bottom:20,width:100,height:20 }
 vi.spyOn(Element.prototype,'getBoundingClientRect').mockReturnValue(rect as DOMRect)
 Object.defineProperty(Element.prototype,'checkVisibility',{ configurable:true, value: () => true })
 Range.prototype.getClientRects = () => [] as unknown as DOMRectList
 for (const kind of ['toc','progress']) {
  document.body.innerHTML = `<nav data-presentation-${kind}><button data-presentation-active="true">active</button><button data-presentation-active="false">inactive</button></nav><aside data-presentation-attribution><a style="font-size:16px;color:rgb(0,0,238);text-decoration:underline">credit</a></aside>`
  expect(inspectDocument()).toContain(`indistinct active chrome: ${kind}`)
  expect(inspectDocument()).toContain('unpolished attribution: style [data-presentation-attribution]')
  const active = document.querySelector('button')!
  active.style.backgroundColor = 'black'
  const link = document.querySelector('a')!
  link.style.color = 'green'; link.style.textDecoration = 'none'
  expect(inspectDocument().some((w:string) => w.includes('indistinct'))).toBe(false)
  expect(inspectDocument().some((w:string) => w.includes('unpolished'))).toBe(false)
  link.style.fontSize = '8px'
  expect(inspectDocument()).toContain('unpolished attribution: style [data-presentation-attribution]')
 }
 document.body.innerHTML = ''
 vi.restoreAllMocks()
})

it('I-39 chrome hit areas catch icon-only, control-edge and control-control collisions without flagging containment', () => {
 const rect = (left: number, top: number, width: number, height: number) => ({left,top,right:left+width,bottom:top+height,width,height})
 const boxes: Record<string, ReturnType<typeof rect>> = {
  content: rect(90,30,20,15), icon: rect(100,20,40,40), edge: rect(100,100,100,40),
  external: rect(101,101,10,10), label: rect(150,110,40,15), own: rect(100,200,100,40),
  'own-label': rect(120,210,60,15), other: rect(110,35,40,30),
 }
 vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this: Element) { return (boxes[this.id] ?? rect(0,0,0,0)) as DOMRect })
 Object.defineProperty(Element.prototype,'checkVisibility',{ configurable:true, value: () => true })
 Range.prototype.getClientRects = function() { return [boxes[this.startContainer.parentElement!.id] ?? rect(0,0,0,0)] as unknown as DOMRectList }
 document.body.innerHTML = '<div id="content">scene text</div><nav data-presentation-progress><button id="icon" aria-label="Icon next"><svg /></button><button id="edge"><span id="label">Label</span></button><button id="own"><span id="own-label">Own label</span></button></nav><div id="external">edge text</div>'
 const warnings = inspectDocument()
 expect(warnings.some((w:string) => w.includes('div#content') && w.includes('button#icon: Icon next'))).toBe(true)
 expect(warnings.some((w:string) => w.includes('div#external') && w.includes('button#edge'))).toBe(true)
 expect(warnings.some((w:string) => w.includes('button#own'))).toBe(false)
 document.querySelector('nav')!.insertAdjacentHTML('beforeend','<button id="other" aria-label="Other icon"><svg /></button>')
 expect(inspectDocument().some((w:string) => w.includes('button#icon') && w.includes('button#other'))).toBe(true)
 document.querySelector('#icon')!.setAttribute('data-allow-overlap','true')
 expect(inspectDocument().some((w:string) => w.includes('button#icon'))).toBe(false)
 document.querySelector('#other')!.setAttribute('style','visibility:hidden')
 expect(inspectDocument().some((w:string) => w.includes('button#other'))).toBe(false)
 document.body.innerHTML = ''
 vi.restoreAllMocks()
})
