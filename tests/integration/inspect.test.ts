// INT-002: the screenshot helper emits faithful artifacts and advisory warnings.
import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SLUG = 'inspect-fixture'
const EXCLUDED = new Set(['.git', 'dist', 'node_modules', '.inspection', 'openspec', 'validator_logs', 'tests', 'skills'])

interface RunResult {
  code: number | null
  out: string
  err: string
}

function runInspect(args: string[], env: Record<string, string>): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(REPO_ROOT, 'scripts', 'inspect-presentation.mjs'), ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('close', (code) => resolve({ code, out, err }))
  })
}

interface Decoded {
  width: number
  height: number
  red: { minX: number; minY: number; maxX: number; maxY: number } | null
}

describe('INT-002 inspection helper', () => {
  let project: string
  let browser: Browser
  let main: RunResult
  let unsettled: RunResult
  const mainDir = () => path.join(project, '.inspection', SLUG)
  const unsettledDir = () => path.join(project, 'early-shots')

  async function decode(file: string): Promise<Decoded> {
    const b64 = (await readFile(file)).toString('base64')
    const page = await browser.newPage()
    try {
      await page.setContent('<canvas id="c"></canvas>')
      return await page.evaluate(async (src) => {
        const img = new Image()
        img.src = src
        await img.decode()
        const c = document.getElementById('c') as HTMLCanvasElement
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const { data } = ctx.getImageData(0, 0, c.width, c.height)
        let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4
            if (data[i]! > 220 && data[i + 1]! < 40 && data[i + 2]! < 40) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        return { width: img.naturalWidth, height: img.naturalHeight, red: maxX < 0 ? null : { minX, minY, maxX, maxY } }
      }, `data:image/png;base64,${b64}`)
    } finally {
      await page.close()
    }
  }

  const warnings = (res: RunResult, kind: string, step: number) =>
    res.out.split('\n').filter((l) => l.startsWith(`[inspect] WARN step=${step} ${kind}:`))

  beforeAll(async () => {
    project = await mkdtemp(path.join(os.tmpdir(), 'and-scene-inspect-'))
    await cp(REPO_ROOT, project, {
      recursive: true,
      filter: (src) => !EXCLUDED.has(path.relative(REPO_ROOT, src).split(path.sep)[0] ?? ''),
    })
    await symlink(path.join(REPO_ROOT, 'node_modules'), path.join(project, 'node_modules'))
    // The throwaway registry holds only the controlled fixture.
    await rm(path.join(project, 'src', 'presentations'), { recursive: true, force: true })
    await mkdir(path.join(project, 'src', 'presentations', SLUG), { recursive: true })
    await writeFile(
      path.join(project, 'src', 'presentations', SLUG, 'Talk.tsx'),
      await readFile(path.join(REPO_ROOT, 'tests', 'helpers', 'inspect-fixture', 'Talk.tsx'), 'utf8'),
    )
    await writeFile(
      path.join(project, 'src', 'presentations', 'index.ts'),
      `import type { ComponentType } from 'react'
export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
export const presentations: PresentationEntry[] = [
  { slug: '${SLUG}', title: 'Inspect fixture', load: () => import('./${SLUG}/Talk') },
]
`,
    )
    browser = await chromium.launch()
    // First run builds the production bundle itself (no INSPECT_SKIP_BUILD).
    main = await runInspect([SLUG], { INSPECT_ROOT: project })
    // Control: zero settle must capture the mid-animation frame, proving the default wait matters.
    unsettled = await runInspect([SLUG, '--settle', '0', '--out', unsettledDir()], {
      INSPECT_ROOT: project,
      INSPECT_SKIP_BUILD: '1',
    })
  })

  afterAll(async () => {
    await browser?.close()
    if (project) await rm(project, { recursive: true, force: true })
  })

  it('exits zero and writes exactly one nonempty 1440x900 screenshot per step at the predictable path', async () => {
    expect(main.code, main.out + main.err).toBe(0)
    expect((await readdir(mainDir())).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png', 'step-05.png', 'step-06.png', 'step-07.png'])
    for (const f of await readdir(mainDir())) {
      expect((await stat(path.join(mainDir(), f))).size).toBeGreaterThan(1000)
      const d = await decode(path.join(mainDir(), f))
      expect([d.width, d.height]).toEqual([1440, 900])
    }
    expect(main.out).toContain('building production bundle')
  })

  it('captures only after transitions settle', async () => {
    expect(main.out).toMatch(/settle 1000ms/)
    const moving = await decode(path.join(mainDir(), 'step-04.png'))
    const settled = await decode(path.join(mainDir(), 'step-05.png'))
    expect(moving.red).not.toBeNull()
    expect(moving.red).toEqual(settled.red)

    expect(unsettled.code, unsettled.out + unsettled.err).toBe(0)
    const early = await decode(path.join(unsettledDir(), 'step-04.png'))
    expect(early.red).not.toEqual(settled.red)
  })

  it('reports the unmarked collision at its step with both elements, and nowhere else', () => {
    const w = warnings(main, 'overlap', 2)
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('Alpha collision')
    expect(w[0]).toContain('Bravo collision')
    for (const step of [1, 3, 4, 5]) expect(warnings(main, 'overlap', step)).toEqual([])
  })

  it('reports a parent/descendant collision when both own text ranges intersect', () => {
    const w = warnings(main, 'overlap', 6)
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('Parent own text')
    expect(w[0]).toContain('Child own text')
  })

  it('inherits allow-overlap from an ancestor wrapper but still reports unrelated unmarked overlaps', () => {
    const w = warnings(main, 'overlap', 7)
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('Outside alpha')
    expect(w[0]).toContain('Outside bravo')
    expect(w[0]).not.toContain('Wrapped')
  })

  it('does not report the explicitly allowed overlap', () => {
    expect(warnings(main, 'overlap', 3)).toEqual([])
  })

  it('reports indistinct active progress and ToC chrome on unstyled steps but not on the polished control', () => {
    for (const step of [1, 2, 3, 4]) {
      const w = warnings(main, 'indistinct-active', step).join('\n')
      expect(w).toContain('[data-presentation-progress-item]')
      expect(w).toContain('[data-presentation-toc-item]')
    }
    expect(warnings(main, 'indistinct-active', 5)).toEqual([])
  })

  it('reports browser-default attribution pointing at the styling hook, but not for the styled control', () => {
    for (const step of [1, 2, 3, 4]) {
      const w = warnings(main, 'attribution', step)
      expect(w).toHaveLength(1)
      expect(w[0]).toContain('[data-presentation-attribution]')
    }
    expect(warnings(main, 'attribution', 5)).toEqual([])
  })

  it('serves screenshots from an IPv4 production preview that is gone after the run', async () => {
    const m = /\[inspect\] preview (http:\/\/127\.0\.0\.1:\d+)\//.exec(main.out)
    expect(m).not.toBeNull()
    await expect(fetch(`${m![1]}/`)).rejects.toThrow()
    expect((await stat(path.join(project, 'dist', 'index.html'))).isFile()).toBe(true)
  })

  it('exits non-zero with no preview left for an unregistered slug (operational failure)', async () => {
    const res = await runInspect(['no-such-talk', '--settle', '0'], { INSPECT_ROOT: project, INSPECT_SKIP_BUILD: '1' })
    expect(res.code).toBe(1)
    expect(res.err).toContain('no-such-talk')
    const m = /\[inspect\] preview (http:\/\/127\.0\.0\.1:\d+)\//.exec(res.out)
    expect(m).not.toBeNull()
    await expect(fetch(`${m![1]}/`)).rejects.toThrow()
  })
})
