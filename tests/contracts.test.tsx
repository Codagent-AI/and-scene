import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { Landing } from '../src/Landing'
import { resolvePresentation } from '../src/routing'
import type { RegistryEntry } from '../src/routing'
import { presentations } from '../src/presentations'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { metadata } from '../src/presentations/how-to-make-a-presentation/metadata'
import { entities, entitiesAt } from '../src/presentations/how-to-make-a-presentation/entities'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { Presentation } from '../src/presentation-kit/Presentation'
// @ts-expect-error Node script is deliberately JavaScript and exercised here at runtime.
import { REFERENCE, validateReference } from '../scripts/reference.mjs'
// @ts-expect-error Pure browser-independent diagnostics are JavaScript.
import { diagnostics, overlaps } from '../scripts/diagnostics.mjs'
describe('registry and typed contract', () => {
  it('resolves multiple independent routes with explicit loaders and fallback and enumerates landing', () => {
    const extra: RegistryEntry = { slug: 'second', title: 'Second', load: async () => ({ default: () => null }) }
    const registry = [...presentations, extra]
    expect(resolvePresentation('/second', registry)).toBe(extra)
    expect(resolvePresentation('/second/', registry)).toBe(extra)
    expect(resolvePresentation('/', registry)).toBeUndefined()
    expect(resolvePresentation('/unknown', registry)).toBeUndefined()
    expect(resolvePresentation('/second/extra', registry)).toBeUndefined()
    expect(resolvePresentation('/how-to-make-a-presentation', registry)).toBe(presentations[0])
    render(<Landing />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/how-to-make-a-presentation')
  })
  it('compiles typed grouped payloads and rejects incompatible boundary payloads without casts', () => {
    expect(() => execFileSync('node', ['node_modules/typescript/bin/tsc', '-p', 'tests/tsconfig.contract.json'], { stdio: 'pipe' })).not.toThrow()
  })
})
describe('canonical sample', () => {
  it('matches all nine normative metadata rows and rejects missing changed or reordered metadata', () => {
    expect(metadata.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(REFERENCE)
    expect(STEPS.map(s => s.id)).toEqual(metadata.map(m => m.id))
    expect(() => validateReference(metadata)).not.toThrow()
    expect(() => validateReference([])).toThrow('expected 9')
    expect(() => validateReference([...metadata].reverse())).toThrow('step 0')
    for (const key of ['title', 'era', 'caption']) expect(() => validateReference(metadata.map((s, i) => i === 4 ? { ...s, [key]: 'incorrect' } : s))).toThrow(`incorrect ${key}`)
  })
  it('accumulates stable entities at unchanged coordinates with delayed entry and exit configuration', () => {
    const coords = new Map(entities.map(e => [e.id, [e.x, e.y, e.w, e.h]]))
    for (let beat = 1; beat <= 9; beat++) {
      const current = entitiesAt(beat)
      for (const e of current) {
        expect([e.x, e.y, e.w, e.h]).toEqual(coords.get(e.id))
        expect(e.x).toBeGreaterThanOrEqual(0); expect(e.x + e.w).toBeLessThanOrEqual(880)
        expect(e.y + e.h).toBeLessThanOrEqual(380)
      }
      if (beat > 1) expect(current.map(e => e.id)).toEqual(expect.arrayContaining(entitiesAt(beat - 1).map(e => e.id)))
    }
    expect(new Set(entities.map(e => e.id)).size).toBe(entities.length)
  })
  it('renders beats 1–2 conversation anchors prompt skill arrow and question placement', () => {
    const { container, rerender } = render(<StoryScene payload={{ beat: 1 }} />)
    expect(container.querySelector('[data-entity="how-to:you"]')).toBeTruthy()
    expect(container.querySelector('[data-entity="how-to:prompt"]')).toBeTruthy()
    expect(container.querySelector('[data-entity="how-to:skill"]')).toBeNull()
    rerender(<StoryScene payload={{ beat: 2 }} />)
    expect(screen.getByText('presentation skill')).toBeTruthy(); expect(screen.getByText('↔')).toBeTruthy()
    const question = entities.find(e => e.kind === 'chip')!
    expect(question.y + question.h).toBeLessThan(entities.find(e => e.kind === 'conversation')!.y)
  })
  it('renders beats 3–5 card parts link annotations ghost and docked depth control', () => {
    const { container, rerender } = render(<StoryScene payload={{ beat: 3 }} />)
    expect(screen.getByText('title · caption · visual')).toBeTruthy()
    expect(container.querySelector('[data-kind="tray"]')).toBeTruthy()
    rerender(<StoryScene payload={{ beat: 5 }} />)
    expect(container.querySelectorAll('[data-kind="card"]').length).toBe(3)
    expect(screen.getAllByText('morph').length).toBe(2)
    expect(container.querySelector('[data-kind="card"] small')).toBeNull()
    expect(container.querySelector('[data-kind="ghost"]')).toBeTruthy()
    const you = entities.find(e => e.kind === 'person')!, depth = entities.find(e => e.kind === 'depth')!
    expect(depth.x).toBe(you.x); expect(depth.y).toBeGreaterThanOrEqual(you.y + you.h)
  })
  it('renders beats 6–7 unframed tray with attached kit socket and same-row green verification checks', () => {
    const { container } = render(<StoryScene payload={{ beat: 7 }} />)
    expect(container.querySelector('[data-kind="tray"]')?.getAttribute('data-presentation-node')).toBe('box')
    expect(screen.getByText('shared scene kit · boxes / arrows / motion')).toBeTruthy()
    const card = entities.find(e => e.kind === 'card')!, link = entities.find(e => e.kind === 'socket-link')!, socket = entities.find(e => e.kind === 'socket')!, verify = entities.find(e => e.kind === 'verify')!
    expect(link.y).toBe(card.y + card.h + 1); expect(link.y + link.h).toBe(socket.y)
    expect(verify.y).toBe(card.y); expect(verify.x).toBeGreaterThan(card.x + card.w)
    expect(screen.getByText('build ✓ / render ✓')).toBeTruthy()
  })
  it('renders beats 8–9 edit arc and flag then outer labeled reveal without replacing continuing DOM', async () => {
    const { container, rerender } = render(<StoryScene payload={{ beat: 7 }} />)
    const card = container.querySelector('[data-entity="how-to:card-3"]')
    rerender(<StoryScene payload={{ beat: 8 }} />)
    expect(container.querySelector('[data-entity="how-to:card-3"]')).toBe(card)
    expect(screen.getByText('edited ✓')).toBeTruthy(); expect(screen.getByText('modify ↶')).toBeTruthy()
    rerender(<StoryScene payload={{ beat: 9 }} />)
    expect(screen.getByText('THIS IS ONE OF THOSE PRESENTATIONS')).toBeTruthy()
    expect(container.querySelector('[data-kind="reveal"]')?.getAttribute('data-presentation-node')).toBe('frame')
    expect(container.querySelector('[data-entity="how-to:card-3"]')).toBe(card)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
  })
  it('continuing grouped sample entity is not rewrapped or reintroduced on navigation', () => {
    const { container } = render(<Presentation steps={STEPS} title="Reference" />)
    const you = container.querySelector('[data-entity="how-to:you"]')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-entity="how-to:you"]')).toBe(you)
    expect(you?.closest('[data-presentation-appear]')).toBeNull()
  })
})
describe('diagnostic geometry and thresholds', () => {
  const text = (name: string, x: number, allowed = false) => ({ name, x, y: 10, width: 50, height: 20, allowed })
  const polished = { fontSize: 12, browserDefault: false }
  it('warns on unmarked text collision but exempts marked descendants and ignores nonoverlap', () => {
    expect(overlaps(text('A', 0), text('B', 25))).toBe(true)
    expect(diagnostics({ texts: [text('A', 0), text('B', 25)], controls: [], attribution: polished }, 2)).toEqual(['Step 2: overlap between "A" and "B"'])
    expect(diagnostics({ texts: [text('A', 0, true), text('B', 25, true)], controls: [], attribution: polished }, 2)).toEqual([])
    expect(overlaps(text('A', 0), text('B', 51))).toBe(false)
  })
  it('detects indistinct progress and ToC while accepting distinct signatures', () => {
    for (const kind of ['progress', 'toc']) {
      const controls = [{ kind, active: true, signature: 'same' }, { kind, active: false, signature: 'same' }]
      expect(diagnostics({ texts: [], controls, attribution: polished }, 3)).toEqual([`Step 3: indistinct active ${kind} chrome`])
      controls[0].signature = 'distinct'
      expect(diagnostics({ texts: [], controls, attribution: polished }, 3)).toEqual([])
    }
  })
  it('warns for missing undersized or browser-default attribution but accepts local polish', () => {
    for (const attribution of [null, { fontSize: 8, browserDefault: false }, { fontSize: 16, browserDefault: true }]) expect(diagnostics({ texts: [], controls: [], attribution }, 4)).toEqual(['Step 4: unpolished attribution; style [data-presentation-attribution]'])
    expect(diagnostics({ texts: [], controls: [], attribution: polished }, 4)).toEqual([])
  })
})
