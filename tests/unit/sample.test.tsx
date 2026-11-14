import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { entities, entityId, visibleEntities } from '../../src/presentations/how-to-make-a-presentation/entities'
import { StoryScene } from '../../src/presentations/how-to-make-a-presentation/steps/StoryScene'
import { presentations, findPresentation } from '../../src/presentations'
import { Landing } from '../../src/Landing'
import { Router } from '../../src/Router'
import { validateOutline, canonicalOutline } from '../../scripts/reference.mjs'
describe('sample and registry', () => {
  it('I-29 routes and enumerates explicit entries with unknown fallback and preserved entries', () => {
    expect(findPresentation('/how-to-make-a-presentation/')?.title).toMatch('How to Use')
    expect(findPresentation('/unknown')).toBeUndefined()
    const added = [...presentations, { ...presentations[0], slug: 'another' }]
    expect(findPresentation('/another', added)?.slug).toBe('another')
    expect(findPresentation('/how-to-make-a-presentation', added)).toBe(presentations[0])
    expect(presentations).toHaveLength(1)
    const { getByRole, unmount } = render(<Landing />)
    expect(getByRole('link')).toHaveAttribute('href', '/how-to-make-a-presentation'); unmount()
    expect(render(<Router pathname="/unknown" />).getByText('Ideas, in motion.')).toBeInTheDocument()
  })
  it('I-37 validates normative nine-step metadata and rejects absent malformed reordered title caption and era', async () => {
    const expected = await canonicalOutline()
    expect(() => validateOutline(STEPS, expected)).not.toThrow()
    for (const actual of [undefined, [], STEPS.slice(1), [...STEPS].reverse()]) expect(() => validateOutline(actual, expected)).toThrow('sample')
    for (const key of ['title', 'caption', 'era']) expect(() => validateOutline(STEPS.map((s, i) => i === 4 ? { ...s, [key]: 'wrong' } : s), expected)).toThrow(`step 4: incorrect ${key}`)
  })
  it.each(STEPS.map((step, index) => [index + 1, step] as const))('I-38 through I-46 beat %i accumulates stable entities', (beat, step) => {
    const { container } = render(<StoryScene payload={step.payload} />)
    const shown = visibleEntities(beat)
    for (const [id, geometry] of Object.entries(entities)) {
      const node = container.querySelector(`[data-presentation-entity="${entityId(id as keyof typeof entities)}"]`)
      expect(!!node).toBe(shown.includes(id))
      if (node && !['link1', 'link2', 'modify'].includes(id)) expect(node).toHaveStyle({ left: `${geometry.x}px`, top: `${geometry.y}px` })
    }
    if (beat > 1) expect(shown).toEqual(expect.arrayContaining(visibleEntities(beat - 1)))
    expect(step.groupKey).toBe(STEPS[0].groupKey); expect(step.Scene).toBe(STEPS[0].Scene)
  })
  it('I-40 keeps morph descriptions on links and I-43 kit socket below unframed tray', () => {
    const { container } = render(<StoryScene payload={{ beat: 9 }} />)
    for (const id of ['card1', 'card2', 'card3']) expect(container.querySelector(`[data-presentation-entity="how-to:${id}"]`)).not.toHaveTextContent('morphs')
    expect(container.querySelectorAll('.morph-link')).toHaveLength(2)
    expect(entities.kit.y).toBe(entities.tray.y + entities.tray.h)
    expect(container.querySelector('.story-tray')).toHaveAttribute('data-presentation-node', 'box')
    expect(container.querySelector('.story-reveal')).toHaveAttribute('data-presentation-node', 'frame')
  })
  it('keeps scene text legible when the 880 x 380 canvas is fitted to a 390px-wide viewport', () => {
    const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
    const sceneRules = [...css.matchAll(/([^{}]*\.(?:story-|tray-label|morph-link|modify-arc|visual-line)[^{}]*)\{([^}]*)\}/g)]
    const sizes = sceneRules.flatMap(([, selector, body]) => [...body.matchAll(/font-size:\s*([\d.]+)px/g)].map(match => [selector.trim(), Number(match[1])] as const))
    expect(sizes.length).toBeGreaterThan(10)
    // 390px / 880px canvas scale is about 0.443; 20px design text stays near 9px rendered.
    for (const [selector, size] of sizes) expect(size, selector).toBeGreaterThanOrEqual(20)
  })
})
