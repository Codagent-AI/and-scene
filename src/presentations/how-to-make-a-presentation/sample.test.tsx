// @vitest-environment jsdom
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'

// The wrapper checks below ask which entities are wrapped, not how exits run. A passthrough
// AnimatePresence removes departing wrappers at once, because jsdom cannot finish layout exits.
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const { Fragment, createElement } = await import('react')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: unknown }) => createElement(Fragment, null, children as never),
  }
})
import { ARROWS, BOXES, OVERLAP_EXEMPT, rectStyle, type BoxId } from './entities'
import { FRAME_STACK_ORDER } from './entities'
import { BEATS } from './beats'
import { PRESENTATIONS } from '../index'
import { resolveRoute } from '../../registry'
import Talk, { TITLE } from './Talk'
import { STEPS } from './steps'

/** Independent transcription of the nine normative rows from specs/presentation-verification. */
const NORMATIVE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  [
    'the gathering',
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  [
    'the loop',
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  ],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const visibleIds = (step: (typeof STEPS)[number]) => step.payload.entities.map((entity) => entity.id)

function renderSample() {
  const view = render(<Talk />)
  const root = () => view.container.querySelector<HTMLElement>('[data-presentation-root]')!
  const scene = () => view.container.querySelectorAll<HTMLElement>('[data-presentation-scene]')
  const next = () => fireEvent.click(view.container.querySelector('[data-presentation-control="next"]') as HTMLElement)
  const entityIds = () =>
    Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-entity]')).map((el) => el.getAttribute('data-presentation-entity'))
  return { view, root, scene, next, entityIds }
}

