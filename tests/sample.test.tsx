import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Presentation } from '../src/presentation-kit'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { SampleScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { entities, entitiesAt } from '../src/presentations/how-to-make-a-presentation/entities'
import { resolveRoute } from '../src/routes'
import { presentations } from '../src/presentations'
import reference from '../scripts/reference.json'
import { STEPS as templateSteps } from '../skills/presentation/templates/presentation/steps'
describe('sample and registry', () => {
  it('I-25 explicit registry resolves multiple routes and loader isolation; unknown routes fall back', async () => {
    const second = { slug: 'another', title: 'Another', load: async () => ({ default: () => null }) }
    expect(resolveRoute('/another', [...presentations, second])).toBe(second)
    expect(resolveRoute('/how-to-make-a-presentation', [...presentations, second])).toBe(presentations[0])
    expect(resolveRoute('/missing', presentations)).toBeUndefined()
    expect(resolveRoute('/', presentations)).toBeUndefined()
    expect((await presentations[0].load()).default).toBeTypeOf('function')
    expect((await second.load()).default).toBeTypeOf('function')
  })
  it('I-31 generation template captions and navigation', () => {
    expect(templateSteps.length).toBeGreaterThan(1)
    for (const step of templateSteps) {
      const html = renderToStaticMarkup(<Presentation title="fixture" steps={[step]} />)
      expect(html).toContain(step.caption)
      expect(html).toContain('data-presentation-prev')
      expect(html).toContain('data-presentation-next')
      expect(html).toContain('data-presentation-attribution')
    }
  })
  it('I-33 canonical nine eras titles captions in order', () => {
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(reference)
    expect(STEPS).toHaveLength(9)
    expect(new Set(STEPS.map(s => s.id)).size).toBe(9)
    expect(STEPS.every(s => s.Scene === SampleScene && s.groupKey === 'conversation')).toBe(true)
  })
  it('I-34 conversation tray cards and morph labels between cards', () => {
    expect(entitiesAt(1).map(e => e.id)).toEqual(['you', 'prompt'])
    expect(entitiesAt(2).map(e => e.id)).toEqual(expect.arrayContaining(['you', 'prompt', 'skill', 'exchange', 'question']))
    const html = renderToStaticMarkup(<SampleScene payload={{ beat: 3 }} step={STEPS[2]} />)
    for (const text of ['title', 'caption', 'visual', 'card1', 'tray']) expect(html).toContain(text)
    expect(entities.find(e => e.id === 'link1')!.x).toBeGreaterThan(entities.find(e => e.id === 'card1')!.x + entities.find(e => e.id === 'card1')!.w)
    expect(entities.find(e => e.id === 'link1')!.x + entities.find(e => e.id === 'link1')!.w).toBeLessThan(entities.find(e => e.id === 'card2')!.x)
    expect(html).not.toContain('morph →')
  })
  it('I-35 accumulating cards depth and socket attachment without tray frame', () => {
    expect(entitiesAt(4).map(e => e.id)).toEqual(expect.arrayContaining(['card1', 'card2', 'card3', 'link1', 'link2']))
    expect(entitiesAt(5).map(e => e.id)).toEqual(expect.arrayContaining(['ghost', 'depth']))
    for (let beat = 5; beat <= 9; beat++) expect(renderToStaticMarkup(<SampleScene payload={{ beat }} step={STEPS[beat - 1]} />)).toContain('… next beat')
    const tray = entities.find(e => e.id === 'tray')!, kit = entities.find(e => e.id === 'kit')!
    expect(kit.y).toBe(tray.y + tray.h)
    const html = renderToStaticMarkup(<SampleScene payload={{ beat: 6 }} step={STEPS[5]} />)
    expect(html).toContain('shared scene kit'); expect(html).toContain('entity-tray'); expect(html).not.toContain('entity-frame')
  })
  it('I-36 verify modify and reveal preserve every identity and coordinate', () => {
    const html = (beat: number) => renderToStaticMarkup(<SampleScene payload={{ beat }} step={STEPS[beat - 1]} />)
    for (const text of ['verify', 'build ✓', 'render ✓']) expect(html(7)).toContain(text)
    const ghost = entities.find(e => e.id === 'ghost')!, verify = entities.find(e => e.id === 'verify')!
    expect(ghost.x + ghost.w).toBeLessThan(verify.x)
    expect(verify.y).toBe(entities.find(e => e.id === 'card1')!.y)
    for (const beat of [7, 8, 9]) { expect(html(beat)).toContain('… next beat'); expect(html(beat)).not.toContain('data-presentation-allow-overlap') }
    for (const text of ['modify', 'edited in place']) expect(html(8)).toContain(text)
    expect(html(9)).toContain('THIS IS ONE OF THOSE PRESENTATIONS')
    for (let beat = 2; beat <= 9; beat++) for (const entity of entitiesAt(beat - 1)) expect(entitiesAt(beat).find(e => e.id === entity.id)).toEqual(entity)
    for (const e of entities) { expect(e.x).toBeGreaterThanOrEqual(0); expect(e.x + e.w).toBeLessThanOrEqual(880); expect(e.y + e.h).toBeLessThanOrEqual(380) }
  })
})
