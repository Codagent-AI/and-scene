import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { REPO, copyRepo, groupAlive, isListening, previewPids, remove, run, type RunResult } from '../support/sandbox'

// INT-002: the project-local inspection helper, driven through its real entry point against
// controlled registered presentations in a disposable copy of the app.
const FIXTURES = path.join(REPO, 'tests/fixtures/inspect')
const SLUGS = ['collide', 'polished', 'noattr', 'settle', 'stuck', 'chromecollide', 'halfstyled']

let dir = ''
let buildLog = ''

const inspect = (slug: string, ...args: string[]): Promise<RunResult> =>
  run('npm', ['run', 'inspect', '--', slug, '--skip-build', '--settle', '300', ...args], { cwd: dir })
const warnings = (r: RunResult) => r.output.split('\n').filter((l) => l.startsWith('WARN '))
const shots = (slug: string, sub = '.inspection') => {
  const d = path.join(dir, sub, slug)
  return existsSync(d) ? readdirSync(d).sort() : []
}
const png = (slug: string, file: string, sub = '.inspection') => readFileSync(path.join(dir, sub, slug, file))
const size = (buf: Buffer) => ({ signature: buf.subarray(1, 4).toString(), width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) })

beforeAll(async () => {
  dir = copyRepo()
  const registry = SLUGS.map((s) => `  { slug: '${s}', title: '${s}', load: () => import('./${s}/Talk') },`).join('\n')
  const file = path.join(dir, 'src/presentations/index.ts')
  writeFileSync(file, readFileSync(file, 'utf8').replace('export const presentations: PresentationEntry[] = [', `export const presentations: PresentationEntry[] = [\n${registry}`))
  for (const slug of SLUGS) cpSync(path.join(FIXTURES, slug), path.join(dir, 'src/presentations', slug), { recursive: true })
  // The first run uses the helper's own build step (no --skip-build), proving it builds before previewing.
  const first = await run('npm', ['run', 'inspect', '--', 'polished', '--settle', '300'], { cwd: dir })
  buildLog = first.output
  expect(first.code, first.output).toBe(0)
})
afterAll(() => remove(dir))

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('builds, previews on 127.0.0.1, and writes one decodable desktop screenshot per step', () => {
    expect(buildLog).toMatch(/\[preview\] waiting for http:\/\/127\.0\.0\.1:\d+\//)
    expect(shots('polished')).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png'])
    const hashes = new Set<string>()
    for (const f of shots('polished')) {
      const buf = png('polished', f)
      expect(size(buf)).toEqual({ signature: 'PNG', width: 1440, height: 900 })
      expect(statSync(path.join(dir, '.inspection/polished', f)).size).toBeGreaterThan(2000)
      hashes.add(createHash('sha256').update(buf).digest('hex'))
    }
    expect(hashes.size).toBe(4) // each step shows different content
    expect(buildLog).toMatch(/inspect: 4 screenshots in \.inspection[\\/]polished, 0 advisory warning\(s\)/)
  })

  it('a locally styled, collision-free presentation produces no warnings', () => {
    expect(warnings({ code: 0, output: buildLog })).toEqual([])
  })

  it('the reference sample keeps its controls clear of the attribution at a narrow viewport', async () => {
    const r = await inspect('how-to-make-a-presentation', '--viewport', '390x844', '--out', '.shots-sample-narrow')
    expect(r.code, r.output).toBe(0)
    expect(shots('how-to-make-a-presentation', '.shots-sample-narrow')).toHaveLength(9)
    expect(warnings(r)).toEqual([])
  })

  it('honors --viewport and --out', async () => {
    const r = await inspect('polished', '--viewport', '390x844', '--out', '.shots-narrow')
    expect(r.code, r.output).toBe(0)
    expect(size(png('polished', 'step-01.png', '.shots-narrow'))).toMatchObject({ width: 390, height: 844 })
    expect(shots('polished', '.shots-narrow')).toHaveLength(4)
  })

  describe('collisions', () => {
    let result: RunResult
    beforeAll(async () => {
      result = await inspect('collide')
    })

    it('reports an unmarked text collision for its step, naming both elements, and still exits zero', () => {
      expect(result.code, result.output).toBe(0)
      const overlap = warnings(result).filter((w) => /overlap between/.test(w))
      const step1 = overlap.filter((w) => w.startsWith('WARN step 1:'))
      expect(step1).toHaveLength(1)
      expect(step1[0]).toContain('Alpha overlap')
      expect(step1[0]).toContain('Beta overlap')
      expect(shots('collide')).toHaveLength(4)
    })

    it('does not warn about the explicitly allowed readable overlap', () => {
      const overlap = warnings(result).filter((w) => /overlap between/.test(w))
      expect(overlap.filter((w) => w.startsWith('WARN step 2:'))).toEqual([])
      expect(overlap.filter((w) => /Readable/.test(w))).toEqual([])
    })

    it('still warns about a separate unmarked collision next to an allowed one', () => {
      const step3 = warnings(result).filter((w) => w.startsWith('WARN step 3:') && /overlap between/.test(w))
      expect(step3).toHaveLength(1)
      expect(step3[0]).toContain('Gamma overlap')
      expect(step3[0]).toContain('Delta overlap')
    })

    it('does not warn about collisions on a clean step', () => {
      expect(warnings(result).filter((w) => w.startsWith('WARN step 4:') && /overlap between/.test(w))).toEqual([])
    })

    it('compares scene text and chrome together, and flags unstyled active chrome and attribution on every step', () => {
      for (const n of [1, 2, 3, 4]) {
        const forStep = warnings(result).filter((w) => w.startsWith(`WARN step ${n}:`))
        expect(forStep.some((w) => /active progress indicator looks identical/.test(w)), `progress ${n}`).toBe(true)
        expect(forStep.some((w) => /active table-of-contents entry looks identical/.test(w)), `toc ${n}`).toBe(true)
        expect(forStep.some((w) => /attribution uses the browser-default link color.*\[data-presentation-attribution\]/.test(w)), `attribution ${n}`).toBe(true)
      }
    })
  })

  it('warns when the attribution is missing, with the styling hook, and keeps the screenshots', async () => {
    const r = await inspect('noattr')
    expect(r.code, r.output).toBe(0)
    const missing = warnings(r).filter((w) => /attribution is missing.*\[data-presentation-attribution\]/.test(w))
    expect(missing.map((w) => w.slice(0, 12))).toEqual(['WARN step 1:', 'WARN step 2:'])
    expect(shots('noattr')).toEqual(['step-01.png', 'step-02.png'])
  })

  it('reports a scene text colliding with the full box of a chrome control', async () => {
    const r = await inspect('chromecollide')
    expect(r.code, r.output).toBe(0)
    const hits = warnings(r).filter((w) => /overlap between/.test(w) && /Under the button/.test(w))
    expect(hits.map((w) => w.slice(0, 12))).toEqual(['WARN step 1:', 'WARN step 2:'])
    expect(hits.every((w) => /<button data-presentation-next> "Next"/.test(w))).toBe(true)
    // the control is not reported against its own text
    expect(warnings(r).filter((w) => /"Next"[^]*"Next"/.test(w))).toEqual([])
  })

  it('warns about the default link color even when other attribution styling was changed', async () => {
    const r = await inspect('halfstyled')
    expect(r.code, r.output).toBe(0)
    const attribution = warnings(r).filter((w) => /attribution uses the browser-default link color.*\[data-presentation-attribution\]/.test(w))
    expect(attribution.map((w) => w.slice(0, 12))).toEqual(['WARN step 1:', 'WARN step 2:'])
  })

  describe('settling', () => {
    const pixel = async (file: Buffer) => {
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage()
        return await page.evaluate(async (b64) => {
          const img = new Image()
          img.src = `data:image/png;base64,${b64}`
          await img.decode()
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          return [...ctx.getImageData(5, 5, 1, 1).data.slice(0, 3)]
        }, file.toString('base64'))
      } finally {
        await browser.close()
      }
    }

    it('captures the second step only after its 800ms transition finishes when the interval is long enough', async () => {
      const r = await run('npm', ['run', 'inspect', '--', 'settle', '--skip-build', '--settle', '2000', '--out', '.settled'], { cwd: dir })
      expect(r.code, r.output).toBe(0)
      expect(await pixel(png('settle', 'step-01.png', '.settled'))).toEqual([0, 0, 0])
      expect(await pixel(png('settle', 'step-02.png', '.settled'))).toEqual([255, 0, 0])
    })

    it('a zero interval captures mid-transition, proving the interval is what delays the capture', async () => {
      const r = await run('npm', ['run', 'inspect', '--', 'settle', '--skip-build', '--settle', '0', '--out', '.unsettled'], { cwd: dir })
      expect(r.code, r.output).toBe(0)
      const [red] = await pixel(png('settle', 'step-02.png', '.unsettled'))
      expect(red).toBeLessThan(255)
    })
  })

  describe('failures exit non-zero with an actionable error', () => {
    it('an unregistered slug', async () => {
      const r = await inspect('does-not-exist')
      expect(r.code).not.toBe(0)
      expect(r.output).toMatch(/INSPECT FAIL: "does-not-exist" did not render a presentation at http:\/\/127\.0\.0\.1:\d+\/does-not-exist/)
      expect(r.output).not.toMatch(/inspect: \d+ screenshots/)
    })

    it('navigation that cannot advance', async () => {
      const r = await inspect('stuck')
      expect(r.code).not.toBe(0)
      expect(r.output).toMatch(/INSPECT FAIL: navigation failed: step 1 did not advance to 2/)
      expect(r.output).not.toMatch(/inspect: \d+ screenshots/)
    })

    it('a missing slug argument', async () => {
      const r = await run('npm', ['run', 'inspect', '--skip-build'], { cwd: dir })
      expect(r.code).not.toBe(0)
      expect(r.output).toMatch(/INSPECT FAIL: usage/)
    })

    it('a failing build is reported rather than a stale preview being captured', async () => {
      const broken = copyRepo()
      try {
        writeFileSync(path.join(broken, 'src/Landing.tsx'), `${readFileSync(path.join(broken, 'src/Landing.tsx'), 'utf8')}\nexport const bad: number = 'x'\n`)
        const r = await run('npm', ['run', 'inspect', '--', 'how-to-make-a-presentation'], { cwd: broken })
        expect(r.code).not.toBe(0)
        expect(r.output).toMatch(/INSPECT FAIL: npm run build failed/)
        expect(existsSync(path.join(broken, '.inspection/how-to-make-a-presentation/step-01.png'))).toBe(false)
      } finally {
        remove(broken)
      }
    })

    it('leaves no preview process or listener after a passing or failing run', async () => {
      const failing = await inspect('stuck')
      for (const output of [buildLog, failing.output]) {
        const pids = previewPids(output)
        expect(pids).toHaveLength(1)
        for (const pid of pids) expect(groupAlive(pid), `process group ${pid} still has live processes`).toBe(false)
        for (const m of output.matchAll(/waiting for http:\/\/127\.0\.0\.1:(\d+)\//g)) expect(await isListening(Number(m[1]))).toBe(false)
      }
    })
  })
})

