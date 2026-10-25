import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit'
import { STEPS, outline } from '../src/presentations/how-to-make-a-presentation/steps'
import { sceneStates, entityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { presentations, resolvePresentation } from '../src/presentations'
import { Landing } from '../src/Landing'
import { Router } from '../src/Router'
// Canonical metadata is independently maintained by the production verifier.
// @ts-expect-error JavaScript reference intentionally has no runtime TypeScript coupling.
import { REFERENCE } from '../scripts/reference.mjs'

test('I-28 registry preserves multiple routes and landing enumerates lazy entries with fallback', async () => {
  const first = presentations[0]
  const second = { slug: 'second', title: 'Second', load: vi.fn(first.load) }
  expect(resolvePresentation('/second', [first, second])).toBe(second)
  expect(resolvePresentation(`/${first.slug}`)).toBe(first)
  expect(resolvePresentation(`/${first.slug}/`)).toBe(first)
  expect(resolvePresentation('/unknown')).toBeUndefined()
  expect(resolvePresentation('/')).toBeUndefined()
  const { unmount } = render(<Landing />)
  expect(screen.getByRole('link', { name: new RegExp(first.title) }).getAttribute('href')).toBe(`/${first.slug}`)
  unmount()
  const page = render(<Router pathname="/unknown" />)
  expect(screen.getByText('Ideas in motion.')).toBeTruthy()
  page.unmount()
  render(<Router pathname={`/${first.slug}`} />)
  expect(await screen.findByText('You have a topic')).toBeTruthy()
})
test('I-36 reference eras titles captions equal all nine normative rows', () => {
  expect(STEPS).toHaveLength(9)
  expect(outline).toEqual(REFERENCE)
  expect(STEPS.map(s => [s.era, s.title, s.caption])).toEqual(REFERENCE)
})
test('I-37 first three beats add conversation and card with link-owned morph information', () => {
  expect(sceneStates[0].map(e => e.name)).toEqual(['you','prompt'])
  expect(sceneStates[1].map(e => e.name)).toEqual(expect.arrayContaining(['skill','conversation','question']))
  expect(sceneStates[2].map(e => e.name)).toEqual(expect.arrayContaining(['tray','card-1']))
  expect(sceneStates[1].find(e => e.name === 'conversation')?.label).toContain('←')
  expect(sceneStates[1].find(e => e.name === 'conversation')?.label).toContain('→')
  expect(sceneStates[2].find(e => e.name === 'card-1')?.detail).toBe('title · caption · visual')
  expect(sceneStates[3].filter(e => e.kind === 'card').every(e => !e.detail?.includes('morph'))).toBe(true)
  expect(sceneStates[3].filter(e => e.kind === 'morph')).toHaveLength(2)
})
test('I-38 beats four through six grow story add depth ghost and bottom kit socket without tray frame', () => {
  expect(sceneStates[3].filter(e => e.kind === 'card')).toHaveLength(3)
  expect(sceneStates[4].find(e => e.name === 'ghost')?.kind).toBe('ghost')
  const you = sceneStates[4].find(e => e.name === 'you')!, depth = sceneStates[4].find(e => e.name === 'depth')!
  expect(depth.x).toBe(you.x); expect(depth.y).toBeGreaterThanOrEqual(you.y + you.h)
  const tray = sceneStates[5].find(e => e.name === 'tray')!, kit = sceneStates[5].find(e => e.name === 'kit')!
  expect(kit.y).toBe(tray.y + tray.h); expect(kit.label).toBe('shared scene kit')
  const { container } = render(<Presentation steps={STEPS} title="Sample" />)
  fireEvent.click(screen.getByLabelText('Step 6: It assembles the scene'))
  expect(container.querySelector('[data-story-name="tray"]')?.getAttribute('data-presentation-node')).toBe('label')
})
test('I-39 final beats verify in tray row flag edited card and enclose whole diagram', () => {
  const verify = sceneStates[6].find(e => e.name === 'verify')!, cards = sceneStates[6].filter(e => e.kind === 'card')
  expect(verify.y).toBe(cards[0].y); expect(verify.x).toBeGreaterThan(cards.at(-1)!.x + cards.at(-1)!.w)
  expect(verify.label).toContain('✓'); expect(verify.detail).toBe('build + render')
  expect(sceneStates[7].map(e => e.name)).toEqual(expect.arrayContaining(['modify','edited']))
  const frame = sceneStates[8].find(e => e.name === 'reveal')!
  for (const e of sceneStates[7]) { expect(e.x).toBeGreaterThanOrEqual(frame.x); expect(e.y).toBeGreaterThanOrEqual(frame.y); expect(e.x + e.w).toBeLessThanOrEqual(frame.x+frame.w); expect(e.y+e.h).toBeLessThanOrEqual(frame.y+frame.h) }
})
test('I-40 cumulative sample identities coordinates and DOM instances remain fixed across every grouped beat', () => {
  expect(new Set(STEPS.map(s => s.Scene)).size).toBe(1)
  expect(new Set(STEPS.map(s => s.groupKey))).toEqual(new Set(['story']))
  for (let i = 1; i < 9; i++) for (const e of sceneStates[i-1]) expect(sceneStates[i].find(next => next.name === e.name)).toEqual(e)
  const { container } = render(<Presentation steps={STEPS} title="Sample" />)
  const you = container.querySelector(`[data-presentation-entity="${entityId('you')}"]`)
  for (let i = 1; i < 9; i++) { fireEvent.click(screen.getByLabelText(`Step ${i+1}: ${STEPS[i].title}`)); expect(container.querySelector(`[data-presentation-entity="${entityId('you')}"]`)).toBe(you) }
})
