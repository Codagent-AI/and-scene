import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_W, DESIGN_H } from '../src/presentation-kit/constants'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Router } from '../src/Router'
import { resolveRoute } from '../src/routes'
import { presentations } from '../src/presentations'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { placements, visibleEntities, entity } from '../src/presentations/how-to-make-a-presentation/entities'
import { ReferenceScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { outline } from '../src/presentations/how-to-make-a-presentation/steps/outline'
// @ts-expect-error JS validation module is intentionally shared with the node CLI.
import { reference, validateReference } from '../scripts/reference.mjs'
it('I-7 registry route lookup landing lazy route and unknown fallback', async () => {
  for (const entry of presentations) expect(resolveRoute(`/${entry.slug}`)?.title).toBe(entry.title)
  expect(resolveRoute('/unknown')).toBeUndefined()
  const { rerender } = render(<Router path="/unknown" />)
  for (const p of presentations) expect(screen.getByRole('link', { name: new RegExp(p.title) }).getAttribute('href')).toBe(`/${p.slug}`)
  rerender(<Router path="/how-to-make-a-presentation" />)
  expect(await screen.findByRole('heading', { name: 'You have a topic' })).toBeTruthy()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { name: 'The skill interviews you' })).toBeTruthy()
})
it('I-27 exact normative reference outline and explicit registration', () => {
  expect(outline).toEqual(reference)
  expect(STEPS.map(s => [s.era, s.title, s.caption])).toEqual(reference)
  expect(STEPS).toHaveLength(9)
  expect(presentations[0].slug).toBe('how-to-make-a-presentation')
})
it('I-28 accumulated entities preserve coordinates and grouped scene identity', () => {
  const seen = new Map<string, unknown>()
  for (let beat = 1; beat <= 9; beat++) {
    for (const p of visibleEntities(beat)) {
      if (seen.has(p.name)) expect(p).toEqual(seen.get(p.name))
      seen.set(p.name, { ...p })
    }
    expect(STEPS[beat - 1].groupKey).toBe('conversation')
    expect(STEPS[beat - 1].Scene).toBe(ReferenceScene)
  }
  expect(visibleEntities(1).map(p => p.name)).toEqual(['you', 'prompt'])
  expect(visibleEntities(9)).toHaveLength(placements.length)
  expect(visibleEntities(6).some(p => p.name === 'verify-link')).toBe(false)
  expect(visibleEntities(7).some(p => p.name === 'verify-link')).toBe(true)
  expect(new Set(placements.map(p => entity(p.name))).size).toBe(placements.length)
  const { rerender } = render(<ReferenceScene payload={1} />)
  const original = document.querySelector(`[data-entity-id="${entity('you')}"]`)
  rerender(<ReferenceScene payload={9} />)
  expect(document.querySelector(`[data-entity-id="${entity('you')}"]`)).toBe(original)
  for (const name of ['ghost', 'depth', 'kit', 'verify-link', 'verify', 'modify', 'edited', 'reveal']) expect(document.querySelector(`[data-entity-id="${entity(name)}"]`)).toBeTruthy()
})
it('I-29 missing malformed reordered altered reference metadata fails validation', () => {
  expect(() => validateReference(undefined)).toThrow(/missing or malformed/)
  expect(() => validateReference(reference.slice(1))).toThrow(/malformed/)
  expect(() => validateReference([...reference].reverse())).toThrow(/step 0/)
  expect(() => validateReference(reference.map((r: string[], i: number) => i === 2 ? [r[0], r[1], 'wrong caption'] : r))).toThrow(/step 2/)
  expect(() => validateReference(reference)).not.toThrow()
})

it('A-1 actual scene CSS keeps first dense and final labels at least 12px after narrow fit', () => {
  const style = document.createElement('style')
  style.textContent = readFileSync(resolve('src/presentations/how-to-make-a-presentation/presentation.css'), 'utf8')
  document.head.append(style)
  try {
    const scale = fitScale(390, 844, 'browse')
    const { rerender, container } = render(<div className="reference-presentation"><ReferenceScene payload={1} /></div>)
    for (const beat of [1, 8, 9]) {
      rerender(<div className="reference-presentation"><ReferenceScene payload={beat} /></div>)
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
      let count = 0
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (!node.textContent?.trim()) continue
        const font = parseFloat(getComputedStyle(node.parentElement!).fontSize)
        expect(Number.isFinite(font), node.textContent).toBe(true)
        expect(font * scale, node.textContent).toBeGreaterThanOrEqual(12)
        count++
      }
      expect(count).toBeGreaterThan(0)
    }
  } finally { style.remove() }
})
it('A-1 larger labels preserve the fixed cumulative scene and required card and pipeline content', () => {
  for (const p of placements) {
    expect(p.x).toBeGreaterThanOrEqual(0); expect(p.y).toBeGreaterThanOrEqual(0)
    expect(p.x + p.w).toBeLessThanOrEqual(DESIGN_W)
    expect(p.y + p.h).toBeLessThanOrEqual(DESIGN_H)
  }
  const tray = placements.find(p => p.name === 'tray')!
  const kit = placements.find(p => p.name === 'kit')!
  const last = placements.find(p => p.name === 'card-3')!
  const verify = placements.find(p => p.name === 'verify')!
  const link = placements.find(p => p.name === 'verify-link')!
  expect(kit.y).toBe(tray.y + tray.h)
  expect(link.x).toBe(last.x + last.w)
  expect(link.x + link.w).toBe(verify.x)
  expect(verify.y).toBeGreaterThanOrEqual(tray.y)
  expect(verify.y + verify.h).toBeLessThanOrEqual(tray.y + tray.h)
  render(<ReferenceScene payload={9} />)
  for (const name of ['card-1', 'card-2', 'card-3']) {
    const card = document.querySelector(`[data-entity-id="${entity(name)}"]`)!
    for (const part of ['Title', 'Caption', 'Visual']) expect(card.textContent).toContain(part)
  }
  expect(screen.getByLabelText('build and render passed')).toBeTruthy()
  expect(screen.getByText('partial ↔ full')).toBeTruthy()
  expect(screen.getByText('shared scene kit')).toBeTruthy()
  expect(screen.getByText('edited')).toBeTruthy()
  expect(screen.getByText('output')).toBeTruthy()
})
