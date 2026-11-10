import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Router, resolveRoute } from '../../src/Router'
import { Landing } from '../../src/Landing'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { StoryScene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
// @ts-expect-error plain JavaScript executable contract
import { REFERENCE, validateReference } from '../../scripts/reference.mjs'
it('I-10 registry enumeration preserves explicit entries and routes', () => {
  const snapshot = [...presentations]
  render(<Landing />)
  for (const entry of snapshot) expect(screen.getByRole('link', { name: new RegExp(entry.title) })).toHaveAttribute('href', `/${entry.slug}`)
  expect(presentations).toEqual(snapshot)
  expect(resolveRoute('/how-to-make-a-presentation')?.slug).toBe('how-to-make-a-presentation')
  expect(resolveRoute('/how-to-make-a-presentation/')?.slug).toBe('how-to-make-a-presentation')
})
it('I-11 unknown route and root show landing; known route lazy-loads', async () => {
  expect(resolveRoute('/unknown')).toBeUndefined()
  const view = render(<Router path="/unknown" />)
  expect(screen.getByRole('link', { name: /How to Use This Skill/ })).toBeInTheDocument()
  view.rerender(<Router path="/" />)
  expect(screen.getByRole('link', { name: /How to Use This Skill/ })).toBeInTheDocument()
  view.rerender(<Router path="/how-to-make-a-presentation" />)
  expect(await screen.findByRole('main', { name: 'How to Use This Skill to Make a Presentation' })).toHaveAttribute('data-step-count', '9')
})
it('I-31 normative nine-step eras titles and captions match exactly', () => {
  expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(REFERENCE)
  expect(() => validateReference(STEPS)).not.toThrow()
})
it('I-36 reference validation rejects missing wrong count reordered and altered metadata', () => {
  for (const invalid of [[], STEPS.slice(1), [...STEPS].reverse(), STEPS.map((s, i) => i === 3 ? { ...s, caption: 'wrong' } : s), STEPS.map((s, i) => i === 0 ? { ...s, title: 'wrong' } : s)]) expect(() => validateReference(invalid)).toThrow(/reference sample/)
})
function entity(view: ReturnType<typeof render>, name: string) { return view.container.querySelector(`[data-presentation-entity="how-to-make-a-presentation:${name}"]`) }
it('I-32 sample first beats accumulate conversation and structured first card', () => {
  const view = render(<StoryScene payload={1} />)
  expect(entity(view, 'you')).toBeTruthy(); expect(entity(view, 'prompt')).toBeTruthy()
  expect(entity(view, 'skill')).toBeNull()
  view.rerender(<StoryScene payload={2} />)
  expect(entity(view, 'skill')).toBeTruthy()
  expect(entity(view, 'conversation')).toHaveTextContent('←────────────→')
  expect(entity(view, 'question')).toBeTruthy()
  view.rerender(<StoryScene payload={3} />)
  expect(view.container.querySelector('[data-story-tray]')).toBeTruthy()
  expect(entity(view, 'card-1')).toHaveTextContent('title · caption · visual')
  expect(entity(view, 'card-1')).not.toHaveTextContent('morphs')
})
it('I-33 sample tray grows in place with ghost depth and bottom-edge socket without a tray frame', () => {
  const view = render(<StoryScene payload={3} />)
  const you = entity(view, 'you'), first = entity(view, 'card-1')
  const originalStyle = first?.getAttribute('style')
  view.rerender(<StoryScene payload={4} />)
  expect(entity(view, 'card-2')).toBeTruthy()
  expect(entity(view, 'morph-1')).toHaveTextContent('morphs')
  view.rerender(<StoryScene payload={5} />)
  expect(entity(view, 'ghost')).toHaveClass('ghost')
  expect(entity(view, 'depth')).toHaveTextContent('partial ↔ full')
  view.rerender(<StoryScene payload={6} />)
  expect(entity(view, 'kit')).toHaveTextContent('shared scene kit')
  expect(entity(view, 'kit')).toHaveStyle({ top: '286px' })
  expect(view.container.querySelector('[data-story-tray]')).toHaveStyle({ top: '168px', height: '118px' })
  expect(view.container.querySelector('[data-presentation-node="frame"]')).toBeNull()
  expect(entity(view, 'you')).toBe(you); expect(entity(view, 'card-1')).toBe(first)
  expect(first?.getAttribute('style')).toBe(originalStyle)
})
it('I-34 verification modify and reveal accumulate without rearranging prior entities', () => {
  const view = render(<StoryScene payload={6} />)
  const original = [...view.container.querySelectorAll('[data-presentation-entity]')].map(el => ({ id: el.getAttribute('data-presentation-entity'), el, style: el.getAttribute('style') }))
  view.rerender(<StoryScene payload={7} />)
  expect(entity(view, 'verify')).toHaveTextContent('PASSbuild + render')
  expect(entity(view, 'verify')).toHaveStyle({ top: '200px' })
  expect(entity(view, 'verify-link')).toBeTruthy()
  view.rerender(<StoryScene payload={8} />)
  expect(entity(view, 'modify-arc')).toBeTruthy()
  expect(entity(view, 'card-2')).toHaveTextContent('edited')
  view.rerender(<StoryScene payload={9} />)
  expect(entity(view, 'reveal')).toHaveTextContent('YOU’RE LOOKING AT ONE')
  expect(entity(view, 'reveal')).toHaveStyle({ width: '810px', height: '364px' })
  for (const { id, el, style } of original) {
    expect(view.container.querySelector(`[data-presentation-entity="${id}"]`)).toBe(el)
    expect(el.getAttribute('style')).toBe(style)
  }
})
