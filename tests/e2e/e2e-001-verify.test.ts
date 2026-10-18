import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, isListening, previewPorts, remove, run, type RunResult } from '../support/sandbox'

// E2E-001: `npm run verify` against an isolated checkout holding the reference sample.
describe('E2E-001: reference presentation passes production verification', () => {
  let dir = ''
  let result: RunResult

  beforeAll(async () => {
    dir = copyRepo()
    result = await run('npm', ['run', 'verify'], { cwd: dir })
  })
  afterAll(() => remove(dir))

  it('exits zero with a clear pass result and no failure report', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/^VERIFY PASS$/m)
    expect(result.output).not.toMatch(/VERIFY FAIL/)
  })

  it('builds the whole app first, then checks registration and the nine-step outline', () => {
    const order = ['phase build: ok', 'phase registry: ok (how-to-make-a-presentation)', 'phase sample: ok (How to Use This Skill to Make a Presentation, 9 steps in order)']
    let at = -1
    for (const marker of order) {
      const next = result.output.indexOf(marker)
      expect(next, marker).toBeGreaterThan(at)
      at = next
    }
  })

  it('observes all nine step indices in order, with the normative titles, without errors', () => {
    const titles = [
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
    const seen = [...result.output.matchAll(/how-to-make-a-presentation step (\d)\/9 index=(\d) (".*")/g)]
    expect(seen.map((m) => [Number(m[1]), Number(m[2]), JSON.parse(m[3])])).toEqual(titles.map((t, i) => [i + 1, i, t]))
    expect(result.output).not.toMatch(/console\.error|pageerror/)
  })

  it('uses 127.0.0.1 for the preview host, readiness probe, and browser URL', () => {
    expect(result.output).toMatch(/\[preview\] waiting for http:\/\/127\.0\.0\.1:\d+\//)
    expect(result.output).toMatch(/\[verify\] preview http:\/\/127\.0\.0\.1:\d+\/ \(host 127\.0\.0\.1\)/)
    expect(result.output).toMatch(/phase render: http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(result.output).not.toMatch(/localhost|\[::1\]/)
    const ports = previewPorts(result.output)
    expect(ports).toHaveLength(1)
    const baseUrls = [...result.output.matchAll(/http:\/\/127\.0\.0\.1:(\d+)\//g)].map((m) => Number(m[1]))
    expect(new Set(baseUrls)).toEqual(new Set(ports))
  })

  it('leaves no preview process listening afterwards', async () => {
    for (const port of previewPorts(result.output)) expect(await isListening(port), `port ${port}`).toBe(false)
  })
})