describe('sample content', () => {
  it('implements the nine normative steps in order with their eras, titles, and captions', () => {
    expect(STEPS.map((step) => [step.era, step.title, step.caption])).toEqual(NORMATIVE)
    expect(STEPS).toHaveLength(9)
    expect(BEATS).toHaveLength(9)
  })

  it('gives every step a stable unique id, an era, a title, a caption, and a diagram state', () => {
    const ids = STEPS.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const step of STEPS) {
      expect(step.id.length).toBeGreaterThan(0)
      expect(step.era.length).toBeGreaterThan(0)
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.caption.length).toBeGreaterThan(0)
      expect(step.payload.entities.length).toBeGreaterThan(0)
    }
  })

  it('accumulates entities: nothing introduced earlier leaves in a later step', () => {
    for (let i = 1; i < STEPS.length; i++) {
      const before = visibleIds(STEPS[i - 1]!)
      const after = visibleIds(STEPS[i]!)
      for (const id of before) expect(after).toContain(id)
    }
  })

  it('introduces each entity in exactly one beat', () => {
    const introduced = BEATS.flatMap((beat) => [...beat.enter])
    expect(new Set(introduced).size).toBe(introduced.length)
    expect(introduced.length).toBe(new Set(visibleIds(STEPS.at(-1)!)).size)
  })

  it('pins each shared entity to one layout rectangle or arrow in every step', async () => {
    const { view, next } = renderSample()
    const seen = new Map<string, string>()
    for (let i = 0; i < STEPS.length; i++) {
      if (i > 0) next()
      await waitFor(() => expect(view.container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe(String(i)))
      for (const el of Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-scene] [data-presentation-entity]'))) {
        const id = el.getAttribute('data-presentation-entity')!
        // Position and size only: opacity is animation state and changes while entries run.
        const geometry = ['left', 'top', 'width', 'height'].map((prop) => el.style.getPropertyValue(prop)).join(' ') || el.getAttribute('viewBox') || ''
        if (seen.has(id)) expect(geometry).toBe(seen.get(id))
        else seen.set(id, geometry)
      }
    }
    expect(seen.size).toBe(new Set(STEPS.flatMap(visibleIds)).size)
  })

  it('renders the content each step names and the negative cases', async () => {
    const { view, next, entityIds } = renderSample()
    const expectAt = async (index: number, present: string[], absent: string[]) => {
      await waitFor(() => expect(view.container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe(String(index)))
      const ids = entityIds()
      for (const id of present) expect(ids, `step ${index + 1} has ${id}`).toContain(id)
      for (const id of absent) expect(ids, `step ${index + 1} lacks ${id}`).not.toContain(id)
    }
    await expectAt(0, ['you', 'prompt'], ['skill', 'frame'])
    next()
    await expectAt(1, ['skill', 'chat', 'question'], ['card1'])
    next()
    await expectAt(2, ['tray', 'card1'], ['card2', 'link12', 'morphLabel'])
    next()
    await expectAt(3, ['card2', 'card3', 'link12', 'link23', 'morphLabel'], ['ghost', 'partial', 'link3v'])
    next()
    await expectAt(4, ['ghost', 'partial'], ['socket', 'verify'])
    next()
    await expectAt(5, ['socket'], ['verify', 'frame'])
    next()
    await expectAt(6, ['verify', 'link3v'], ['modify', 'frame'])
    expect(view.container.querySelector('[data-presentation-entity="verify"] [data-presentation-state="pass"]')).not.toBeNull()
    next()
    await expectAt(7, ['modify', 'route', 'flag', 'modifyLabel'], ['frame'])
    expect(view.container.querySelector('[data-presentation-entity="card2"]')!.getAttribute('data-presentation-state')).toBe('edited')
    next()
    await expectAt(8, ['frame'], [])
    expect(view.container.querySelector('[data-presentation-frame]')!.textContent).toContain('made exactly this way')
  })

  it('draws the two-way link between you and skill in step 2 and the one-way modify arc in step 8', async () => {
    const { view, next } = renderSample()
    next()
    await waitFor(() => expect(view.container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('1'))
    const chat = view.container.querySelector('[data-presentation-entity="chat"] path')!.getAttribute('d')!
    expect(chat.split('M').length - 1).toBe(5)
    expect(ARROWS.chat.bidirectional).toBe(true)
    expect(ARROWS.modify.bidirectional).toBe(false)
  })

  it('keeps the tray unframed in step 6 and frames the diagram only in step 9', () => {
    expect(OVERLAP_EXEMPT.has('frame')).toBe(true)
    expect(Object.keys(BOXES)).toContain('frame')
    const framedBefore = STEPS.slice(0, 8).some((step) => visibleIds(step).includes('frame'))
    expect(framedBefore).toBe(false)
    expect(visibleIds(STEPS[8]!)).toContain('frame')
  })
})

describe('sample rendered state', () => {
  it('renders exactly the entities each step lists, in every step', async () => {
    const { view, next } = renderSample()
    for (let i = 0; i < STEPS.length; i++) {
      if (i > 0) next()
      await waitFor(() => expect(view.container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe(String(i)))
      const rendered = new Set(
        Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-scene] [data-presentation-entity]')).map((el) =>
          el.getAttribute('data-presentation-entity'),
        ),
      )
      expect(rendered).toEqual(new Set(visibleIds(STEPS[i]!)))
    }
  })

  it('gives every active-state selector in the sample CSS a matching element in the rendered sample', async () => {
    const css = readFileSync(join(process.cwd(), 'src/presentations/how-to-make-a-presentation/presentation.css'), 'utf8')
    const { view, root } = renderSample()
    const selectors = Array.from(css.matchAll(/([^{}]+)\{/g))
      .map((match) => match[1]!.trim())
      .filter((selector) => /data-presentation-active|aria-current|data-presentation-attribution/.test(selector))
    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) {
      // Interaction pseudo-classes such as :hover cannot match in a static render, so match their base.
      const parts = selector.split(',').map((part) => part.trim().replace(/:(hover|focus|focus-visible)$/, ''))
      const matched = parts.some((part) => view.container.querySelector(part) !== null)
      expect(matched, selector).toBe(true)
    }
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })
})

