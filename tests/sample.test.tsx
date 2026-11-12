import { readFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import { act, render, cleanup, screen, fireEvent } from '@testing-library/react'
import { afterEach } from 'vitest'
import { ReferenceScene, STEPS, TITLE } from '../src/presentations/how-to-make-a-presentation/steps'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import Landing from '../src/Landing'
import { Router } from '../src/Router'
import { presentations } from '../src/presentations'
import { entities } from '../src/presentations/how-to-make-a-presentation/entities'

vi.mock('../src/presentations', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/presentations')>()
  return { presentations: [...actual.presentations, { slug: 'second-fixture', title: 'Second fixture', load: async () => ({ default: () => <p>Independent second presentation</p> }) }] }
})

afterEach(cleanup)
const entity = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[data-scene-entity="${id}"]`)!
describe('reference sample', () => {
  it('matches all nine normative eras titles and captions in order', () => {
    const spec = readFileSync('openspec/changes/create-and-scene/specs/presentation-verification/spec.md', 'utf8')
    const rows = spec.split('\n').filter(line => /^\| [1-9] \|/.test(line)).map(line => line.split('|').slice(2, 5).map(cell => cell.trim().replace(/^"|"$/g, '')))
    expect(rows).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(rows)
    expect(new Set(STEPS.map(step => step.id)).size).toBe(9)
    expect(presentations[0].title).toBe(TITLE)
  })
  it('accumulates a single grouped scene with stable identities and geometry', () => {
    const previous = new Map<string, string>()
    for (const step of STEPS) {
      expect(step.Scene).toBe(ReferenceScene)
      expect(step.groupKey).toBe('reference-conversation')
      const { container, unmount } = render(<ReferenceScene payload={step.payload} />)
      for (const [id, style] of previous) expect(entity(container, id).getAttribute('style')).toBe(style)
      for (const node of container.querySelectorAll<HTMLElement>('[data-scene-entity]')) previous.set(node.dataset.sceneEntity!, node.getAttribute('style')!)
      unmount()
    }
    expect(Object.keys(entities)).toHaveLength(previous.size)
    expect(new Set(Object.values(entities)).size).toBe(previous.size)
  })
  it('beats one and two introduce the prompt and two-way interview', () => {
    const { container, rerender } = render(<ReferenceScene payload={{ beat: 1 }} />)
    expect(entity(container, 'you').textContent).toContain('you')
    expect(entity(container, 'prompt').textContent).toContain('topic')
    expect(entity(container, 'skill')).toBeNull()
    rerender(<ReferenceScene payload={{ beat: 2 }} />)
    expect(entity(container, 'skill').textContent).toContain('skill')
    expect(entity(container, 'conversation').textContent).toBe('←→')
    expect(Number.parseInt(entity(container, 'question').style.top)).toBeLessThan(Number.parseInt(entity(container, 'conversation').style.top))
  })
  it('beats three to five show card parts morph links and partial detail', () => {
    const { container, rerender } = render(<ReferenceScene payload={{ beat: 3 }} />)
    expect(entity(container, 'tray')).not.toBeNull()
    expect(entity(container, 'card-1').textContent).toContain('titlecaptionvisual')
    expect(entity(container, 'card-2')).toBeNull()
    rerender(<ReferenceScene payload={{ beat: 4 }} />)
    expect(entity(container, 'card-2')).not.toBeNull()
    expect(entity(container, 'card-3')).not.toBeNull()
    expect(entity(container, 'morph-1').textContent).toContain('morph')
    expect(entity(container, 'card-1').textContent).not.toContain('morph')
    rerender(<ReferenceScene payload={{ beat: 5 }} />)
    expect(entity(container, 'ghost').className).toContain('ghost-card')
    expect(entity(container, 'depth').textContent).toContain('partialfull')
  })
  it('beats six and seven attach the shared kit and chain a passing verification', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<ReferenceScene payload={{ beat: 6 }} />)
    expect(entity(container, 'kit').textContent).toContain('shared scene kit')
    const tray = entity(container, 'tray')
    expect(Number.parseInt(entity(container, 'kit').style.top)).toBe(Number.parseInt(tray.style.top) + Number.parseInt(tray.style.height))
    rerender(<ReferenceScene payload={{ beat: 7 }} />)
    expect(entity(container, 'verify').textContent).toContain('build ✓render ✓')
    expect(entity(container, 'verify').style.top).toBe(entity(container, 'card-3').style.top)
    expect(Number.parseInt(entity(container, 'verify').style.left)).toBeGreaterThan(Number.parseInt(entity(container, 'card-3').style.left))
    expect(entity(container, 'verify-link').textContent).toBe('→')
    expect(screen.getByLabelText('Checking build and render')).toBeTruthy()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByLabelText('Verification passed')).toBeTruthy()
    vi.useRealTimers()
  })
  it('beats eight and nine add in-place editing and the enclosing reveal', () => {
    const { container, rerender } = render(<ReferenceScene payload={{ beat: 8 }} />)
    expect(entity(container, 'modify').querySelector('path')).not.toBeNull()
    expect(entity(container, 'card-2').textContent).toContain('edited')
    rerender(<ReferenceScene payload={{ beat: 9 }} />)
    const frame = entity(container, 'reveal')
    expect(frame.textContent).toContain('THIS IS ONE OF THOSE PRESENTATIONS')
    for (const node of container.querySelectorAll<HTMLElement>('[data-scene-entity]:not([data-scene-entity="reveal"])')) {
      expect(Number.parseInt(node.style.left)).toBeGreaterThanOrEqual(Number.parseInt(frame.style.left))
      expect(Number.parseInt(node.style.left) + Number.parseInt(node.style.width)).toBeLessThanOrEqual(Number.parseInt(frame.style.left) + Number.parseInt(frame.style.width))
      expect(Number.parseInt(node.style.top) + Number.parseInt(node.style.height)).toBeLessThanOrEqual(Number.parseInt(frame.style.top) + Number.parseInt(frame.style.height))
    }
  })
  it('provides every browse caption and next and previous controls', () => {
    render(<Talk />)
    for (const step of STEPS) {
      fireEvent.click(screen.getByRole('button', { name: `Step ${STEPS.indexOf(step) + 1}: ${step.title}` }))
      expect(screen.getByText(step.caption)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Previous step' })).toBeTruthy()
    }
  })
})
describe('presentation registry and routes', () => {
  it('enumerates registered landing links and falls back on unknown routes', () => {
    const { unmount } = render(<Landing />)
    for (const entry of presentations) expect(screen.getByRole('link', { name: new RegExp(entry.title) }).getAttribute('href')).toBe(`/${entry.slug}`)
    unmount()
    render(<Router pathname="/unknown" />)
    expect(screen.getByText('THE COLLECTION')).toBeTruthy()
  })
  it('lazy loads the registered presentation route', async () => {
    render(<Router pathname="/how-to-make-a-presentation" />)
    expect(await screen.findByText(STEPS[0].title)).toBeTruthy()
  })
  it('keeps multiple registered routes independently reachable', async () => {
    const { rerender } = render(<Router pathname="/second-fixture" />)
    expect(await screen.findByText('Independent second presentation')).toBeTruthy()
    rerender(<Router pathname="/how-to-make-a-presentation" />)
    expect(await screen.findByText(STEPS[0].title)).toBeTruthy()
  })
})
