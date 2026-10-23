// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'
import { key, makeSteps, type P } from './helpers/fixtures'

const q = (sel: string) => document.querySelector(sel)
const text = (sel: string) => q(sel)?.textContent

function Scene({ payload }: SceneProps<P>) {
  return <div data-testid="scene">payload-{payload.n}</div>
}

/** Walks a presentation front to back and returns [id-bearing title, on-screen number] pairs. */
function numberingOf(steps: Step<P>[]) {
  render(<Presentation steps={steps} title="deck" />)
  const seen: [string, string | null | undefined][] = []
  for (let i = 0; i < steps.length; i++) {
    seen.push([text('[data-presentation-title]')!, text('[data-presentation-step-number]')])
    act(() => void key('ArrowRight'))
  }
  return seen
}

describe('scene step model', () => {
  it('shows each step identity, era, title, caption and diagram state', () => {
    const steps = makeSteps(['alpha', 'beta', 'gamma'], Scene)
    render(<Presentation steps={steps} title="deck" />)
    for (let i = 0; i < steps.length; i++) {
      expect([...document.querySelectorAll('[data-presentation-scene]')].at(-1)?.getAttribute('data-presentation-step')).toBe(`s${i}`)
      expect(text('[data-presentation-era]')).toBe(steps[i].era)
      expect(text('[data-presentation-title]')).toBe(`Title ${i}`)
      expect(text('[data-presentation-caption]')).toBe(`Caption ${i}`)
      expect([...document.querySelectorAll('[data-testid="scene"]')].at(-1)?.textContent).toBe(`payload-${i}`)
      act(() => void key('ArrowRight'))
    }
  })

  it('derives numbers from position after insertion, removal and reordering', () => {
    const [a, b, c] = makeSteps(['x', 'y', 'z'], Scene)
    const withId = (s: Step<P>, id: string): Step<P> => ({ ...s, id, title: id })
    const A = withId(a, 'intro')
    const B = withId(b, 'middle')
    const C = withId(c, 'outro')
    const N = withId(a, 'inserted')

    const baseline = numberingOf([A, B, C])
    expect(baseline).toEqual([['intro', '1'], ['middle', '2'], ['outro', '3']])
    document.body.innerHTML = ''
    expect(numberingOf([N, A, B, C]).map(([t, n]) => `${n}:${t}`)).toEqual(['1:inserted', '2:intro', '3:middle', '4:outro'])
    document.body.innerHTML = ''
    expect(numberingOf([A, C]).map(([t, n]) => `${n}:${t}`)).toEqual(['1:intro', '2:outro'])
    document.body.innerHTML = ''
    expect(numberingOf([C, A, B]).map(([t, n]) => `${n}:${t}`)).toEqual(['1:outro', '2:intro', '3:middle'])
  })

  it('keeps StrictMode from double-handling navigation (effects subscribe once)', () => {
    render(
      <StrictMode>
        <Presentation steps={makeSteps(['a', 'b', 'c', 'd'], Scene)} title="deck" />
      </StrictMode>,
    )
    act(() => void key('ArrowRight'))
    expect(q('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')
    act(() => void key('p'))
    expect(q('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
  })
})
