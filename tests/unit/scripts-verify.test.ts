import { describe, expect, it } from 'vitest'
import { Failure, OUTLINE, SAMPLE_SLUG, compareStep, formatFailure, isRegistered, loadConfig } from '../../scripts/verify.mjs'
import { read, ROOT, tmpDir, write } from './helpers'

describe('verify report formatting', () => {
  it.each([
    [{ phase: 'build', message: 'tsc failed' }, 'FAIL [build]: tsc failed'],
    [{ phase: 'sample', message: 'not registered' }, 'FAIL [sample]: not registered'],
    [{ phase: 'render', message: 'boom', step: 5, index: 4 }, 'FAIL [render] step 5 (index 4): boom'],
    [{ phase: 'transition', message: 'stuck', step: 3, index: 2 }, 'FAIL [transition] step 3 (index 2): stuck'],
  ])('formats %j', (failure, line) => {
    expect(formatFailure(failure)).toBe(line)
  })

  it('carries phase and step on Failure', () => {
    const f = new Failure('render', 'x', { step: 2, index: 1 })
    expect([f.phase, f.step, f.index, f.message]).toEqual(['render', 2, 1, 'x'])
  })
})

describe('sample checks', () => {
  it('embeds the nine normative steps in order', () => {
    expect(OUTLINE).toHaveLength(9)
    expect(OUTLINE.map((s: { title: string }) => s.title)).toEqual([
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ])
  })

  it('detects registration of a slug in the registry source', () => {
    const src = read(ROOT, 'src/presentations/index.ts')
    expect(isRegistered(src, SAMPLE_SLUG)).toBe(true)
    expect(isRegistered(src, 'other')).toBe(false)
    expect(isRegistered("{ slug: 'a-b', title: 'x' }", 'a.b')).toBe(false)
    expect(isRegistered('{ slug: "q" }', 'q')).toBe(true)
  })

  it('names the field that differs, for wrong text and wrong order', () => {
    const [a, b] = OUTLINE
    expect(compareStep(a, { ...a })).toBeNull()
    expect(compareStep(a, { ...a, title: 'Other' })).toMatch(/^title mismatch/)
    expect(compareStep(a, { ...a, caption: '' })).toMatch(/^caption mismatch/)
    expect(compareStep(a, { ...a, era: 'x' })).toMatch(/^era mismatch/)
    expect(compareStep(a, b)).not.toBeNull()
  })

  it('defaults to the reference sample with its outline, and honors a project config', () => {
    const empty = tmpDir()
    expect(loadConfig(empty)).toEqual({ slug: SAMPLE_SLUG, outline: true })
    write(empty, 'verify.config.json', '{ "slug": "mine" }')
    expect(loadConfig(empty)).toEqual({ slug: 'mine', outline: false })
  })
})

describe('IPv4 loopback', () => {
  it.each(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs', 'vite.config.ts'])(
    '%s never uses localhost',
    (file) => {
      expect(read(ROOT, file)).not.toMatch(/localhost|\[::1\]/)
    },
  )

  it('binds the preview and builds every URL on 127.0.0.1', () => {
    const preview = read(ROOT, 'scripts/lib/preview.mjs')
    expect(preview).toContain("HOST = '127.0.0.1'")
    expect(preview).toMatch(/'--host', HOST/)
    expect(preview).toMatch(/http:\/\/\$\{HOST\}/)
  })
})
