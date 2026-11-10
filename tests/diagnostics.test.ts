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
