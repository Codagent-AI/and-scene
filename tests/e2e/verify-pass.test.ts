// E2E-001: the reference presentation passes production verification.
import fs from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo } from '../helpers/copy.ts'
import { sh, type Result } from '../helpers/materialize.ts'

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

let dir = ''
let run: Result

beforeAll(() => {
  dir = copyRepo('and-scene-e2e001')
  run = sh('npm', ['run', 'verify'], dir)
})
afterAll(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

describe('E2E-001 npm run verify on the reference presentation', () => {
  it('exits zero with a clear pass result', () => {
    expect(run.code, run.out).toBe(0)
    expect(run.out).toContain('[verify] VERIFY PASSED')
    expect(run.out).not.toContain('FAIL')
  })

  it('builds the app, then confirms the sample is registered', () => {
    expect(run.out).toContain('PASS build')
    expect(run.out).toContain('PASS sample registry')
    expect(run.out.indexOf('PASS build')).toBeLessThan(run.out.indexOf('PASS sample registry'))
  })

  it('observes all nine step indices, with every normative title in order', () => {
    const seen = [...run.out.matchAll(/step (\d)\/9 ok: (.*)/g)]
    expect(seen.map((m) => Number(m[1]))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(seen.map((m) => m[2])).toEqual(TITLES)
    expect(run.out).toContain('PASS render how-to-make-a-presentation (9 steps)')
  })

  it('uses the 127.0.0.1 host for the preview and browser URLs', () => {
    expect(run.out).toMatch(/preview ready at http:\/\/127\.0\.0\.1:\d+/)
    expect(run.out).toMatch(/render http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(run.out).not.toMatch(/localhost|\[::1\]/)
  })

  it('leaves no preview server running', async () => {
    const url = /preview ready at (http:\/\/127\.0\.0\.1:\d+)/.exec(run.out)![1]
    await expect(fetch(url, { signal: AbortSignal.timeout(2000) })).rejects.toThrow()
  })
})
