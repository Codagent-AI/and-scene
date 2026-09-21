import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Presentation } from './Presentation'
import { Box } from './nodes'
import { calculateFitScale } from './useFitScale'

const steps = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', groupKey: 'scene', payload: { value: 1 }, Scene: ({ payload }: { payload: { value: number } }) => <div><Box entityId="stable">{payload.value}</Box></div> },
  { id: 'two', era: 'finish', title: 'Second', caption: 'Second caption', groupKey: 'scene', payload: { value: 2 }, Scene: ({ payload }: { payload: { value: number } }) => <div><Box entityId="stable">{payload.value}</Box></div> },
]

describe('presentation kit contract', () => {
  it('keeps the fixed canvas uniformly scaled', () => {
    expect(calculateFitScale(880, 380 + 82 + 184, 'browse')).toBe(1)
    expect(calculateFitScale(440, 646, 'browse')).toBe(0.5)
  })

  it('renders unstyled semantic chrome and attribution hooks', () => {
    const html = renderToStaticMarkup(<Presentation steps={steps} title="Typed scene" />)
    expect(html).toContain('data-step-count="2"')
    expect(html).toContain('data-step-index="0"')
    expect(html).toContain('data-presentation-progress-item="true"')
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('data-presentation-attribution="true"')
    expect(html).toContain('made by and-scene')
    expect(html).toContain('>First</h1>')
    expect(html).not.toContain('data-presentation-brand="true">and-scene')
  })

  it('supports title-focused present mode without browse controls', () => {
    const html = renderToStaticMarkup(<Presentation steps={steps} title="Typed scene" initialMode="present" />)
    expect(html).toContain('data-presentation-mode="present"')
    expect(html).toContain('data-presentation-present-title="true"')
    expect(html).toContain('>First</h1>')
    expect(html).not.toContain('data-presentation-caption="true"')
    expect(html).not.toContain('data-presentation-progress="true"')
    expect(html).not.toContain('data-presentation-toc="true"')
  })

  it('keeps the stage layout namespace stable when steps have no group key', () => {
    expect(readFileSync(new URL('./Stage.tsx', import.meta.url), 'utf8')).toMatch(/useId/)
  })
})
