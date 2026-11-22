import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('../src/presentations', () => ({ presentations: [
 {slug:'one',title:'One',load:async()=>({default:()=> <p>First route</p>})},
 {slug:'two',title:'Two',load:async()=>({default:()=> <p>Second route</p>})},
] }))
import { Router } from '../src/Router'
it('I-7 multiple lazy registry routes coexist and unknown paths show landing', async () => {
 const {rerender} = render(<Router path="/one" />)
 expect(await screen.findByText('First route')).toBeTruthy()
 rerender(<Router path="/two" />)
 expect(await screen.findByText('Second route')).toBeTruthy()
 rerender(<Router path="/unknown" />)
 expect(screen.getByText('One').closest('a')?.getAttribute('href')).toBe('/one')
 expect(screen.getByText('Two').closest('a')?.getAttribute('href')).toBe('/two')
})