describe('sample entry wrappers', () => {
  const wrappedIds = (view: ReturnType<typeof renderSample>['view']) =>
    new Set(
      Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-entering]')).map((el) =>
        el.getAttribute('data-presentation-entering'),
      ),
    )
  const goTo = async (view: ReturnType<typeof renderSample>['view'], index: number) => {
    await waitFor(() => expect(view.container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe(String(index)))
  }
  // Newcomers are whatever was not on screen in the previous step, in either direction.
  const newcomers = (from: number, to: number) => {
    const before = new Set(visibleIds(STEPS[from]!))
    return new Set(visibleIds(STEPS[to]!).filter((id) => !before.has(id)))
  }

  it('wraps exactly the newcomers of each forward step, and nothing when moving back', async () => {
    // Departing wrappers stay mounted until their exit finishes; jsdom cannot finish layout exits,
    // so completion is driven by the global flag. The flag does not change which entities are wrapped.
    MotionGlobalConfig.skipAnimations = true
    try {
      const { view, next } = renderSample()
      await goTo(view, 0)
      await waitFor(() => expect(wrappedIds(view)).toEqual(new Set(visibleIds(STEPS[0]!))))
      for (let i = 1; i < STEPS.length; i++) {
        next()
        await goTo(view, i)
        await waitFor(() => expect(wrappedIds(view), `forward to step ${i + 1}`).toEqual(newcomers(i - 1, i)))
      }
      // Moving back removes entities; nothing is newly on screen, so nothing is wrapped.
      for (let i = STEPS.length - 2; i >= 0; i--) {
        fireEvent.click(view.container.querySelector('[data-presentation-control="prev"]') as HTMLElement)
        await goTo(view, i)
        await waitFor(() => expect(wrappedIds(view)).toEqual(new Set()))
      }
    } finally {
      MotionGlobalConfig.skipAnimations = false
    }
  })

  it('wraps every entity that a jump brings on screen, and never a continuing one', async () => {
    MotionGlobalConfig.skipAnimations = true
    try {
      const { view } = renderSample()
      await goTo(view, 0)
      const dots = view.container.querySelectorAll<HTMLElement>('[data-presentation-progress]')
      fireEvent.click(dots[8]!)
      await goTo(view, 8)
      await waitFor(() => expect(wrappedIds(view)).toEqual(newcomers(0, 8)))
    } finally {
      MotionGlobalConfig.skipAnimations = false
    }
  })
})

describe('sample geometry', () => {
  const CANVAS = { width: 880, height: 380 }
  const rect = (id: BoxId) => BOXES[id]
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
    const width = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
    const height = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
    return width > 0 && height > 0
  }

  it('keeps every entity box inside the 880 by 380 canvas', () => {
    for (const id of Object.keys(BOXES) as BoxId[]) {
      const { x, y, w, h } = rect(id)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x + w).toBeLessThanOrEqual(CANVAS.width)
      expect(y + h).toBeLessThanOrEqual(CANVAS.height)
    }
  })

  it('allows overlap between text-bearing boxes only for the declared exempt frame', () => {
    const ids = Object.keys(BOXES) as BoxId[]
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!
        const b = ids[j]!
        if (!overlaps(rect(a), rect(b))) continue
        const exempt = OVERLAP_EXEMPT.has(a) || OVERLAP_EXEMPT.has(b)
        expect(exempt, `${a} overlaps ${b}`).toBe(true)
      }
    }
  })

  it('declares stacking and overflow for the exempt frame', () => {
    expect(rectStyle('frame')).toEqual({ left: 4, top: 4, width: 872, height: 372 })
    expect(FRAME_STACK_ORDER).toBe(0)
  })

  it.each([
    [1440, 900],
    [390, 844],
  ])('fits the canvas inside a %i by %i viewport in both modes at or above MIN_SCALE', async (width, height) => {
    const { fitScale } = await import('../../presentation-kit/useFitScale')
    const { MIN_SCALE, STAGE_LAYOUT } = await import('../../presentation-kit/constants')
    for (const mode of ['browse', 'present'] as const) {
      const { padX, padY, reservedHeight } = STAGE_LAYOUT[mode]
      const scale = fitScale({ width, height }, mode)
      expect(scale).toBeGreaterThanOrEqual(MIN_SCALE)
      // Budget check only: the scene must fit the viewport less the fixed chrome budget. It does not
      // measure the chrome's real rectangles, which needs layout (see I-28 in the checklist).
      expect(CANVAS.width * scale).toBeLessThanOrEqual(width - 2 * padX)
      expect(CANVAS.height * scale).toBeLessThanOrEqual(height - reservedHeight - 2 * padY)
    }
  })
})

