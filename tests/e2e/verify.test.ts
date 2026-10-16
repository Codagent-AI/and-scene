import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { edit, makeRepoCopy, removeCopy, SOURCE_ROOT } from '../helpers/repoCopy'
import { runNode } from '../helpers/scripts'

const copies: string[] = []
afterAll(() => copies.forEach(removeCopy))
const fresh = () => {
  const c = makeRepoCopy()
  copies.push(c)
  return c
}
const SLUG = 'how-to-make-a-presentation'

function portOpen(port: number) {
  return new Promise<boolean>((resolve) => {
    const s = net.connect(port, '127.0.0.1')
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })
}
async function previewPort(out: string) {
  const m = /preview: ok \(http:\/\/127\.0\.0\.1:(\d+)\)/.exec(out)
  return m ? Number(m[1]) : null
}

describe('E2E-001 reference presentation passes verification', () => {
  it('builds, previews on 127.0.0.1, and renders all nine steps', async () => {
    const copy = fresh()
    const r = await runNode(copy, 'verify.mjs')
    expect(r.out).toMatch(/PASS verify/)
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/render: ok how-to-make-a-presentation \(9 steps at http:\/\/127\.0\.0\.1:\d+\//)
    expect(r.out).not.toMatch(/localhost/)
    const port = await previewPort(r.out)
    expect(port).not.toBeNull()
    expect(await portOpen(port!)).toBe(false)
  }, 290000)

  it('--slug restricts rendering and fails clearly on unknown slugs', async () => {
    const copy = fresh()
    const ok = await runNode(copy, 'verify.mjs', ['--slug', SLUG])
    expect(ok.code).toBe(0)
    const bad = await runNode(copy, 'verify.mjs', ['--slug', 'nope'])
    expect(bad.code).not.toBe(0)
    expect(bad.out).toMatch(/FAIL verify \[config\].*"nope"/)
    expect(bad.out).not.toMatch(/PASS/)
  }, 290000)
})

describe('E2E-002 verification failures are actionable', () => {
  const sceneFile = 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'
  const faults: { name: string; phase: string; step?: number; apply: (dir: string) => void }[] = [
    { name: 'build-breaking edit', phase: 'build', apply: (d) => edit(d, 'src/presentations/how-to-make-a-presentation/Talk.tsx', (s) => s + '\nexport const broken: number = "x"\n') },
    { name: 'missing sample', phase: 'sample', apply: (d) => edit(d, 'src/presentations/index.ts', (s) => s.replace(/how-to-make-a-presentation/, 'renamed-sample')) },
    { name: 'out-of-order sample', phase: 'sample', apply: (d) => edit(d, 'scripts/verification.config.json', (s) => s.replace('"The skill interviews you"', '"TMP"').replace('"The deck grows"', '"The skill interviews you"').replace('"TMP"', '"The deck grows"')) },
    {
      name: 'console error on a step',
      phase: 'render',
      step: 4,
      apply: (d) => edit(d, sceneFile, (s) => s.replace('const b = payload.beat', "const b = payload.beat\n  if (b === 4) console.error('boom at step 4')")),
    },
    {
      name: 'transition that does not advance',
      phase: 'render',
      step: 3,
      apply: (d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace('const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => (i === 1 ? i : clampIndex(i + 1, count))), [count])')),
    },
  ]
  for (const f of faults) {
    it(`fails on ${f.name}`, async () => {
      const copy = fresh()
      f.apply(copy)
      const r = await runNode(copy, 'verify.mjs')
      expect(r.code).not.toBe(0)
      expect(r.out).toMatch(new RegExp(`FAIL verify \\[${f.phase}\\]${f.step ? ` step ${f.step}` : ''}`))
      expect(r.out).not.toMatch(/PASS verify/)
      const port = await previewPort(r.out)
      if (port) expect(await portOpen(port)).toBe(false)
    }, 290000)
  }

  it('leaves the source checkout unchanged', () => {
    expect(fs.readFileSync(path.join(SOURCE_ROOT, sceneFile), 'utf8')).not.toMatch(/boom at step 4/)
    expect(fs.readFileSync(path.join(SOURCE_ROOT, 'src/presentations/index.ts'), 'utf8')).not.toMatch(/renamed-sample|inspection-fixture/)
  })
})
