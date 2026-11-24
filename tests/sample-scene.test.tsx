import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
afterEach(cleanup)
it('connects the conversation, places the question above it and docks depth to the author', () => {
 const {container}=render(<Talk/>); fireEvent.keyDown(window,{key:'ArrowRight'})
 const connector=container.querySelector('[data-entity="conversation"]'); const question=container.querySelector('[data-entity="question"]') as HTMLElement
 expect(connector?.getAttribute('d')).toContain('M248 96 H574'); expect(Number.parseFloat(question.style.top)).toBeLessThan(96)
 for(let i=0;i<3;i++) fireEvent.keyDown(window,{key:'ArrowRight'})
 const person=container.querySelector('[data-entity="you"]') as HTMLElement; const depth=container.querySelector('[data-entity="depth"]') as HTMLElement
 expect(depth.style.left).toBe(person.style.left); expect(Number.parseFloat(depth.style.top)).toBe(125)
})

it('animates the conversation connector in and out', async () => {
 const {container}=render(<Talk/>); fireEvent.keyDown(window,{key:'ArrowRight'})
 const connector=container.querySelector('[data-entity="conversation"]') as SVGPathElement
 expect(connector.getAttribute('opacity')).toBe('0')
 await waitFor(() => expect(Number(connector.getAttribute('opacity'))).toBeGreaterThan(0), {timeout:3000})
 fireEvent.keyDown(window,{key:'ArrowLeft'}); expect(container.querySelector('[data-entity="conversation"]')).toBe(connector)
 await waitFor(() => expect(container.querySelector('[data-entity="conversation"]')).toBeNull(), {timeout:3000})
})
