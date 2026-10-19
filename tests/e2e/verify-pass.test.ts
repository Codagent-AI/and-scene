import { describe, expect, it } from 'vitest'
import { alive, previewPid, REPO, run } from '../helpers/proc.ts'
import { NARRATION } from '../../src/presentations/how-to-make-a-presentation/narration.ts'

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1, steps through all nine steps and exits zero with a clear pass', async () => {
    const r = await run('npm', ['run', 'verify'], REPO)
    expect(r.out).toContain('verify: PASS')
    expect(r.code).toBe(0)
    // build, sample and render phases ran in order
    const order = ['verify: phase build', 'verify: build passed', 'verify: phase sample', 'verify: phase render', 'verify: PASS'].map((s) => r.out.indexOf(s))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    // registered and reachable sample, with its nine normative titles observed in order
    expect(r.out).toContain('"how-to-make-a-presentation" is registered with 9 steps in order')
    const seen = [...r.out.matchAll(/verify: step (\d+) rendered \((.*)\)/g)].map((m) => [Number(m[1]), m[2]])
    expect(seen).toEqual(NARRATION.map((n, i) => [i, n.title]))
    // the readiness probe and browser used the IPv4 loopback address
    expect(r.out).toMatch(/preview on 127\.0\.0\.1/)
    expect(r.out).toMatch(/preview ready at http:\/\/127\.0\.0\.1:\d+\//)
    expect(r.out).not.toMatch(/localhost/)
    expect(r.out).not.toMatch(/FAIL/)
    // no preview left behind
    const pid = previewPid(r.out)
    expect(pid).toBeDefined()
    expect(alive(pid!)).toBe(false)
  })
})
