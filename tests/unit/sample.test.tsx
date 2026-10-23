import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OUTLINES } from '../../scripts/verify.mjs'
import { presentations } from '../../src/presentations'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/steps/SampleScene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { STEP_META } from '../../src/presentations/how-to-make-a-presentation/steps/meta'

const SLUG = 'how-to-make-a-presentation'

const entityIds = (step: number) => {
  const { container, unmount } = render(<SampleScene payload={{ step }} />)
  const ids = [...container.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity') as string)
  unmount()
  return ids
}

describe('committed reference sample', () => {
  it('is registered and reachable under its slug', () => {
    expect(presentations.find((p) => p.slug === SLUG)?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('implements the nine normative steps in order, each with id, era, title and caption', () => {
    expect(STEP_META).toHaveLength(9)
    expect(STEP_META.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(OUTLINES[SLUG])
    expect(new Set(STEP_META.map((s) => s.id)).size).toBe(9)
    expect(STEPS.map((s) => [s.id, s.era, s.title, s.caption])).toEqual(STEP_META.map((s) => [s.id, s.era, s.title, s.caption]))
    for (const s of STEPS) expect(s.caption.length).toBeGreaterThan(10)
  })

  it('shares one scene group so the diagram evolves in place', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
  })

  it('accumulates entities and never redraws: ids only grow, apart from none leaving', () => {
    const per = STEP_META.map((_, i) => entityIds(i))
    for (let i = 1; i < per.length; i++) {
      for (const id of per[i - 1]) expect(per[i], `step ${i + 1} keeps ${id}`).toContain(id)
    }
    expect(per[0].length).toBeLessThan(per[8].length)
    for (const id of per[8]) expect(id.startsWith('how-to/')).toBe(true)
  })

  it('introduces the scene content named by each step', () => {
    const per = STEP_META.map((_, i) => entityIds(i).join(' '))
    expect(per[0]).toMatch(/you/)
    expect(per[0]).toMatch(/prompt/)
    expect(per[1]).toMatch(/skill/)
    expect(per[1]).toMatch(/question/)
    expect(per[2]).toMatch(/card-1/)
    expect(per[2]).not.toMatch(/card-2/)
    expect(per[3]).toMatch(/card-4/)
    expect(per[4]).toMatch(/ghost-card/)
    expect(per[4]).toMatch(/depth-control/)
    expect(per[5]).toMatch(/scene-kit/)
    expect(per[5]).not.toMatch(/reveal-frame/)
    expect(per[6]).toMatch(/verify/)
    expect(per[6]).toMatch(/verify-pass/)
    expect(per[7]).toMatch(/modify-arc/)
    expect(per[7]).toMatch(/edited-flag/)
    expect(per[8]).toMatch(/reveal-frame/)
  })

  it('keeps the "morphs" label clear of every card, node and flag around the link it names', () => {
    const rect = (e: Element) => {
      const st = (e as HTMLElement).style
      const [x, y, w, h] = [st.left, st.top, st.width, st.height].map((v) => parseFloat(v))
      return { x, y, r: x + w, b: y + h }
    }
    for (let step = 2; step < STEP_META.length; step++) {
      const { container, unmount } = render(<SampleScene payload={{ step }} />)
      const entities = [...container.querySelectorAll('[data-presentation-entity]')]
      const morphs = entities.find((e) => e.getAttribute('data-presentation-entity') === 'how-to/morphs-label')!
      expect(morphs, `step ${step + 1} shows the morphs label`).toBeDefined()
      const m = rect(morphs)
      for (const e of entities) {
        const id = e.getAttribute('data-presentation-entity')!
        if (e === morphs || e.getAttribute('data-presentation-kind') === 'arrow') continue
        if (id.endsWith('reveal-frame') || id.endsWith('reveal-label')) continue // the reveal frame encloses everything by design
        const o = rect(e)
        const apart = m.r <= o.x || o.r <= m.x || m.b <= o.y || o.b <= m.y
        expect(apart, `step ${step + 1}: morphs label overlaps ${id}`).toBe(true)
      }
      unmount()
    }
  })
})
