import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Router } from '../src/Router'
import { resolveRoute } from '../src/routing'
vi.mock('../src/presentations', () => ({ presentations: [
  {slug:'one',title:'First',load:async()=>({default:()=> <h1>First scene</h1>})},
  {slug:'two',title:'Second',load:async()=>({default:()=> <h1>Second scene</h1>})},
] }))
it('I-8 registry resolves independent lazy routes and landing links preserve all entries', async () => {
  expect(resolveRoute('/one')?.slug).toBe('one'); expect(resolveRoute('/two/')?.slug).toBe('two')
  const {rerender}=render(<Router pathname="/" />)
  expect(screen.getByRole('link',{name:/First/}).getAttribute('href')).toBe('/one')
  expect(screen.getByRole('link',{name:/Second/}).getAttribute('href')).toBe('/two')
  rerender(<Router pathname="/one" />); expect(await screen.findByRole('heading',{name:'First scene'})).toBeTruthy()
  rerender(<Router pathname="/two" />); expect(await screen.findByRole('heading',{name:'Second scene'})).toBeTruthy()
  rerender(<Router pathname="/unknown" />); expect(screen.getByRole('link',{name:/First/})).toBeTruthy()
})
