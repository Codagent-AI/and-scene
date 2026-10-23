import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alive, canBind, cleanupTempDirs, edit, run, sourceState, throwawayCopy, type Result } from '../integration/support'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const SCENE = `${SAMPLE}/TalkScene.tsx`

interface Fault {
  name: string
  covers: string
  apply: (dir: string) => void
  phase: string
  step?: number
  message?: RegExp
  previewStarted: boolean
}

const faults: Fault[] = [
  {
    name: 'build break in a non-sample module',
    covers: 'L-51, I-29',
    apply: (d) => edit(d, 'src/Landing.tsx', (t) => t.replace('href={`/${entry.slug}`}', 'href={42}')),
    phase: 'build',
    message: /npm run build failed/,
    previewStarted: false,
  },
  {
    name: 'sample missing from the registry (still builds)',
    covers: 'L-52, I-26',
    apply: (d) => edit(d, 'src/presentations/index.ts', (t) => t.replace(/\[\n[\s\S]*\n\]/, '[]')),
    phase: 'sample',
    message: /not registered/,
    previewStarted: false,
  },
  {
    name: 'sample steps out of order (still builds)',
    covers: 'L-52, I-26',
    apply: (d) =>
      edit(d, `${SAMPLE}/outline.ts`, (t) => t.replace("title: 'The deck grows'", "title: 'TMP'").replace("title: 'Answers become steps'", "title: 'The deck grows'").replace("title: 'TMP'", "title: 'Answers become steps'")),
    phase: 'sample',
    message: /step 3 title.*step 4 title/s,
    previewStarted: false,
  },
  {
    name: 'sample caption malformed (still builds)',
    covers: 'L-52',
    apply: (d) => edit(d, `${SAMPLE}/outline.ts`, (t) => t.replace('Thanks for watching.', 'Thanks!')),
    phase: 'sample',
    message: /step 9 caption/,
    previewStarted: false,
  },
  {
    name: 'console.error while entering step 4',
    covers: 'L-55, I-28',
    apply: (d) => edit(d, SCENE, (t) => t.replace('const stubbed = n < 4', "if (n === 4) console.error('injected console failure')\n  const stubbed = n < 4")),
    phase: 'render',
    step: 4,
    message: /injected console failure/,
    previewStarted: true,
  },
  {
    name: 'console.error on the first step',
    covers: 'L-55',
    apply: (d) => edit(d, SCENE, (t) => t.replace('const stubbed = n < 4', "if (n === 1) console.error('first step failure')\n  const stubbed = n < 4")),
    phase: 'render',
    step: 1,
    message: /first step failure/,
    previewStarted: true,
  },
  {
    name: 'uncaught page error on step 2',
    covers: 'L-55',
    apply: (d) =>
      edit(d, SCENE, (t) => t.replace('const stubbed = n < 4', "if (n === 2) setTimeout(() => { throw new Error('injected page error') }, 20)\n  const stubbed = n < 4")),
    phase: 'render',
    step: 2,
    message: /injected page error/,
    previewStarted: true,
  },
  {
    name: 'render fault that breaks step 6',
    covers: 'L-56, I-28',
    apply: (d) => edit(d, SCENE, (t) => t.replace('const stubbed = n < 4', "if (n === 6) throw new Error('injected render fault')\n  const stubbed = n < 4")),
    phase: 'render',
    step: 6,
    previewStarted: true,
  },
  {
    name: 'transition that does not advance the step index',
    covers: 'L-56, I-28',
    apply: (d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', (t) => t.replace('setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => clampIndex(Math.min(i + 1, 2), count))')),
    phase: 'render',
    step: 4,
    message: /transition did not advance: step index expected 3 but was 2/,
    previewStarted: true,
  },
]

// E2E-002: every fault in its own disposable copy, never touching the source checkout.
describe('E2E-002: verification failures are actionable', () => {
  let before: string
  const results = new Map<string, Result>()
  beforeAll(async () => {
    before = sourceState()
    const copies = faults.map((f) => {
      const dir = throwawayCopy('e2e2')
      f.apply(dir)
      return [f, dir] as const
    })
    for (const [f, dir] of copies) results.set(f.name, await run('npm', ['run', 'verify'], dir))
  })
  afterAll(cleanupTempDirs)

  it.each(faults.map((f) => [f.name, f] as const))('%s', async (_name, f) => {
    const r = results.get(f.name)!
    expect(r.code, r.output).not.toBe(0)
    expect(r.output).not.toMatch(/VERIFY PASS/)
    const line = r.output.split('\n').find((l) => l.startsWith('VERIFY FAIL'))
    expect(line, r.output).toBeTruthy()
    expect(line).toMatch(new RegExp(`phase=${f.phase}`))
    if (f.step) expect(line).toMatch(new RegExp(`step=${f.step}:`))
    else expect(line).not.toMatch(/step=\d/)
    if (f.message) expect(r.output).toMatch(f.message)
    const preview = /preview pid=(\d+).*probe=http:\/\/127\.0\.0\.1:(\d+)\//.exec(r.output)
    expect(Boolean(preview)).toBe(f.previewStarted)
    if (preview) {
      expect(alive(Number(preview[1]))).toBe(false)
      expect(await canBind(Number(preview[2]))).toBe(true)
    }
  })

  it('leaves the source checkout unchanged (C-4)', () => {
    expect(sourceState()).toBe(before)
  })
})
