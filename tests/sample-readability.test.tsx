import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { ENTITIES } from '../src/presentations/how-to-make-a-presentation/entities'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../src/presentation-kit/constants'
import { fitScale } from '../src/presentation-kit/useFitScale'
const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')

describe('F-001 fixed-canvas sample typography', () => {
  it.each([1, 7, 9])('F-001 beat %i keeps authored text at readable narrow-fit sizes without changing the canvas', beat => {
    const view = render(<><style>{css}</style><div className="how-to-presentation"><Scene payload={{ beat }} step={STEPS[beat - 1]} /></div></>)
    const labels = [...view.container.querySelectorAll<HTMLElement>('[data-sample-text]')]
    expect(labels.length).toBeGreaterThan(0)
    for (const width of [360, 390]) for (const mode of ['browse', 'present'] as const) {
      const geometry = STAGE_LAYOUT[mode]
      const scale = fitScale(width, 844 - geometry.header - geometry.footer)
      for (const label of labels) {
        const effectiveSize = parseFloat(getComputedStyle(label).fontSize) * scale
        expect(effectiveSize, `${width}px ${mode}: ${label.textContent}`).toBeGreaterThanOrEqual(12)
      }
    }
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })
  it('F-001 every entity fits the same fixed design bounds', () => {
    for (const entity of ENTITIES) {
      expect(entity.x, entity.id).toBeGreaterThanOrEqual(0)
      expect(entity.y, entity.id).toBeGreaterThanOrEqual(0)
      expect(entity.x + entity.w, entity.id).toBeLessThanOrEqual(DESIGN_W)
      expect(entity.y + entity.h, entity.id).toBeLessThanOrEqual(DESIGN_H)
    }
  })
  it('F-001 step-card fields and verification checks stay explicit rather than being removed for space', () => {
    const view = render(<><style>{css}</style><div className="how-to-presentation"><Scene payload={{ beat: 7 }} step={STEPS[6]} /></div></>)
    for (const id of ['card-1', 'card-2', 'card-3']) {
      const card = view.container.querySelector(`[data-presentation-entity="how-to:${id}"]`)!
      expect([...card.querySelectorAll('small span')].map(span => span.textContent)).toEqual(['title', 'caption', 'visual'])
    }
    const verify = view.container.querySelector('[data-presentation-entity="how-to:verify"]')!
    expect([...verify.querySelectorAll('small span')].map(span => span.textContent)).toEqual(['build', 'render'])
  })
})
