import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { checkOutline, createErrorCollector, isAdvance, normalize, parseRegistry, planRoutes, VerifyFailure } from '../../scripts/lib/verify-lib.mjs'

const registrySource = `
export const presentations: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
  { slug: "second", title: "Second", load: () => import('./second/Talk') },
]`

describe('registry parsing and route planning', () => {
  it('reads every slug and title from the explicit registry', () => {
    expect(parseRegistry(registrySource)).toEqual([
      { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation' },
      { slug: 'second', title: 'Second' },
    ])
    expect(parseRegistry('export const presentations = []')).toEqual([])
  })

  it('plans the required presentation first, then every other registered one', () => {
    const registered = parseRegistry(registrySource)
    expect(planRoutes(registered, 'second')).toEqual(['second', 'how-to-make-a-presentation'])
    expect(planRoutes(registered, undefined)).toEqual(['how-to-make-a-presentation', 'second'])
  })

  it('fails the sample phase when the required presentation is not registered', () => {
    expect(() => planRoutes([{ slug: 'other', title: 'Other' }], 'missing')).toThrowError(VerifyFailure)
    try {
      planRoutes([], 'missing')
    } catch (error) {
      expect((error as VerifyFailure).phase).toBe('sample')
    }
  })

  it('plans non-sample failures too: two registered entries with different counts both get routes', () => {
    expect(planRoutes([{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }, { slug: 'c', title: 'C' }], 'b')).toEqual(['b', 'a', 'c'])
  })
})

describe('outline checking', () => {
  const expected = [
    { era: 'one', title: 'First', caption: 'The first caption.' },
    { era: 'two', title: 'Second', caption: 'The second caption.' },
  ]

  it('accepts matching narration, normalising whitespace only', () => {
    expect(checkOutline([{ era: ' one', title: 'First', caption: 'The  first\ncaption.' }, expected[1]], expected)).toEqual([])
    expect(normalize('  a \n b ')).toBe('a b')
  })

  it('reports a wrong step count', () => {
    expect(checkOutline([expected[0]], expected)[0]).toMatch(/expected 2 steps but found 1/)
    expect(checkOutline([...expected, expected[0]], expected)[0]).toMatch(/expected 2 steps but found 3/)
  })

  it('reports out-of-order or malformed title, caption and era fields independently', () => {
    const problems = checkOutline([expected[1], { era: 'x', title: 'Second', caption: null as never }], expected)
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/step 1 era/),
        expect.stringMatching(/step 1 title/),
        expect.stringMatching(/step 1 caption/),
        expect.stringMatching(/step 2 era/),
        expect.stringMatching(/step 2 caption/),
      ]),
    )
    expect(problems.some((p) => p.startsWith('step 2 title'))).toBe(false)
  })

  it('does not alter punctuation: a curly apostrophe differs from a straight one', () => {
    expect(checkOutline([{ era: 'a', title: 'You’re', caption: 'c' }], [{ era: 'a', title: "You're", caption: 'c' }])).toHaveLength(1)
  })
})

describe('transition validation', () => {
  it('accepts only an increment of exactly one', () => {
    expect(isAdvance(2, 3)).toBe(true)
    expect(isAdvance(2, 2)).toBe(false) // did not advance
    expect(isAdvance(2, 4)).toBe(false) // skipped a step
    expect(isAdvance(2, 1)).toBe(false) // went backwards
    expect(isAdvance(2, Number.NaN)).toBe(false)
  })
})

describe('browser error collection', () => {
  const fakePage = () => {
    const page = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] }
    return page
  }
  const message = (type: string, text: string) => ({ type: () => type, text: () => text })

  it('records console errors, uncaught page errors and failed requests with the step label', () => {
    const page = fakePage()
    const collector = createErrorCollector(page as never)
    page.emit('console', message('error', 'early'))
    collector.setLabel('step 4 of 9')
    page.emit('console', message('error', 'boom'))
    page.emit('pageerror', new Error('uncaught'))
    page.emit('requestfailed', { url: () => 'http://x/y.js', failure: () => ({ errorText: 'net::ERR_FAILED' }) })
    const errors = collector.drain()
    expect(errors).toHaveLength(4)
    expect(errors[0]).toContain('initial load')
    expect(errors[1]).toContain('step 4 of 9')
    expect(errors[1]).toContain('boom')
    expect(errors[2]).toContain('uncaught')
    expect(errors[3]).toContain('net::ERR_FAILED')
    expect(collector.drain()).toEqual([])
  })

  it('ignores warnings and other console output', () => {
    const page = fakePage()
    const collector = createErrorCollector(page as never)
    page.emit('console', message('warning', 'careful'))
    page.emit('console', message('log', 'hi'))
    expect(collector.drain()).toEqual([])
  })
})