describe('sample folder contract', () => {
  it('keeps every import inside the presentation, the kit, or the React runtime packages', () => {
    const dir = join(process.cwd(), 'src/presentations/how-to-make-a-presentation')
    const files = ['Talk.tsx', 'entities.ts', 'beats.ts', 'payload.ts', 'SampleScene.tsx', 'steps/index.ts'].map((name) => join(dir, name))
    const allowed = /^(\.\/|\.\.\/\.\.\/presentation-kit|\.\.\/|react|lucide-react|motion\/react|node:)/
    for (const file of files) {
      expect(existsSync(file), file).toBe(true)
      const specifiers = Array.from(readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)).map((match) => match[1]!)
      for (const specifier of specifiers) expect(allowed.test(specifier), `${file} imports ${specifier}`).toBe(true)
    }
  })
})

describe('sample rendering', () => {
  it('renders the first step, every step, and back again without console or page errors', async () => {
    const errors: unknown[] = []
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args)
    })
    const onError = (event: ErrorEvent) => errors.push(event.error)
    window.addEventListener('error', onError)
    try {
      const { view, root, next } = renderSample()
      expect(view.getByText(TITLE, { selector: '[data-presentation-deck-title]' })).toBeTruthy()
      expect(root().getAttribute('data-presentation-mode')).toBe('browse')
      const forward: string[] = []
      for (let i = 0; i < STEPS.length; i++) {
        await waitFor(() => expect(root().getAttribute('data-step-index')).toBe(String(i)))
        forward.push(view.container.querySelector('[data-presentation-caption]')!.textContent!)
        if (i < STEPS.length - 1) next()
      }
      expect(forward).toEqual(STEPS.map((step) => step.caption))
      const backward: string[] = []
      for (let i = STEPS.length - 1; i >= 0; i--) {
        await waitFor(() => expect(root().getAttribute('data-step-index')).toBe(String(i)))
        backward.push(view.container.querySelector('[data-presentation-caption]')!.textContent!)
        if (i > 0) fireEvent.click(view.container.querySelector('[data-presentation-control="prev"]') as HTMLElement)
      }
      expect(backward).toEqual(STEPS.map((step) => step.caption).reverse())
    } finally {
      window.removeEventListener('error', onError)
      consoleError.mockRestore()
    }
    expect(errors).toEqual([])
  })

  it('starts in browse mode and toggles to present without moving', () => {
    const { root, view } = renderSample()
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))
    })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(view.container.querySelector('[data-presentation-caption]')).toBeNull()
  })
})

describe('sample registration', () => {
  it('keeps every registry slug unique and its loader renderable', async () => {
    const slugs = PRESENTATIONS.map((entry) => entry.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const entry of PRESENTATIONS) {
      expect((await entry.load()).default).toBeTypeOf('function')
    }
  })

  it('registers the reference slug and resolves its route to a renderable component', async () => {
    const entry = PRESENTATIONS.find((candidate) => candidate.slug === 'how-to-make-a-presentation')
    expect(entry).toBeDefined()
    expect(entry!.title).toBe(TITLE)
    expect(resolveRoute('/how-to-make-a-presentation', PRESENTATIONS)).toEqual({ kind: 'presentation', entry })
    const loaded = await entry!.load()
    expect(loaded.default).toBeTypeOf('function')
  })

})
