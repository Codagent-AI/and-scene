import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { STEPS, TITLE } from '../src/presentations/how-to-make-a-presentation/steps'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { positions } from '../src/presentations/how-to-make-a-presentation/entities'
import { presentations, type PresentationEntry } from '../src/presentations'
import { createPresentationRouter, resolvePresentation } from '../src/routing'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'

const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const additions = [
  ['you', 'prompt'], ['skill', 'conversation', 'question'], ['tray', 'card1'],
  ['card2', 'card3', 'morph1', 'morph2'], ['ghost', 'depth'], ['socket'],
  ['verify', 'verify-link'], ['modify', 'modify-label'], ['reveal', 'reveal-label'],
]

describe('reference sample', () => {
  it('matches all normative metadata independently and registers the lazy route', async () => {
    expect(TITLE).toBe('How to Use This Skill to Make a Presentation')
    expect(STEPS.map(s => s.title)).toEqual(titles)
    expect(STEPS.map(s => s.caption)).toEqual(captions)
    expect(STEPS.map(s => s.era)).toEqual(['the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal'])
    expect(new Set(STEPS.map(s => s.id)).size).toBe(9)
    expect(STEPS.every(s => s.Scene === Scene && s.groupKey === STEPS[0].groupKey)).toBe(true)
    const entry = resolvePresentation('/how-to-make-a-presentation')!
    expect(entry.title).toBe(TITLE)
    expect((await entry.load()).default).toBe(Talk)
  })
  it.each(additions.map((_, i) => [i + 1]))('beat %i accumulates the required entities without moving or replacing earlier entities', beat => {
    const { container, rerender } = render(<Scene payload={{ beat: 1 }} stepIndex={0} />)
    const identities = new Map<string, Element>()
    const geometry = new Map<string, string | null>()
    for (let active = 1; active <= beat; active++) {
      rerender(<Scene payload={{ beat: active }} stepIndex={active - 1} />)
      const actual = [...container.querySelectorAll('[data-entity]')]
      const expected = additions.slice(0, active).flat()
      expect(actual.map(el => el.getAttribute('data-entity')).sort()).toEqual([...expected].sort())
      actual.forEach(el => {
        const key = el.getAttribute('data-entity')!
        if (identities.has(key)) { expect(el).toBe(identities.get(key)); expect(el.getAttribute('style')).toBe(geometry.get(key)) }
        else { identities.set(key, el); geometry.set(key, el.getAttribute('style')) }
      })
    }
  })
  it('encodes card parts, inter-card morphs, docked depth/socket, verification, modification, and reveal intent', () => {
    const { container } = render(<Scene payload={{ beat: 9 }} stepIndex={8} />)
    expect(screen.getAllByText('title · caption · visual')).toHaveLength(3)
    expect(screen.getAllByText('morph')).toHaveLength(2)
    expect(container.querySelector('.ghost-card')).toHaveAttribute('data-entity', 'ghost')
    expect(positions.depth.top).toBe(positions.you.top + positions.you.height)
    expect(positions.socket.top).toBe(positions.tray.top + positions.tray.height)
    expect(positions.verify.top).toBe(positions.card1.top)
    expect(positions.verify.left).toBeGreaterThan(positions.ghost.left + positions.ghost.width)
    expect(screen.getByText('build + render')).toBeInTheDocument()
    expect(screen.getByText('✓ pass')).toBeInTheDocument()
    expect(screen.getByText('edited')).toBeInTheDocument()
    expect(container.querySelector('.modify-arc path')).toHaveAttribute('d', 'M350 0C395 55 45 0 4 60m-1-10 1 10 10-3')
    expect(screen.getByText('THIS IS THE SKILL’S OWN OUTPUT.')).toBeInTheDocument()
    for (const [name, rect] of Object.entries(positions)) {
      if (name !== 'reveal') {
        expect(rect.left).toBeGreaterThan(positions.reveal.left)
        expect(rect.left + rect.width).toBeLessThan(positions.reveal.left + positions.reveal.width)
        expect(rect.top).toBeGreaterThan(positions.reveal.top)
        expect(rect.top + rect.height).toBeLessThan(positions.reveal.top + positions.reveal.height)
      }
    }
  })
  it('shows each caption and supports next and previous across the worked presentation', async () => {
    render(<Talk />)
    for (let index = 0; index < 9; index++) {
      expect(screen.getByText(captions[index])).toBeInTheDocument()
      if (index < 8) fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Previous', exact: true }))
    await waitFor(() => expect(screen.getByText(captions[7])).toBeInTheDocument())
  })
})

describe('explicit registry routing', () => {
  const entries: PresentationEntry[] = [
    { slug: 'one', title: 'First presentation', load: async () => ({ default: () => <h1>One route</h1> }) },
    { slug: 'two', title: 'Second presentation', load: async () => ({ default: () => <h1>Two route</h1> }) },
  ]
  const TestRouter = createPresentationRouter(entries)
  it('resolves each registered route and a trailing slash without disturbing other entries', () => {
    expect(resolvePresentation('/one', entries)).toBe(entries[0])
    expect(resolvePresentation('/two/', entries)).toBe(entries[1])
    expect(resolvePresentation('/missing', entries)).toBeUndefined()
    expect(presentations).toHaveLength(1)

  })
  it.each(['/', '/missing'])('renders the registry landing at %s', pathname => {
    render(<TestRouter pathname={pathname} />)
    expect(screen.getByRole('link', { name: /First presentation/ })).toHaveAttribute('href', '/one')
    expect(screen.getByRole('link', { name: /Second presentation/ })).toHaveAttribute('href', '/two')
  })
  it('preserves lazy route component state across host rerenders', async () => {
    function Stateful() {
      const [count, setCount] = useState(0)
      return <button onClick={() => setCount(count + 1)}>Count {count}</button>
    }
    const StatefulRouter = createPresentationRouter([{ slug: 'state', title: 'State', load: async () => ({ default: Stateful }) }])
    const { rerender } = render(<StatefulRouter pathname="/state" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Count 0' }))
    rerender(<StatefulRouter pathname="/state" />)
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument()
  })
  it('lazy loads a selected route through suspense', async () => {
    render(<TestRouter pathname="/two" />)
    expect(await screen.findByRole('heading', { name: 'Two route' })).toBeInTheDocument()
    expect(screen.queryByText('One route')).not.toBeInTheDocument()
  })
})
