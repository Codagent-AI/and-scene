import { afterEach, expect, it, vi } from 'vitest'
import { act } from 'react'
import type { Root } from 'react-dom/client'
import { waitFor } from '@testing-library/react'
const { roots } = vi.hoisted(()=>({ roots: [] as Root[] }))
vi.mock('react-dom/client',async original=>{
 const actual=await original<typeof import('react-dom/client')>()
 return {...actual,createRoot: (...args:Parameters<typeof actual.createRoot>)=>{const root=actual.createRoot(...args);roots.push(root);return root}}
})
afterEach(async()=>{for(const root of roots.splice(0))await act(()=>root.unmount());document.body.replaceChildren();window.history.replaceState(null,'','/');vi.unstubAllGlobals()})
it('I-26 real pathname entry lazily mounts multiple coexisting registry presentations and retains older routes',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
 const fixtures=['first','second','third'].map(slug=>({slug,title:slug,load:vi.fn(async()=>({default:()=> <h1>{slug} route loaded</h1>}))}))
 async function mount(path:string,entries=fixtures) {
  for(const root of roots.splice(0))await act(()=>root.unmount())
  vi.resetModules()
  const registry=await import('../src/presentations')
  registry.presentations.splice(0,registry.presentations.length,...entries)
  window.history.replaceState(null,'',path);document.body.innerHTML='<div id="root"></div>'
  await act(async()=>{await import('../src/main')})
  return registry
 }
 await mount('/',fixtures.slice(0,2))
 for(const entry of fixtures.slice(0,2))expect(document.querySelector(`a[href="/${entry.slug}"]`)).toBeTruthy()
 expect(fixtures.every(entry=>entry.load.mock.calls.length===0)).toBe(true)
 const registry=await mount('/')
 expect(registry.presentations.slice(0,2)).toEqual(fixtures.slice(0,2))
 for(const entry of fixtures)expect(document.querySelector(`a[href="/${entry.slug}"]`)).toBeTruthy()
 for(const entry of fixtures) {
  await mount(`/${entry.slug}`)
  await waitFor(()=>expect(document.body.textContent).toContain(`${entry.slug} route loaded`))
  expect(entry.load).toHaveBeenCalledTimes(1)
 }
 await mount('/unknown')
 for(const entry of fixtures)expect(document.querySelector(`a[href="/${entry.slug}"]`)).toBeTruthy()
 expect(fixtures.every(entry=>entry.load.mock.calls.length===1)).toBe(true)
})
