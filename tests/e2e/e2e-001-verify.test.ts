import { describe, expect, it } from 'vitest'
import { portListening, pidState, previewOf, ROOT, verify } from './helpers'

const TITLES = [
  'You have a topic',
  'The skill interviews you',
  'Answers become steps',
  'The deck grows',
  'You set the depth',
  'It assembles the scene',
  'It checks its own work',
  'Changed your mind? Loop it.',
  "You're looking at one",
]

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1, steps through all nine steps and reports a clear pass', async () => {
    const r = verify(ROOT)
    expect(r.status, r.output).toBe(0)
    expect(r.output).toContain('build ok')
    expect(r.output).toContain('sample: "how-to-make-a-presentation" is registered')
    TITLES.forEach((title, i) => expect(r.output).toContain(`step ${i + 1}/9 (index ${i}) ok: ${title}`))
    const positions = TITLES.map((_, i) => r.output.indexOf(`step ${i + 1}/9 (index ${i}) ok`))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(r.output).toMatch(/PASS verify: build, sample, render, transition \(9 steps\)/)
    expect(r.output).not.toMatch(/FAIL|localhost/)

    const preview = previewOf(r.output)!
    expect(preview.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(pidState(preview.pid)).not.toBe('running')
    expect(await portListening(preview.port)).toBe(false)
  })
})
