import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { geometry, visibleAt, SampleScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { EXPECTED, validateMetadata } from '../scripts/verify.mjs'
it('I-30 sample exactly matches independent normative metadata and rejects malformed data', () => {
  expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(EXPECTED)
  validateMetadata(STEPS)
  expect(() => validateMetadata([])).toThrow('nine steps')
  expect(() => validateMetadata([...STEPS].reverse())).toThrow('step 0')
  expect(() => validateMetadata(STEPS.map((step, i) => i ? step : { ...step, caption: 'wrong' }))).toThrow('caption')
})
it('I-31 stable accumulation grouped identity and fixed coordinates', () => {
  expect(STEPS.every(step => step.Scene === SampleScene && step.groupKey === 'skill-story')).toBe(true)
  const view = render(<SampleScene payload={{ beat: 1 }} step={STEPS[0]} />)
  const you = document.querySelector('[data-presentation-entity="how-to:you"]')!
  let previous: string[] = []
  for (let beat = 1; beat <= 9; beat++) {
    view.rerender(<SampleScene payload={{ beat }} step={STEPS[beat - 1]} />)
    const ids = [...document.querySelectorAll('[data-presentation-entity]')].map(e => e.getAttribute('data-presentation-entity')!)
    for (const id of previous) expect(ids).toContain(id)
    expect(document.querySelector('[data-presentation-entity="how-to:you"]')).toBe(you)
    for (const [id, minimum] of Object.entries(visibleAt)) if (minimum <= beat) {
      const el = document.querySelector<HTMLElement>(`[data-presentation-entity="how-to:${id}"]`)!
      expect(el).toBeTruthy()
      expect(el.parentElement!.style.left).toBe(`${geometry[id as keyof typeof geometry][0]}px`)
    }
    previous = ids
  }
})
for (const [name, beat, ids] of [
  ['I-32 opening conversation', 2, ['you','prompt','skill','conversation','question']],
  ['I-33 tray cards ghost depth and link morph', 5, ['tray','card1','card2','ghost','depth','morph']],
  ['I-34 kit socket and chained green verification', 7, ['kit','verify','verify-link']],
  ['I-35 modification and enclosing reveal', 9, ['modify','reveal']],
] as const) it(name, () => {
  render(<SampleScene payload={{ beat }} step={STEPS[beat-1]} />)
  for (const id of ids) expect(document.querySelector(`[data-presentation-entity="how-to:${id}"]`)).toBeTruthy()
  if (beat === 5) {
    const card = document.querySelector('[data-presentation-entity="how-to:card1"]')!
    expect(card.textContent).toContain('caption · visual')
    expect(card.textContent).not.toContain('morph')
    expect(document.querySelector('[data-presentation-entity="how-to:ghost"]')!.className).toContain('ghost')
  }
  if (beat === 7) {
    expect(geometry.kit[1]).toBe(geometry.tray[1]+geometry.tray[3])
    expect(geometry.verify[1]).toBe(geometry.card1[1])
    expect(document.querySelector('[data-presentation-entity="how-to:verify"]')!.textContent).toContain('pass')
    expect(document.querySelector('[data-presentation-entity="how-to:tray"]')!.getAttribute('data-presentation-node')).toBe('box')
  }
  if (beat === 9) {
    expect(document.querySelector('[data-presentation-entity="how-to:card2"]')!.className).toContain('edited')
    expect(document.querySelector('[data-presentation-entity="how-to:reveal"]')!.textContent).toContain('THIS IS ONE')
  }
})
