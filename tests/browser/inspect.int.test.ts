import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, copyRepo, editFile, repo, runNpm, type RunResult } from './helpers'

afterAll(cleanupTempDirs)

const VARIANTS = ['clean', 'collision', 'allowed', 'chrome', 'attribution'] as const
const exportName = (v: string) => v[0].toUpperCase() + v.slice(1)

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  let dir: string
  const runs = {} as Record<(typeof VARIANTS)[number], RunResult>
  let early: RunResult

  const shot = (variant: string, step: number) => path.join(dir, 'artifacts/inspection', `fx-${variant}`, `step-0${step}.png`)

  beforeAll(async () => {
    dir = copyRepo('int2-')
    mkdirSync(path.join(dir, 'src/presentations/fixtures'), { recursive: true })
    copyFileSync(path.join(repo, 'tests/browser/fixtures/variants.tsx.txt'), path.join(dir, 'src/presentations/fixtures/variants.tsx'))
    editFile(path.join(dir, 'src/presentations/index.ts'), (s) =>
      s.replace(
        /\n\]/,
        `\n${VARIANTS.map((v) => `  { slug: 'fx-${v}', title: 'Fixture ${v}', load: () => import('./fixtures/variants').then((m) => ({ default: m.${exportName(v)} })) },`).join('\n')}\n]`,
      ),
    )
    const first = await runNpm(dir, ['run', 'inspect', '--', 'fx-clean'])
    runs.clean = first
    for (const v of VARIANTS.slice(1)) runs[v] = await runNpm(dir, ['run', 'inspect', '--', `fx-${v}`, '--no-build'])
    early = await runNpm(dir, ['run', 'inspect', '--', 'fx-clean', '--no-build', '--settle-ms', '0', '--out', 'artifacts/early'])
  })

  const warnings = (variant: (typeof VARIANTS)[number]) => runs[variant].output.split('\n').filter((l) => l.startsWith('WARN'))

  it('writes one predictable, decodable PNG per step at 1440x900, each a distinct state', () => {
    for (const v of VARIANTS) expect(runs[v].code, runs[v].output).toBe(0)
    const hashes = [1, 2, 3].map((n) => {
      const file = shot('clean', n)
      expect(statSync(file).size).toBeGreaterThan(1000)
      const bytes = readFileSync(file)
      expect(bytes.subarray(1, 4).toString()).toBe('PNG')
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1440, 900])
      return createHash('sha1').update(bytes).digest('hex')
    })
    expect(new Set(hashes).size).toBe(3)
    expect(runs.clean.output).toContain('captured 3 step(s)')
    expect(runs.clean.output).toMatch(/opening http:\/\/127\.0\.0\.1:\d+\/fx-clean at 1440x900/)
  })

  it('captures only after the transition settles', async () => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const swatch = async (file: string) => {
        const b64 = readFileSync(file).toString('base64')
        await page.setContent('<canvas id="c" width="1440" height="900"></canvas>')
        return page.evaluate(async (data) => {
          const img = new Image()
          img.src = `data:image/png;base64,${data}`
          await img.decode()
          const canvas = document.getElementById('c') as HTMLCanvasElement
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          const area = ctx.getImageData(0, 0, 1440, 900)
          // the swatch lives inside the stage; count clearly red and clearly green pixels
          let red = 0
          let green = 0
          for (let i = 0; i < area.data.length; i += 4) {
            if (area.data[i] > area.data[i + 1] + 60) red++
            if (area.data[i + 1] > area.data[i] + 60) green++
          }
          return { red, green }
        }, b64)
      }
      expect(early.code, early.output).toBe(0)
      for (const step of [1, 2, 3]) {
        const settled = await swatch(shot('clean', step))
        expect(settled.green, `settled step ${step}`).toBeGreaterThan(500)
        expect(settled.red).toBeLessThan(settled.green / 10)
        if (step === 1) continue // the first step is still fading in when unsettled, so its colour proves nothing
        const unsettled = await swatch(path.join(dir, 'artifacts/early/fx-clean', `step-0${step}.png`))
        expect(unsettled.red, `unsettled step ${step}`).toBeGreaterThan(500)
      }
    } finally {
      await browser.close()
    }
  })

  it('reports the unmarked collision for its step, naming both elements', () => {
    const overlap = warnings('collision').filter((l) => l.includes('[overlap]'))
    expect(overlap.length).toBeGreaterThan(0)
    expect(overlap.every((l) => l.startsWith('WARN step 02'))).toBe(true)
    expect(overlap.join('\n')).toMatch(/Alpha overlap text/)
    expect(overlap.join('\n')).toMatch(/Beta overlap text/)
  })

  it('does not report an explicitly allowed overlap', () => {
    expect(warnings('allowed').filter((l) => l.includes('[overlap]'))).toEqual([])
    expect(runs.allowed.code).toBe(0)
  })

  it('reports indistinct active chrome on every step', () => {
    const lines = warnings('chrome').filter((l) => l.includes('[active-chrome]'))
    for (const step of ['01', '02', '03']) expect(lines.some((l) => l.startsWith(`WARN step ${step}`) && /progress indicator/.test(l))).toBe(true)
    // the unstyled table of contents has labels of different natural widths and must still be flagged
    for (const step of ['01', '02', '03']) expect(lines.some((l) => l.startsWith(`WARN step ${step}`) && /table-of-contents/.test(l))).toBe(true)
    expect(warnings('clean').filter((l) => l.includes('[active-chrome]'))).toEqual([])
  })

  it('reports unpolished attribution per step, pointing at the styling hook', () => {
    const lines = warnings('attribution').filter((l) => l.includes('[attribution]'))
    for (const step of ['01', '02', '03']) {
      expect(lines.some((l) => l.startsWith(`WARN step ${step}`) && l.includes('[data-presentation-attribution]'))).toBe(true)
    }
    expect(warnings('clean').filter((l) => l.includes('[attribution]'))).toEqual([])
  })

  it('stays advisory: the clean fixture is silent and every warning variant still exits zero', () => {
    expect(warnings('clean')).toEqual([])
    for (const v of VARIANTS) expect(runs[v].code).toBe(0)
  })
})
