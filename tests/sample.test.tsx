import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { entities as e } from '../src/presentations/how-to-make-a-presentation/entities'
import { ConversationScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { presentations } from '../src/presentations'
import { Landing } from '../src/Landing'
import { Router } from '../src/Router'
import { resolveRoute, createRoutes } from '../src/routes'
import outline from '../scripts/reference-outline.json'
function scene(beat: number) { return render(<ConversationScene payload={{ beat }} />) }
function entity(container: HTMLElement, id: string) { return container.querySelector(`[data-entity-id="${id}"]`)! }
function present(container: HTMLElement, ...ids: string[]) { ids.forEach(id => expect(entity(container,id), id).toBeTruthy()) }
describe('reference scene', () => {
  it('I-31 canonical sample metadata and explicit registry match approved narrative', () => {
    expect(STEPS.map(({ era,title,caption }) => ({ era,title,caption }))).toEqual(outline)
    expect(new Set(STEPS.map(s => s.id)).size).toBe(9)
    expect(presentations.find(p => p.slug === 'how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  })
  it('I-32 first beat introduces you and prompt only', () => { const { container } = scene(1); present(container,e.you,e.prompt); expect(container.querySelectorAll('[data-entity-id]').length).toBe(2) })
  it('I-33 interview adds skill two-way arrow and question above it', () => { const { container } = scene(2); present(container,e.you,e.prompt,e.skill,e.conversation,e.question); expect(entity(container,e.conversation).querySelector('[marker-start]')).toBeTruthy(); expect(parseFloat((entity(container,e.question) as HTMLElement).style.top)).toBeLessThan(75) })
  it('I-34 first card has title caption visual and morph labels live outside cards', () => { const { container } = scene(3); present(container,e.tray,e.first); expect(entity(container,e.first).textContent).toContain('title · caption · visual'); expect(entity(container,e.first).textContent).not.toContain('morph') })
  it('I-35 more cards accumulate with link-owned morph labels', () => { const { container } = scene(4); present(container,e.first,e.second,e.third,e.link1,e.link2,e.morph1,e.morph2); for (const id of [e.first,e.second,e.third]) expect(entity(container,id).textContent).not.toContain('morph') })
  it('I-36 ghost card and depth control dock on you', () => { const { container } = scene(5); present(container,e.ghost,e.depth); expect(entity(container,e.ghost).classList.contains('ghost-card')).toBe(true); expect((entity(container,e.depth) as HTMLElement).style.left).toBe((entity(container,e.you) as HTMLElement).style.left); expect(entity(container,e.depth).textContent).toBe('partial ↔ full') })
  it('I-37 shared kit socket plugs into unframed tray bottom', () => { const { container } = scene(6); present(container,e.kit,e.tray); const tray = entity(container,e.tray) as HTMLElement; const socket = entity(container,e.kit) as HTMLElement; expect(parseFloat(socket.style.top)).toBe(parseFloat(tray.style.top) + parseFloat(tray.style.height)); expect(socket.textContent).toContain('shared scene kit'); expect(tray.getAttribute('data-presentation-node')).toBe('box') })
  it('I-38 verify joins same tray row after cards with build render pass', () => { const { container } = scene(7); present(container,e.verify,e.verifyLink); expect((entity(container,e.verify) as HTMLElement).style.top).toBe((entity(container,e.first) as HTMLElement).style.top); expect(parseFloat((entity(container,e.verify) as HTMLElement).style.left)).toBeGreaterThan(parseFloat((entity(container,e.ghost) as HTMLElement).style.left)); expect(entity(container,e.verify).textContent).toContain('build + renderPASS') })
  it('I-39 modify arc reaches route and edited card is flagged', () => { const { container } = scene(8); present(container,e.modify,e.modifyLabel,e.flag); expect(entity(container,e.modify).querySelector('path[marker-end]')?.getAttribute('d')).toBe('M 638 109 C 638 174 300 139 300 205'); expect(entity(container,e.flag).textContent).toBe('edited') })
  it('I-40 final labeled frame encloses diagram', () => { const { container } = scene(9); present(container,e.reveal); expect(entity(container,e.reveal).textContent).toContain('THIS IS ONE OF THOSE PRESENTATIONS'); const frame = entity(container,e.reveal) as HTMLElement; expect(frame.style.width).toBe('856px'); expect(frame.style.height).toBe('365px') })
  it('I-41 every beat accumulates fixed entities in one group and scene', () => {
    const { container, rerender } = scene(1)
    const seen = new Map<string, { element: Element; style: string | null }>()
    for (let beat = 1; beat <= 9; beat++) {
      rerender(<ConversationScene payload={{ beat }} />)
      for (const [id, previous] of seen) { expect(entity(container,id)).toBe(previous.element); expect(entity(container,id).getAttribute('style')).toBe(previous.style) }
      for (const el of container.querySelectorAll('[data-entity-id]')) seen.set(el.getAttribute('data-entity-id')!, { element: el, style: el.getAttribute('style') })
      expect(STEPS[beat-1].Scene).toBe(ConversationScene); expect(STEPS[beat-1].groupKey).toBe('conversation')
    }
    expect(seen.size).toBe(Object.keys(e).length)
  })
})
it('I-25 registry routing and landing preserve and enumerate multiple entries with fallback', async () => {
  const entries = [
    { slug: 'first', title: 'First', load: async () => ({ default: () => <p>first route</p> }) },
    { slug: 'second', title: 'Second', load: async () => ({ default: () => <p>second route</p> }) },
  ]
  expect(resolveRoute('/first', entries)).toBe(entries[0]); expect(resolveRoute('/second',entries)).toBe(entries[1]); expect(resolveRoute('/unknown',entries)).toBeUndefined()
  const landing = render(<Landing entries={entries} />); expect([...landing.container.querySelectorAll('a')].map(a=>a.getAttribute('href'))).toEqual(['/first','/second']); landing.unmount()
  const page = render(<Router path="/second" routes={createRoutes(entries)} />); expect(await page.findByText('second route')).toBeTruthy(); page.unmount()
  const fallback = render(<Router path="/unknown" routes={createRoutes(entries)} />); expect(fallback.getByText('First')).toBeTruthy()
  expect(entries).toHaveLength(2)
})
