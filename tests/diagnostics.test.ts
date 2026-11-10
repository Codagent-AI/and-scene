import { afterEach, expect, it, vi } from 'vitest'
import { diagnose } from '../scripts/diagnostics.mjs'
afterEach(()=>{document.body.innerHTML='';vi.restoreAllMocks()})
function setup(html:string){
 document.body.innerHTML='<main data-presentation>'+html+'</main>'
 vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){
  return {x:0,y:0,top:0,left:0,right:100,bottom:20,width:100,height:20,toJSON:()=>({})} as DOMRect
 })
 vi.spyOn(Range.prototype,'getClientRects').mockReturnValue([{left:0,right:100,top:0,bottom:20}] as unknown as DOMRectList)
 // jsdom returns empty opacity for UA defaults; explicit fixture styles model visible browser nodes.
 document.querySelectorAll('*').forEach(e=>(e as HTMLElement).style.opacity='1')
}
it('I-45 visible text collisions warn; hidden and marker-descendant collisions do not',()=>{
 setup('<div>A</div><div>B</div><div style="display:none">hidden</div><section data-presentation-allow-overlap><div>allowed</div><div>also allowed</div></section>')
 const warnings=diagnose()
 expect(warnings).toContain('overlap: A / B')
 expect(warnings.join()).not.toMatch(/hidden|allowed/)
})
it('I-46 indistinct active progress and ToC warn; locally distinct treatments do not',()=>{
 setup('<nav data-presentation-progress><button data-presentation-active="true">one</button><button data-presentation-active="false">two</button></nav><nav data-presentation-toc><button data-presentation-active="true">ask</button><button data-presentation-active="false">build</button></nav>')
 expect(diagnose().filter((s:string)=>s.includes('indistinct'))).toHaveLength(2)
 document.querySelectorAll('[data-presentation-active="true"]').forEach(e=>(e as HTMLElement).style.backgroundColor='red')
 expect(diagnose().filter((s:string)=>s.includes('indistinct'))).toHaveLength(0)
})
it('I-47 missing small browser-default attribution warns; polished attribution does not',()=>{
 setup('');expect(diagnose().join()).toContain('missing attribution')
 setup('<a data-presentation-attribution style="font-size:10px;color:gray">made by and-scene</a>');expect(diagnose().join()).toContain('unpolished attribution')
 setup('<a data-presentation-attribution style="font-size:16px;color:rgb(0,0,238);text-decoration-line:underline">made by and-scene</a>');expect(diagnose().join()).toContain('unpolished attribution')
 setup('<a data-presentation-attribution style="font-size:12px;color:gray;text-decoration-line:none">made by and-scene</a>');expect(diagnose().filter((s:string)=>s.includes('attribution'))).toHaveLength(0)
})
