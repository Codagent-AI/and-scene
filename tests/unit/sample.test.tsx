import { readFileSync } from 'node:fs'
import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Landing from '../../src/Landing'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { Scene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import { entityId } from '../../src/presentations/how-to-make-a-presentation/entities'
import { resolveRoute } from '../../src/route'

afterEach(cleanup)

// Independently encoded normative table (presentation-verification spec).
const TABLE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const SLUG = 'how-to-make-a-presentation'

describe('sample steps (I-1, I-50/I-51)', () => {
  it('has nine steps matching the normative era/title/caption in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(TABLE.map((r) => [...r]))
  })

  it('has unique, non-empty, position-independent ids', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(9)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('is registered under its slug with the prescribed title and a resolving loader', async () => {
    const entry = presentations.find((p) => p.slug === SLUG)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    const mod = await entry!.load()
    expect(typeof mod.default).toBe('function')
    expect(resolveRoute(`/${SLUG}`, presentations)).toEqual({ kind: 'presentation', entry })
  })
})

type Seen = Map<string, { left: string; top: string; emphasis: boolean }>

function renderAll(): Seen[] {
  const out: Seen[] = []
  const first = STEPS[0]!
  const view = render(<Scene payload={first.payload} stepIndex={0} />)
  STEPS.forEach((step, i) => {
    view.rerender(<Scene payload={step.payload} stepIndex={i} />)
    const seen: Seen = new Map()
    view.container.querySelectorAll<HTMLElement>('[data-presentation-entity]').forEach((el) => {
      seen.set(el.dataset.presentationEntity!, {
        left: el.style.left,
        top: el.style.top,
        emphasis: el.dataset.presentationEmphasis === 'true',
      })
    })
    out.push(seen)
  })
  return out
}

describe('sample scene (I-52)', () => {
  it('shares one groupKey and one Scene component across all steps', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS[0]!.groupKey).toBeTruthy()
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })

  it('only accumulates entities and keeps continuing entities in place', () => {
    const frames = renderAll()
    for (let i = 1; i < frames.length; i++) {
      for (const [id, pos] of frames[i - 1]!) {
        const now = frames[i]!.get(id)
        expect(now, `${id} must persist into step ${i + 1}`).toBeDefined()
        if (pos.left !== '') expect([now!.left, now!.top]).toEqual([pos.left, pos.top])
      }
    }
    expect(frames[8]!.size).toBeGreaterThan(frames[0]!.size)
  })

  it('uses the htmp namespace for every entity', () => {
    for (const id of renderAll()[8]!.keys()) expect(id.startsWith('htmp/')).toBe(true)
  })

  it('introduces the per-step required entities and ends with a labeled frame', () => {
    const frames = renderAll()
    const has = (step: number, ...keys: string[]) =>
      keys.forEach((k) => expect(frames[step - 1]!.has(entityId(k)), `step ${step} ${k}`).toBe(true))
    has(1, 'you', 'prompt')
    has(2, 'skill', 'ask-arrow', 'question')
    has(3, 'tray', 'card-1', 'link-1', 'link-label-1')
    has(4, 'card-2', 'card-3', 'card-4')
    has(5, 'ghost', 'depth-control')
    has(6, 'scene-kit')
    has(7, 'verify', 'verify-check')
    has(8, 'modify', 'flag')
    has(9, 'frame')
    // introduced no earlier than their beat
    expect(frames[3]!.has(entityId('ghost'))).toBe(false)
    expect(frames[5]!.has(entityId('verify'))).toBe(false)
    expect(frames[7]!.has(entityId('frame'))).toBe(false)
  })

  it('renders the frame label inside the frame, flagged as intentional overlap', () => {
    const view = render(<Scene payload={STEPS[8]!.payload} stepIndex={8} />)
    const frame = view.container.querySelector('[data-presentation-kind="frame"]')!
    expect(frame.hasAttribute('data-presentation-allow-overlap')).toBe(true)
    expect(frame.querySelector('[data-htmp-frame-label]')?.textContent).toMatch(/\S/)
  })

  it('card shows title, caption and visual; verify resolves to a pass check', () => {
    const view = render(<Scene payload={STEPS[6]!.payload} stepIndex={6} />)
    const card = view.container.querySelector(`[data-presentation-entity="${entityId('card-1')}"]`)!
    expect(card.querySelectorAll('[data-htmp-part]')).toHaveLength(3)
    const check = view.container.querySelector(`[data-presentation-entity="${entityId('verify-check')}"]`)!
    expect(check.getAttribute('data-htmp-state')).toBe('pass')
  })
})

describe('sample stylesheet (I-47)', () => {
  const css = readFileSync('src/presentations/how-to-make-a-presentation/styles.css', 'utf8')
  const talk = readFileSync('src/presentations/how-to-make-a-presentation/Talk.tsx', 'utf8')

  it('styles active progress and ToC hooks differently from inactive ones', () => {
    for (const hook of ['progress-item', 'toc-item']) {
      const rule = css.match(new RegExp(`\\[data-presentation-${hook}\\]\\[data-presentation-active='true'\\]\\s*\\{([^}]*)\\}`))
      expect(rule, hook).not.toBeNull()
      expect(rule![1]).toMatch(/background|border-color|font-weight/)
    }
  })

  it('styles attribution legibly with size and underline', () => {
    const rule = css.match(/\[data-presentation-attribution\]\s*\{([^}]*)\}/)![1]!
    const size = Number(rule.match(/font-size:\s*(\d+)px/)?.[1])
    expect(size).toBeGreaterThanOrEqual(12)
    expect(rule).toMatch(/text-decoration:\s*underline/)
    expect(rule).toMatch(/color:/)
  })

  it('is imported by Talk and scoped under the root class', () => {
    expect(talk).toContain("import './styles.css'")
    expect(talk).toContain('className="htmp"')
    const selectors = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+(?=\{)/g)!
    for (const sel of selectors.map((s) => s.trim()).filter((s) => !s.startsWith('@') && !/^\d+%$/.test(s))) {
      for (const part of sel.split(',')) expect(part.trim().startsWith('.htmp')).toBe(true)
    }
  })

  it('uses Presentation in browse mode', () => {
    expect(talk).toMatch(/initialMode="browse"/)
  })
})

describe('routing and landing (L-41, L-42)', () => {
  const fixtures = [
    { slug: 'a', title: 'Alpha', load: async () => ({ default: () => null }) },
    { slug: 'b', title: 'Beta', load: async () => ({ default: () => null }) },
  ]

  it('shows landing for / and unknown paths, entry for known slugs', () => {
    expect(resolveRoute('/', fixtures)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/nope', fixtures)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/b', fixtures)).toEqual({ kind: 'presentation', entry: fixtures[1] })
    expect(resolveRoute('/a/', fixtures)).toEqual({ kind: 'presentation', entry: fixtures[0] })
  })

  it('landing links every registered presentation', () => {
    const { container } = render(<Landing presentations={fixtures} />)
    const links = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toEqual([['Alpha', '/a'], ['Beta', '/b']])
  })
})
