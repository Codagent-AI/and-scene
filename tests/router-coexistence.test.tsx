import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
const entries=vi.hoisted(()=>({list:[
  {slug:'first',title:'First presentation',load:vi.fn(async()=>({default:()=> <p>Original first scene</p>}))},
  {slug:'second',title:'Second presentation',load:vi.fn(async()=>({default:()=> <p>Original second scene</p>}))},
]}))
vi.mock('../src/presentations',()=>({presentations:entries.list}))
it('I-26 distinct lazy presentations stay reachable after registering another', async()=>{
  const {Router}=await import('../src/Router')
  const {rerender}=render(<Router pathname="/first" />)
  await screen.findByText('Original first scene')
  rerender(<Router pathname="/second" />);await screen.findByText('Original second scene')
  const originals=[...entries.list]
  entries.list.push({slug:'third',title:'Third presentation',load:vi.fn(async()=>({default:()=> <p>Third scene</p>}))})
  // Registration is a source/module change; reload the route map as Vite does.
  vi.resetModules()
  const {Router:UpdatedRouter}=await import('../src/Router')
  rerender(<UpdatedRouter pathname="/third" />);await screen.findByText('Third scene')
  for(const [i,slug] of ['first','second'].entries()){
    expect(entries.list[i]).toBe(originals[i]);expect(entries.list[i].load).toBe(originals[i].load)
    rerender(<UpdatedRouter pathname={`/${slug}`} />)
    await screen.findByText(`Original ${slug} scene`)
  }
  rerender(<UpdatedRouter pathname="/" />)
  for(const entry of entries.list)expect(screen.getByRole('link',{name:entry.title}).getAttribute('href')).toBe(`/${entry.slug}`)
  rerender(<UpdatedRouter pathname="/missing" />);expect(screen.getByRole('heading').textContent).toBe('Ideas, in motion.')
})
