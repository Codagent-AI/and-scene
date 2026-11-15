import { it, expect, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { Verification } from '../src/presentations/how-to-make-a-presentation/steps/Verification'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { diagram, entity } from '../src/presentations/how-to-make-a-presentation/entities'
import { presentations } from '../src/presentations'
import reference from '../scripts/reference-outline.json'
import { validateStep } from '../scripts/verify.mjs'
it('I-29 canonical sample metadata in order and validator rejects every malformed field', () => {
  expect(presentations.find(p => p.slug === 'how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(reference)
  STEPS.forEach((s, i) => { expect(() => validateStep(s, reference[i], i)).not.toThrow(); for (const field of ['title', 'caption', 'era']) expect(() => validateStep({ ...s, [field]: 'wrong' }, reference[i], i)).toThrow(`step ${i} ${field}`) })
})
it('I-30 beats 1–2 introduce the conversation and question chip', () => {
  expect(diagram(1).map(n => n.id)).toEqual([entity('you'), entity('prompt')])
  expect(diagram(2).map(n => n.id)).toEqual(expect.arrayContaining(['skill', 'conversation', 'question'].map(entity)))
  expect(diagram(2).find(n => n.id === entity('conversation'))?.label).toBe('↔')
})
it('I-31 beats 3–4 accumulate tray/cards and keep morph text on links', () => {
  expect(diagram(3).find(n => n.id === entity('step-1'))?.label).toBe('01 / title\ncaption\nvisual')
  expect(diagram(4).filter(n => n.kind === 'step')).toHaveLength(3)
  expect(diagram(4).filter(n => n.label.includes('morph')).every(n => n.kind === 'link')).toBe(true)
  expect(diagram(4).find(n => n.id === entity('tray'))).toBeDefined()
})
it('I-32 partial-depth and ghost entities appear only from beat 5', () => {
  expect(diagram(4).some(n => n.kind === 'ghost')).toBe(false)
  const nodes = diagram(5); expect(nodes.find(n => n.kind === 'ghost')?.label).toContain('next steps')
  const depth = nodes.find(n => n.kind === 'depth')!, you = nodes.find(n => n.id === entity('you'))!
  expect(depth.label).toBe('partial ↔ full'); expect(Math.abs(depth.x - you.x)).toBeLessThan(5); expect(depth.y).toBeGreaterThan(you.y + you.h)
})
it('I-33 socket attaches at bottom of unframed tray from beat 6', () => {
  const nodes = diagram(6), socket = nodes.find(n => n.kind === 'socket')!, tray = nodes.find(n => n.kind === 'tray')!
  expect(socket.label).toContain('shared scene kit'); expect(socket.y).toBeLessThan(tray.y + tray.h); expect(socket.y + socket.h).toBeGreaterThan(tray.y + tray.h)
  expect(nodes.some(n => n.kind === 'frame')).toBe(false)
})
it('I-34 verification is chained after cards in tray row and resolves to pass', () => {
  const nodes = diagram(7), verify = nodes.find(n => n.kind === 'verify')!, tray = nodes.find(n => n.kind === 'tray')!, last = nodes.find(n => n.id === entity('step-3'))!
  expect(verify.x).toBeGreaterThan(last.x + last.w); expect(verify.y).toBeGreaterThan(tray.y); expect(verify.y + verify.h).toBeLessThan(tray.y + tray.h); expect(verify.label).toBe('✓ build + render'); expect(nodes.some(n => n.id === entity('verify-link'))).toBe(true)
})
it('I-35 modification flag and labeled outer reveal are additive', () => {
  const view = render(<Scene payload={8} />)
  expect(view.container.querySelector(`[data-presentation-entity="${entity('step-2')}"]`)).toHaveAttribute('data-edited', 'true')
  expect(diagram(8).some(n => n.kind === 'modify')).toBe(true)
  const frame = diagram(9).find(n => n.kind === 'reveal')!
  expect(frame.label).toContain('you are looking at one')
  for (const n of diagram(8)) { expect(n.x).toBeGreaterThan(frame.x); expect(n.y).toBeGreaterThan(frame.y); expect(n.x + n.w).toBeLessThan(frame.x + frame.w); expect(n.y + n.h).toBeLessThan(frame.y + frame.h) }
})
it('I-5 I-36 stable grouped scene, immutable coordinates and accumulating identities', () => {
  expect(new Set(STEPS.map(s => s.Scene)).size).toBe(1); expect(new Set(STEPS.map(s => s.groupKey)).size).toBe(1)
  for (let beat = 2; beat <= 9; beat++) for (const before of diagram(beat - 1)) expect(diagram(beat).find(n => n.id === before.id)).toEqual(before)
  const view = render(<Scene payload={1} />), you = view.container.querySelector(`[data-sample-entity="${entity('you')}"]`)
  view.rerender(<Scene payload={9} />); expect(view.container.querySelector(`[data-sample-entity="${entity('you')}"]`)).toBe(you)
})
it('I-27 presentation CSS locally styles active chrome, readable attribution and ghost/pass treatments', async () => {
  const { readFile } = await import('node:fs/promises')
  const css = await readFile('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
  expect(css).toMatch(/\.how-to \[data-presentation-active="true"\][^{]*\{[^}]*background:\s*#264d40/)
  expect(css).toMatch(/\[data-presentation-attribution\][^{]*\{[^}]*font-size:\s*12px/)
  expect(css).toMatch(/\.diagram-ghost[^}]*dashed/)
  expect(css).toMatch(/\.diagram-verify[^}]*background:\s*#264d40/)
  expect(css).toContain('.diagram-verify:has([data-sample-verification="checking"]) { background: #e8eadd; color: #52665b; }')
  for (const step of STEPS) expect(step.caption.length).toBeGreaterThan(0)
})

it('I-34 checks visibly resolve to a green pass and persist across continuing beats', () => {
  vi.useFakeTimers()
  try {
    const view = render(<Scene payload={7} />)
    const result = () => view.container.querySelector('[data-sample-verification]')!
    expect(result()).toHaveAttribute('data-sample-verification', 'checking')
    expect(result()).toHaveTextContent('build · render …')
    expect(result()).not.toHaveTextContent('✓')
    act(() => vi.advanceTimersByTime(500))
    expect(result()).toHaveAttribute('data-sample-verification', 'checking')
    act(() => vi.advanceTimersByTime(300))
    expect(result()).toHaveAttribute('data-sample-verification', 'passed')
    expect(result()).toHaveTextContent('✓ build + render')
    const completed = result()
    view.rerender(<Scene payload={8} />)
    expect(result()).toBe(completed)
    expect(result()).toHaveAttribute('data-sample-verification', 'passed')
    view.unmount()
  } finally { vi.useRealTimers() }
})
it('I-34 checking timer is cleaned up when its node departs', () => {
  vi.useFakeTimers()
  try {
    const view = render(<Verification />)
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  } finally { vi.useRealTimers() }
})
