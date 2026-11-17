import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
vi.mock('../src/presentations',()=>({presentations:[{slug:'first',title:'First story',load:async()=>({default:()=> <p>First route</p>})},{slug:'second',title:'Second story',load:async()=>({default:()=> <p>Second route</p>})}]}))
import Router from '../src/Router'
afterEach(cleanup)
it('I-11 landing enumerates multiple entries and unknown paths return landing',()=>{
 const {rerender}=render(<Router pathname="/"/>);expect(screen.getByText('First story').closest('a')?.getAttribute('href')).toBe('/first');expect(screen.getByText('Second story')).toBeTruthy();rerender(<Router pathname="/unknown"/>);expect(screen.getByText('First story')).toBeTruthy()
})
it('I-11 explicit routes lazy load distinct presentations preserving both',async()=>{const {rerender}=render(<Router pathname="/first"/>);expect(await screen.findByText('First route')).toBeTruthy();rerender(<Router pathname="/second"/>);expect(await screen.findByText('Second route')).toBeTruthy()})
