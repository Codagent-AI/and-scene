import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTemp, copyProject, portClosed, repoRoot, run, tempDir } from './helpers'

afterAll(cleanupTemp)

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, renders all nine steps on 127.0.0.1, and exits zero with a clear pass', () => {
    const res = run('npm', ['run', 'verify'], { cwd: repoRoot })
    expect(res.status).toBe(0)
    expect(res.output).toContain('[verify] build: ok')
    expect(res.output).toMatch(/\[verify\] registry: ok \(.*how-to-make-a-presentation/)
    expect(res.output).toMatch(/rendered how-to-make-a-presentation: 9 steps via http:\/\/127\.0\.0\.1:\d+/)
    expect(res.output).toMatch(/\[verify\] preview: http:\/\/127\.0\.0\.1:\d+/)
    expect(res.output).not.toMatch(/localhost|\[::1\]/)
    expect(res.output).toContain('[verify] PASS')
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const edit = (dir: string, rel: string, fn: (s: string) => string) => {
    const file = path.join(dir, rel)
    writeFileSync(file, fn(readFileSync(file, 'utf8')))
  }
  const faults: { name: string; phase: string; step?: number; mutate: (dir: string) => void; expectText?: RegExp }[] = [
    {
      name: 'a build-breaking edit',
      phase: 'build',
      mutate: (d) => edit(d, 'src/presentation-kit/constants.ts', (s) => `${s}\nexport const broken: number = 'not a number'\n`),
    },
    {
      name: 'a missing sample registration',
      phase: 'registry',
      mutate: (d) =>
        edit(d, 'src/presentations/index.ts', (s) => s.replace(/\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '')),
      expectText: /how-to-make-a-presentation.*not registered/,
    },
    {
      name: 'an out-of-order sample',
      phase: 'render',
      step: 0,
      mutate: (d) =>
        edit(d, 'src/presentations/how-to-make-a-presentation/steps/index.ts', (s) =>
          s.replace('  step1,\n  step2,\n', '  step2,\n  step1,\n'),
        ),
      expectText: /does not match/,
    },
    {
      name: 'a wrong caption when the sample opens in present mode',
      phase: 'render',
      step: 0,
      mutate: (d) => {
        edit(d, 'src/presentations/how-to-make-a-presentation/Talk.tsx', (s) => s.replace('initialMode="browse"', 'initialMode="present"'))
        edit(d, 'src/presentations/how-to-make-a-presentation/steps/01-topic.ts', (s) => s.replace('mild overconfidence.', 'WRONG CAPTION'))
      },
      expectText: /caption .*WRONG CAPTION.* does not match/,
    },
    {
      name: 'a step that emits a browser error',
      phase: 'render',
      step: 2,
      mutate: (d) =>
        edit(d, 'src/presentations/how-to-make-a-presentation/steps/SampleScene.tsx', (s) =>
          s.replace('  const cardsShown', "  if (n === 3) console.error('boom from step three')\n  const cardsShown"),
        ),
      expectText: /boom from step three/,
    },
    {
      name: 'a transition that does not advance the step index',
      phase: 'render',
      step: 1,
      mutate: (d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace("const NEXT_KEYS = ['ArrowRight', ' ', 'PageDown']", 'const NEXT_KEYS: string[] = []')),
      expectText: /did not advance/,
    },
  ]

  for (const fault of faults) {
    it(`fails non-zero naming the failed phase for ${fault.name}`, async () => {
      const dir = tempDir('e2e')
      copyProject(repoRoot, path.join(dir, 'app'), ['skills', 'tests'])
      const app = path.join(dir, 'app')
      fault.mutate(app)
      const res = run('node', ['scripts/verify.mjs'], { cwd: app })
      expect(res.status).not.toBe(0)
      expect(res.output).not.toContain('[verify] PASS')
      const stepPart = fault.step === undefined ? '' : ` step=${fault.step}`
      expect(res.output).toContain(`[verify] FAIL phase=${fault.phase}${stepPart}`)
      if (fault.expectText) expect(res.output).toMatch(fault.expectText)
      const origin = res.output.match(/\[verify\] preview: (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
      if (fault.phase === 'render') {
        expect(origin).toBeDefined()
        expect(await portClosed(origin!)).toBe(true)
      }
    })
  }
})

describe('E2E-003: browse chrome is never clipped at a narrow viewport', () => {
  it('keeps the title, caption, and controls of every sample step fully visible at 390 x 844', async () => {
    const { chromium } = await import('playwright')
    const { buildApp, startPreview } = await import('../../scripts/lib/preview.mjs')
    expect(buildApp(repoRoot)).toBe(true)
    const preview = await startPreview(repoRoot)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await page.goto(`${preview.origin}/how-to-make-a-presentation`)
      await page.waitForSelector('[data-presentation-root]')
      const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
      const clipped: string[] = []
      for (let step = 0; step < count; step++) {
        await page.waitForTimeout(200)
        const found = await page.evaluate(() =>
          ['[data-presentation-step-title]', '[data-presentation-caption]', '[data-presentation-progress]'].flatMap((sel) => {
            const el = document.querySelector(sel)
            if (!el) return [`${sel} missing`]
            const r = el.getBoundingClientRect()
            let clip = { top: 0, bottom: innerHeight }
            for (let a = el.parentElement; a; a = a.parentElement) {
              if (getComputedStyle(a).overflowY === 'visible') continue
              const b = a.getBoundingClientRect()
              clip = { top: Math.max(clip.top, b.top), bottom: Math.min(clip.bottom, b.bottom) }
            }
            return r.top < clip.top - 0.5 || r.bottom > clip.bottom + 0.5 ? [`${sel} spans ${r.top}-${r.bottom}, visible ${clip.top}-${clip.bottom}`] : []
          }),
        )
        clipped.push(...found.map((f) => `step ${step + 1}: ${f}`))
        if (step < count - 1) await page.keyboard.press('ArrowRight')
      }
      expect(clipped).toEqual([])
    } finally {
      await browser.close()
      await preview.stop()
    }
  })
})
