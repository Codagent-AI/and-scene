import { describe, it, expect, vi } from 'vitest'
import { collectDiagnostics } from '../scripts/diagnostics.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
function rect(x=0,y=0,w=80,h=20) { return {x,y,width:w,height:h,left:x,top:y,right:x+w,bottom:y+h,toJSON:()=>({})} }
describe('diagnostic contracts',()=>{
  it('I-47 collision visibility and explicit subtree exemptions',()=>{
    document.body.innerHTML='<span>A</span><span>B</span><div data-presentation-allow-overlap="true"><span>Allowed</span></div><span style="display:none">Hidden</span>'
    vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(()=>rect())
    Object.defineProperty(Range.prototype,'getClientRects',{configurable:true,value:()=>[rect()]})
    const warnings=collectDiagnostics();expect(warnings.some((w:string)=>w.includes('overlap span:A / span:B'))).toBe(true)
    expect(warnings.some((w:string)=>w.includes('Allowed')||w.includes('Hidden'))).toBe(false)
    document.body.innerHTML='';vi.restoreAllMocks()
  })
  it('I-47 nested parent and positioned child text collide unless explicitly allowed',()=>{
    document.body.innerHTML='<div>Parent<span style="position:absolute">Child</span></div><footer data-presentation-footer><span>Own chrome content</span></footer>'
    vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(()=>rect())
    Object.defineProperty(Range.prototype,'getClientRects',{configurable:true,value:()=>[rect()]})
    expect(collectDiagnostics().some((w:string)=>w.includes('ParentChild')&&w.includes('span:Child'))).toBe(true)
    expect(collectDiagnostics().some((w:string)=>w.includes('overlap span:Own chrome content / footer:'))).toBe(false)
    document.querySelector('div')!.setAttribute('data-presentation-allow-overlap','true')
    expect(collectDiagnostics().some((w:string)=>w.includes('ParentChild')||w.includes('span:Child'))).toBe(false)
    document.body.innerHTML='';vi.restoreAllMocks()
  })
  it('I-48 active differences and missing tiny default attribution',()=>{
    vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(()=>rect())
    document.body.innerHTML='<button data-presentation-progress-entry data-presentation-active="true">1</button><button data-presentation-progress-entry>2</button>'
    expect(collectDiagnostics()).toContain('indistinct active progress-entry');expect(collectDiagnostics()).toContain('missing attribution: style [data-presentation-attribution]')
    document.body.innerHTML='<aside data-presentation-attribution><a style="font-size:8px;color:#0000ee" href="#">made by and-scene</a></aside>'
    expect(collectDiagnostics()).toContain('unpolished attribution: style [data-presentation-attribution]')
    document.querySelector('a')!.style.cssText='font:12px Arial;color:rgb(70,80,70);text-decoration:none'
    expect(collectDiagnostics()).not.toContain('unpolished attribution: style [data-presentation-attribution]')
    document.body.innerHTML='<button data-presentation-toc-entry data-presentation-active="true" style="color:red">A</button><button data-presentation-toc-entry>B</button>'
    expect(collectDiagnostics()).not.toContain('indistinct active toc-entry')
    document.body.innerHTML='';vi.restoreAllMocks()
  })
  it('I-46 helper rejects unsafe slugs and unsettled intervals',async()=>{
    await expect(inspect({route:'../escape',build:false})).rejects.toThrow('slug')
    await expect(inspect({route:'test',settle:100,build:false})).rejects.toThrow('at least 850')
  })
})
