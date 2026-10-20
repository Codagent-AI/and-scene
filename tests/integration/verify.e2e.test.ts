// E2E-001 and E2E-002: `npm run verify` on the reference sample and on faulty copies.
import { readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { canConnect, copyRepo, isAlive, previewPid, previewPort, repoRoot, run } from './helpers.ts'

const verify = (cwd: string) => run('npm', ['run', 'verify'], cwd)

describe('E2E-001 reference presentation passes production verification', () => {
  const result = verify(repoRoot)

  it('exits zero with a clear pass and every phase green', () => {
    expect(result.status, result.output).toBe(0)
    for (const phase of ['build', 'sample', 'render']) expect(result.output).toContain(`phase ${phase}: PASS`)
    expect(result.output).toContain('VERIFY PASSED')
    expect(result.output).not.toContain('FAILED')
  })

  it('opens the registered sample route and observes all nine steps in order', () => {
    expect(result.output).toMatch(/render http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    const seen = [...result.output.matchAll(/\[verify\] step (\d+) of 8 ok/g)].map((m) => Number(m[1]))
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('uses 127.0.0.1 for the preview host, readiness probe, and browser URLs', async () => {
    const urls = [...result.output.matchAll(/https?:\/\/[^\s/]+/g)].map((m) => m[0])
    expect(urls.length).toBeGreaterThanOrEqual(2)
    for (const u of urls) expect(u).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(result.output).not.toMatch(/localhost|\[::1\]/)
    expect(await canConnect(previewPort(result.output))).toBe(false) // preview was cleaned up
    expect(isAlive(previewPid(result.output))).toBe(false) // and its owned process has exited
  })
})

interface Fault {
  name: string
  apply: (root: string) => void
  phase: string
  step?: number
  message: RegExp
  /** Whether the failure happens before any preview or browser is started. */
  beforeBrowser: boolean
}

const sampleDir = 'src/presentations/how-to-make-a-presentation'
const edit = (root: string, rel: string, fn: (s: string) => string) => {
  const file = path.join(root, rel)
  const before = readFileSync(file, 'utf8')
  const after = fn(before)
  if (before === after) throw new Error(`fault injection did not change ${rel}`)
  writeFileSync(file, after)
}

const faults: Fault[] = [
  {
    name: 'a build-breaking type error',
    apply: (r) => appendFileSync(path.join(r, 'src/routing.ts'), "\nexport const broken: number = 'not a number'\n"),
    phase: 'build',
    message: /npm run build failed[\s\S]*TS2322/,
    beforeBrowser: true,
  },
  {
    name: 'a missing sample',
    apply: (r) => {
      rmSync(path.join(r, sampleDir), { recursive: true })
      edit(r, 'src/presentations/index.ts', (s) => s.replace(/\s*\{[^{}]*how-to-make-a-presentation[^{}]*\},?/, ''))
    },
    phase: 'sample',
    message: /not registered|cannot load|missing/,
    beforeBrowser: true,
  },
  {
    name: 'an out-of-order sample',
    apply: (r) =>
      edit(r, `${sampleDir}/steps/meta.ts`, (s) =>
        s.replace("title: 'You have a topic'", "title: 'The skill interviews you'").replace("title: 'The skill interviews you',\n    caption: 'One question", "title: 'You have a topic',\n    caption: 'One question"),
      ),
    phase: 'sample',
    step: 0,
    message: /sample step 0 title/,
    beforeBrowser: true,
  },
  {
    name: 'a console error while a step renders',
    apply: (r) =>
      edit(r, `${sampleDir}/SampleScene.tsx`, (s) =>
        s.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 4) console.error('injected console fault')"),
      ),
    phase: 'render',
    step: 3,
    message: /console error: injected console fault/,
    beforeBrowser: false,
  },
  {
    name: 'an exception thrown while a step renders',
    apply: (r) =>
      edit(r, `${sampleDir}/SampleScene.tsx`, (s) =>
        s.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 6) throw new Error('injected render fault')"),
      ),
    phase: 'render',
    step: 5,
    message: /injected render fault/,
    beforeBrowser: false,
  },
  {
    name: 'an uncaught exception on a later step',
    apply: (r) =>
      edit(r, `${sampleDir}/SampleScene.tsx`, (s) =>
        s.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 7) setTimeout(() => { throw new Error('injected page fault') }, 50)"),
      ),
    phase: 'render',
    step: 6,
    message: /page error: injected page fault/,
    beforeBrowser: false,
  },
  {
    name: 'a transition that does not advance the step index',
    apply: (r) =>
      edit(r, 'src/presentation-kit/usePresentationNav.ts', (s) =>
        s.replace('setIndex((i) => Math.min(i + 1, last))', 'setIndex((i) => (i === 2 ? i : Math.min(i + 1, last)))'),
      ),
    phase: 'render',
    step: 2,
    message: /did not advance from step 2 to 3/,
    beforeBrowser: false,
  },
]

describe.each(faults)('E2E-002 verification failure: $name', (fault) => {
  const root = copyRepo()
  fault.apply(root)
  const result = verify(root)

  it('exits non-zero and never reports success', () => {
    expect(result.status, result.output).not.toBe(0)
    expect(result.output).not.toContain('VERIFY PASSED')
    expect(result.output).toContain('VERIFY FAILED')
  })

  it('names the failed phase and, for step faults, the offending step', () => {
    const step = fault.step === undefined ? '' : ` step=${fault.step}`
    expect(result.output).toContain(`VERIFY FAILED phase=${fault.phase}${step}`)
    expect(result.output).toMatch(fault.message)
  })

  it('stops before starting a browser when the fault is not a render fault, and cleans up otherwise', async () => {
    if (fault.beforeBrowser) {
      expect(result.output).not.toContain('preview http')
    } else {
      expect(await canConnect(previewPort(result.output))).toBe(false)
      expect(isAlive(previewPid(result.output))).toBe(false)
    }
  })

  it('leaves the source checkout untouched', () => {
    expect(readFileSync(path.join(repoRoot, 'src/routing.ts'), 'utf8')).not.toContain('broken')
  })
})

describe('E2E-001 registry comments', () => {
  it('does not treat a commented example entry as a route to visit', () => {
    const root = copyRepo()
    edit(root, 'src/presentations/index.ts', (s) =>
      `// Example: { "slug": "comment-only", "title": "Not registered", "load": () => import("./not-a-route") }\n${s}`,
    )
    const result = verify(root)
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('VERIFY PASSED')
    expect(result.output).not.toContain('comment-only')
  })
})
