import { afterAll, describe, expect, it } from 'vitest'
import net from 'node:net'
import { readFileSync } from 'node:fs'
import { copyRepo, sh } from '../helpers/repo-copy'

const copies: ReturnType<typeof copyRepo>[] = []
const fresh = () => {
  const c = copyRepo('verify-e2e-')
  copies.push(c)
  return c
}
afterAll(() => copies.forEach((c) => c.remove()))

const verify = (dir: string) => sh('npm', ['run', 'verify'], dir)
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

const portOpen = (port: number) =>
  new Promise<boolean>((resolve) => {
    const s = net.connect(port, '127.0.0.1')
    s.once('connect', () => { s.destroy(); resolve(true) })
    s.once('error', () => resolve(false))
  })

async function expectCleanFailure(out: string, status: number | null, phase: string) {
  expect(status).not.toBe(0)
  expect(out).toContain(`verify: FAIL (phase: ${phase}`)
  expect(out).not.toContain('verify: PASS')
  const port = out.match(/preview at http:\/\/127\.0\.0\.1:(\d+)/)?.[1]
  if (port) expect(await portOpen(Number(port)), 'preview left running').toBe(false)
}

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1, steps through all nine steps and exits zero', () => {
    const copy = fresh()
    const { status, out } = verify(copy.dir)
    expect(out).toContain('verify: [build] PASS')
    expect(out).toContain('verify: [registry] PASS (how-to-make-a-presentation)')
    expect(out).toMatch(/preview at http:\/\/127\.0\.0\.1:\d+ \(host 127\.0\.0\.1\)/)
    expect(out).toContain('verify: [render] PASS how-to-make-a-presentation (9 steps)')
    expect(out).toMatch(/verify: PASS\s*$/)
    expect(out).not.toContain('FAIL')
    expect(status).toBe(0)
  })

  it('never refers to localhost in the verification or inspection tooling', () => {
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/runtime.mjs']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/localhost/)
    }
    expect(readFileSync('scripts/lib/runtime.mjs', 'utf8')).toContain("HOST = '127.0.0.1'")
  })
})

describe('E2E-002: verification failures are actionable', () => {
  it('fails on a build error and names the build phase', async () => {
    const c = fresh()
    c.edit(`${SAMPLE}/Talk.tsx`, 'export default function Talk', "const broken: number = 'not a number'\nexport default function Talk")
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'build')
    expect(out).toContain('not a number')
  })

  it('fails when the reference sample is not registered', async () => {
    const c = fresh()
    c.edit('src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'something-else'")
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'reference')
    expect(out).toContain('"how-to-make-a-presentation" is not registered')
  })

  it('fails when the sample is out of order or malformed', async () => {
    const c = fresh()
    c.edit(`${SAMPLE}/steps/index.ts`, "title: 'You have a topic'", "title: 'Something else'")
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'reference')
    expect(out).toContain('step 1 title')
  })

  it('fails on a console error and identifies the step', async () => {
    const c = fresh()
    c.edit(`${SAMPLE}/steps/Scene.tsx`, 'const items: ReactElement[] = []', "const items: ReactElement[] = []\n  if (s === 5) console.error('injected failure')")
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'render')
    expect(out).toMatch(/phase: render, step 5\)/)
    expect(out).toContain('injected failure')
  })

  it('fails on an uncaught render exception and identifies the step', async () => {
    const c = fresh()
    c.edit(`${SAMPLE}/steps/Scene.tsx`, 'const items: ReactElement[] = []', "const items: ReactElement[] = []\n  if (s === 6) throw new Error('step six exploded')")
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'render')
    expect(out).toMatch(/phase: render, step 6\)/)
  })

  it('fails when a transition does not advance the step index', async () => {
    const c = fresh()
    c.edit('src/presentation-kit/usePresentationNav.ts', 'clampIndex(i + 1, count)', 'clampIndex(i === 3 ? i : i + 1, count)')
    const { status, out } = verify(c.dir)
    await expectCleanFailure(out, status, 'render')
    expect(out).toMatch(/phase: render, step 5\)/)
    expect(out).toContain('transition did not advance')
  })
})
