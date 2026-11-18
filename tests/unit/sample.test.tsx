import { expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { entitiesAt } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { StoryScene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import normative from '../../scripts/reference.json'
const entity = (beat: number, id: string) => entitiesAt(beat).find(e => e.id === `how-to:${id}`)!
it('I-25 matches independent normative nine-step metadata in order', () => { expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(normative); expect(STEPS.every(s => s.groupKey === 'the-story' && s.Scene === StoryScene)).toBe(true) })
it('I-26 retains entity identities coordinates and DOM across all accumulating beats', () => {
  const { rerender } = render(<StoryScene payload={0} />)
  const first = document.querySelector('[data-presentation-entity="how-to:you"]')
  for (let i = 1; i < 9; i++) { const current = entitiesAt(i); for (const old of entitiesAt(i - 1)) expect(current.find(e => e.id === old.id)).toEqual(old); rerender(<StoryScene payload={i} />); expect(document.querySelector('[data-presentation-entity="how-to:you"]')).toBe(first); expect(current.every(e => e.x >= 0 && e.y >= 0 && e.x + e.w <= 880 && e.y + e.h <= 380)).toBe(true) }
})
it('I-27 starts with you and a prompt', () => { expect(entitiesAt(0).map(e => e.id)).toEqual(['how-to:you', 'how-to:prompt']); expect(entity(0, 'prompt').text).toContain('topic') })
it('I-28 adds skill bidirectional conversation and a question above', () => { expect(entity(1, 'skill').text).toBe('the skill'); expect(entity(1, 'conversation').bidirectional).toBe(true); expect(entity(1, 'question').y + entity(1, 'question').h).toBeLessThan(entity(1, 'conversation').y) })
it('I-29 puts title caption visual inside cards and morph labels on links', () => { expect(entity(2, 'tray').y).toBeGreaterThan(entity(2, 'you').y); expect(entity(2, 'card-1').parts).toEqual(['title', 'caption', 'visual']); for (let i = 1; i < 3; i++) { const morph = entity(3, `morph-${i}`), link = entity(3, `link-${i}`); expect(morph.x).toBeGreaterThanOrEqual(link.x - 2); expect(morph.y + morph.h).toBeLessThan(link.y) } })
it('I-30 extends the tray while keeping all previous entities put', () => { expect(entitiesAt(3).filter(e => e.id.includes(':card-'))).toHaveLength(3); expect(entitiesAt(3).slice(0, entitiesAt(2).length)).toEqual(entitiesAt(2)) })
it('I-31 adds unspecified ghost and user-docked partial full depth', () => { expect(entity(4, 'ghost').treatment).toBe('ghost'); expect(entity(4, 'depth').x).toBe(entity(4, 'you').x); expect(entity(4, 'depth').text).toContain('partial ↔ full') })
it('I-32 plugs the named shared kit into bottom edge without a tray frame', () => { expect(entity(5, 'socket').y).toBe(entity(5, 'card-1').y + entity(5, 'card-1').h); expect(entity(5, 'socket').text).toContain('shared scene kit'); expect(entitiesAt(5).filter(e => e.kind === 'frame')).toHaveLength(0) })
it('I-33 chains verification in tray row with build render pass', () => { expect(entity(6, 'verify').y).toBe(entity(6, 'card-1').y); expect(entity(6, 'verify').x).toBeGreaterThan(entity(6, 'card-3').x); expect(entity(6, 'verify').parts).toEqual(['build + render', 'pass']); expect(entity(6, 'verify').treatment).toBe('pass'); expect(entity(6, 'verify-link')).toBeTruthy() })
it('I-34 adds a modify arc and edited-card flag without replacing the card', () => { expect(entity(7, 'modify').kind).toBe('arrow'); expect(entity(7, 'modify').path).toContain('C'); expect(entity(7, 'edited').text).toBe('edited'); expect(entity(7, 'edited').x).toBeGreaterThan(entity(7, 'card-3').x); expect(entity(7, 'card-3')).toEqual(entity(6, 'card-3')) })
it('I-35 draws a labeled reveal enclosing the existing diagram', () => { const frame = entity(8, 'reveal'); expect(frame.kind).toBe('frame'); for (const item of entitiesAt(7)) { expect(item.x).toBeGreaterThanOrEqual(frame.x); expect(item.x + item.w).toBeLessThanOrEqual(frame.x + frame.w); expect(item.y).toBeGreaterThanOrEqual(frame.y); expect(item.y + item.h).toBeLessThanOrEqual(frame.y + frame.h) } expect(entity(8, 'reveal-label').text).toContain('THIS PRESENTATION') })
