import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '../../verify.config.json'
import { cleanupTempDirs, copyRepo, edit, isListening, previewPort, run, type RunResult } from '../support/repo'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

afterAll(cleanupTempDirs)

const outline = config.routes[0].outline!
const npmVerify = (cwd: string) => run('npm', ['run', 'verify'], { cwd })
const output = (r: RunResult) => r.stdout + r.stderr

describe('E2E-001: reference presentation passes production verification', () => {
  let result: RunResult
  beforeAll(async () => {
    result = await npmVerify(copyRepo('e2e-pass'))
  })

  it('exits zero with a clear pass result', () => {
    expect(result.code, output(result)).toBe(0)
    expect(result.stdout).toContain('verify: PASS (build ok; how-to-make-a-presentation: 9 steps)')
    expect(result.stderr).not.toContain('FAIL')
  })

  it('observes every step index 0-8 with the normative titles in order', () => {
    const seen = [...result.stdout.matchAll(/verify:\s+step index (\d+) ok: (.*)/g)].map((m) => [Number(m[1]), m[2]])
    expect(seen).toEqual(outline.map((o, i) => [i, o.title]))
  })

  it('uses the 127.0.0.1 loopback address for the preview and browser URLs', () => {
    const urls = [...result.stdout.matchAll(/https?:\/\/[^\s/]+/g)].map((m) => m[0])
    expect(urls.length).toBeGreaterThanOrEqual(2)
    for (const url of urls) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(output(result)).not.toMatch(/localhost|\[::1\]/)
  })

  it('leaves no preview server running', async () => {
    const port = previewPort(result.stdout)
    expect(port).toBeTypeOf('number')
    expect(await isListening(port!)).toBe(false)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const sample = 'src/presentations/how-to-make-a-presentation'

  /** Copy the repo, inject one fault, run verify; it must fail without claiming success or leaking a server. */
  async function faulty(prefix: string, inject: (dir: string) => void) {
    const dir = copyRepo(prefix)
    inject(dir)
    const r = await npmVerify(dir)
    expect(r.code, output(r)).not.toBe(0)
    expect(r.stdout).not.toContain('PASS')
    expect(output(r)).not.toContain('verify: PASS')
    const port = previewPort(r.stdout)
    if (port !== undefined) expect(await isListening(port), 'preview left running').toBe(false)
    return r
  }

  it('fails in the build phase for a type error in an unvisited presentation', async () => {
    const r = await faulty('e2e-build', (dir) => {
      const folder = path.join(dir, 'src/presentations/unvisited')
      edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [\n  { slug: 'unvisited', title: 'Unvisited', load: () => import('./unvisited/Talk') },"))
      mkdirSync(folder, { recursive: true })
      writeFileSync(path.join(folder, 'Talk.tsx'), "const n: number = 'not a number'\nexport default function Talk() {\n  return <p>{n}</p>\n}\n")
    })
    expect(r.stderr).toMatch(/verify: FAIL \[build\]/)
    expect(r.stderr).toMatch(/unvisited\/Talk\.tsx/)
  })

  it('fails in the sample phase when the sample is not registered', async () => {
    const r = await faulty('e2e-missing', (dir) =>
      edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n')),
    )
    expect(r.stderr).toMatch(/verify: FAIL \[sample\].*"how-to-make-a-presentation" is not registered/)
  })

  it('fails in the sample phase when the steps are out of order', async () => {
    const r = await faulty('e2e-order', (dir) =>
      edit(path.join(dir, sample, 'steps/index.ts'), (s) => s.replace('[s01, s02,', '[s02, s01,')),
    )
    expect(r.stderr).toMatch(/verify: FAIL \[sample\]/)
    expect(r.stderr).toMatch(/step 1 title: expected "You have a topic" but rendered "The skill interviews you"/)
  })

  it('fails in the render phase naming the step whose render logs a browser error', async () => {
    const r = await faulty('e2e-console', (dir) =>
      edit(path.join(dir, sample, 'Scene.tsx'), (s) =>
        s.replace("export function SampleScene({ payload: { beat } }: SceneProps<SamplePayload>) {\n", "export function SampleScene({ payload: { beat } }: SceneProps<SamplePayload>) {\n  if (beat === 4) console.error('injected failure')\n"),
      ),
    )
    expect(r.stderr).toMatch(/verify: FAIL \[render, step index 3\].*injected failure/)
  })

  it('fails in the render phase naming the step whose transition never advances', async () => {
    const r = await faulty('e2e-stall', (dir) =>
      edit(path.join(dir, sample, 'Talk.tsx'), (s) =>
        s + "\nwindow.addEventListener('keydown', (e) => { if (document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === '3') e.stopImmediatePropagation() }, true)\n",
      ),
    )
    expect(r.stderr).toMatch(/verify: FAIL \[render, step index 4\].*did not advance/)
  })
})
