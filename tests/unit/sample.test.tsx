import { afterEach, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { entitiesAt } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { StoryScene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import { readFileSync } from 'node:fs'
const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
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
it('I-34 anchors the rendered modify arc on the conversation and edited route card', () => {
  const arc = entity(7, 'modify'), card = entity(7, 'card-3'), skill = entity(7, 'skill'), flag = entity(7, 'edited')
  const { container } = render(<StoryScene payload={7} />)
  const svg = container.querySelector('[data-presentation-entity="how-to:modify"] svg')!
  const viewBox = svg.getAttribute('viewBox')!.split(' ').map(Number)
  const path = svg.querySelector('path')!.getAttribute('d')!
  const start = path.match(/^M([\d.]+) ([\d.]+)/)!.slice(1).map(Number)
  const end = path.match(/C[\d.]+ [\d.]+ [\d.]+ [\d.]+ ([\d.]+) ([\d.]+)/)!.slice(1).map(Number)
  const project = ([x, y]: number[]) => ({ x: arc.x + x / viewBox[2] * arc.w, y: arc.y + y / viewBox[3] * arc.h })
  const from = project(start), to = project(end)
  expect(from.y).toBe(skill.y + skill.h); expect(from.x).toBeGreaterThanOrEqual(skill.x); expect(from.x).toBeLessThanOrEqual(skill.x + skill.w)
  expect(to.y).toBe(card.y); expect(to.x).toBeGreaterThanOrEqual(card.x); expect(to.x).toBeLessThanOrEqual(card.x + card.w)
  expect(flag.text).toBe('edited'); expect(flag.x).toBeGreaterThanOrEqual(card.x); expect(flag.y).toBeGreaterThanOrEqual(card.y)
  expect(flag.x + flag.w).toBeLessThanOrEqual(card.x + card.w); expect(flag.y + flag.h).toBeLessThanOrEqual(card.y + card.h)
  expect(card).toEqual(entity(6, 'card-3'))
})
it('I-35 draws a labeled reveal enclosing the existing diagram', () => { const frame = entity(8, 'reveal'); expect(frame.kind).toBe('frame'); for (const item of entitiesAt(7)) { expect(item.x).toBeGreaterThanOrEqual(frame.x); expect(item.x + item.w).toBeLessThanOrEqual(frame.x + frame.w); expect(item.y).toBeGreaterThanOrEqual(frame.y); expect(item.y + item.h).toBeLessThanOrEqual(frame.y + frame.h) } expect(entity(8, 'reveal-label').text).toContain('THIS PRESENTATION') })

const style = document.createElement('style')
afterEach(() => style.remove())
it('I-23 local chip selectors match rendered hooks and apply all intended treatments', () => {
  style.textContent = css; document.head.append(style)
  const { container } = render(<div className="making-a-presentation"><StoryScene payload={8} /></div>)
  for (const id of ['prompt', 'question', 'depth', 'socket', 'edited', 'reveal-label']) {
    const el = container.querySelector(`[data-presentation-entity="how-to:${id}"]`)!
    expect(el.getAttribute('data-presentation-node')).toBe('symbolchip')
    const computed = getComputedStyle(el)
    expect(computed.display).toBe('grid'); expect(computed.placeItems).toBe('center'); expect(computed.borderRadius).toBe('4px')
    expect(computed.backgroundColor).toBe(['edited', 'reveal-label'].includes(id) ? 'rgb(189, 78, 41)' : 'rgb(230, 234, 223)')
    expect(computed.fontSize).toBe(id === 'edited' ? '9px' : id === 'reveal-label' ? '10px' : '11px')
  }
})
