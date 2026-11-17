import React from 'react'
import { waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('../src/presentations', () => ({ presentations: [
 {slug:'first',title:'First',load:async()=>({default:()=>React.createElement('p',null,'First scene')})},
 {slug:'second',title:'Second',load:async()=>({default:()=>React.createElement('p',null,'Second scene')})},
 {slug:'third',title:'Third',load:async()=>({default:()=>React.createElement('p',null,'Third scene')})},
] }))
beforeEach(() => { vi.resetModules(); document.body.innerHTML='<div id="root"></div>' })
it('lists all registered presentations on landing', async () => { history.replaceState({},'', '/'); await import('../src/main'); await waitFor(()=>expect(document.querySelectorAll('.landing a')).toHaveLength(3)); expect([...document.querySelectorAll('.landing a')].map(a=>a.getAttribute('href'))).toEqual(['/first','/second','/third']) })
it('loads a selected registered route', async () => { history.replaceState({},'', '/second'); await import('../src/main'); await waitFor(()=>expect(document.body.textContent).toContain('Second scene')) })
