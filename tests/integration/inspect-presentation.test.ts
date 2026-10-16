import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadInspect, runNode } from '../helpers/scripts'
import { makeRepoCopy, registerFixture, removeCopy } from '../helpers/repoCopy'

// INT-002: screenshot helper emits faithful artifacts and advisory warnings.
describe('INT-002 inspection helper', () => {
  let copy = ''
  beforeAll(() => {
    copy = makeRepoCopy()
    registerFixture(copy)
  })
  afterAll(() => removeCopy(copy))

  it('captures settled per-step screenshots and step-specific advisory warnings', async () => {
    const { inspectPresentation } = await loadInspect()
    const log: { t: number; line: string }[] = []
    const out = path.join(copy, '.inspection', 'inspection-fixture')
    const settle = 500
    const { files, warnings } = await inspectPresentation({
      slug: 'inspection-fixture',
      root: copy,
      settle,
      log: (line) => log.push({ t: Date.now(), line }),
    })
    expect(files).toEqual([1, 2, 3].map((n) => path.join(out, `step-0${n}.png`)))
    for (const f of files) expect(fs.statSync(f).size).toBeGreaterThan(1000)

    // settle wait precedes each capture, by at least the configured interval
    for (let n = 1; n <= 3; n++) {
      const settling = log.find((l) => l.line.includes(`step ${n}: settling ${settle}ms`))!
      const captured = log.find((l) => l.line.includes(`step ${n}: captured`))!
      expect(settling).toBeDefined()
      expect(captured.t - settling.t).toBeGreaterThanOrEqual(settle - 20)
    }
    expect(log.every((l) => !l.line.includes('localhost'))).toBe(true)
    expect(log.some((l) => l.line.includes('http://127.0.0.1:'))).toBe(true)

    const at = (n: number) => warnings.filter((w) => w.startsWith(`WARN step ${n}:`))
    expect(at(2).some((w) => /overlap: .*collision alpha.*collision beta/.test(w))).toBe(true)
    expect(warnings.some((w) => /overlap/.test(w) && /allowed/.test(w))).toBe(false)
    expect(at(3).some((w) => /overlap/.test(w))).toBe(false)
    expect(at(1).some((w) => /overlap/.test(w))).toBe(false)
    for (const n of [1, 2, 3]) {
      expect(at(n).some((w) => /indistinct active chrome: active progress item/.test(w))).toBe(true)
      expect(at(n).some((w) => /browser-default/.test(w) && /data-presentation-attribution/.test(w))).toBe(true)
    }
  }, 240000)

  it('exits non-zero with a clear error for an unknown slug, zero for warnings', async () => {
    const bad = await runNode(copy, 'inspect-presentation.mjs', ['no-such-talk', '--no-build'])
    expect(bad.code).not.toBe(0)
    expect(bad.out).toMatch(/not registered/)
    const ok = await runNode(copy, 'inspect-presentation.mjs', ['inspection-fixture', '--no-build', '--settle', '50', '--viewport', '390x844', '--out', path.join(copy, 'narrow')])
    expect(ok.code).toBe(0)
    expect(ok.out).toMatch(/WARN step/)
    expect(fs.existsSync(path.join(copy, 'narrow', 'step-03.png'))).toBe(true)
  }, 240000)
})
