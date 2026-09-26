import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { launchChromium } from '../scripts/browser.mjs'
import { collectVisualWarnings } from '../scripts/visual-diagnostics.mjs'
import { isolatedCopy } from './helpers/isolated-copy'

let browser: Browser

beforeAll(async () => { browser = await launchChromium() })
afterAll(async () => { await browser?.close() })

describe('INT-002 browser visual diagnostics', () => {
  it('reports accidental overlap, indistinct active chrome, and unpolished attribution while exempting marked overlap', async () => {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await page.setContent(`<main data-presentation-root>
      <section data-presentation-scene>
        <span class="collision a">collision A</span><span class="collision b">collision B</span>
        <div data-allow-overlap><span class="intentional a">intent A</span><span class="intentional b">intent B</span></div>
        <div class="hidden-group"><span class="hidden a">hidden A</span><span class="hidden b">hidden B</span></div>
      </section>
      <nav><button data-presentation-progress-item data-presentation-active="true">1</button><button data-presentation-progress-item data-presentation-active="false">2</button></nav>
      <footer data-presentation-footer></footer>
    </main><style>
      .collision,.intentional { position:absolute; left:40px; top:40px; width:100px; height:30px; }
      .intentional { top:100px; }
      .hidden-group { position:absolute; opacity:0; }
      .hidden { position:absolute; left:40px; top:160px; width:100px; height:30px; }
      [data-presentation-progress-item] { color:rgb(0,0,0); background:transparent; border-color:transparent; font-weight:400; }
    </style>`)
    const warnings = await collectVisualWarnings(page)
    expect(warnings.some((warning) => warning.includes('collision A') && warning.includes('collision B'))).toBe(true)
    expect(warnings.some((warning) => warning.includes('intent A') || warning.includes('intent B'))).toBe(false)
    expect(warnings.some((warning) => warning.includes('hidden A') && warning.includes('hidden B'))).toBe(false)
    expect(warnings.some((warning) => warning.includes('active progress'))).toBe(true)
    expect(warnings.some((warning) => warning.includes('missing attribution'))).toBe(true)
    await page.close()
  })

  it('reports an unmarked label that collides with text inside an allow-overlap subtree', async () => {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await page.setContent(`<main data-presentation-root>
      <section data-presentation-scene>
        <span class="stray">stray label</span>
        <div data-allow-overlap><span class="layer">layer A</span><span class="layer">layer B</span></div>
      </section>
    </main><style>
      .stray,.layer { position:absolute; left:40px; top:40px; width:100px; height:30px; }
    </style>`)
    const warnings = await collectVisualWarnings(page)
    expect(warnings.some((warning) => warning.includes('stray label') && warning.includes('layer A'))).toBe(true)
    expect(warnings.some((warning) => warning.includes('layer A') && warning.includes('layer B'))).toBe(false)
    await page.close()
  })

  it('captures sequential fixture states after the configured settle interval', async () => {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await page.setContent('<main data-presentation-root data-step-count="2" data-step-index="0"><p>fixture</p></main>')
    await page.waitForTimeout(30)
    const capture = async (index: number) => {
      await page.locator('[data-presentation-root]').evaluate((root, next) => root.setAttribute('data-step-index', String(next)), index)
      await page.waitForTimeout(30)
      return page.locator('[data-presentation-root]').screenshot()
    }
    expect((await capture(0)).byteLength).toBeGreaterThan(0)
    expect((await capture(1)).byteLength).toBeGreaterThan(0)
    await page.close()
  })

  it('runs the project helper and writes one settled artifact for each registered step', () => {
    const temp = isolatedCopy('inspect')
    try {
      const build = spawnSync('npm', ['run', 'build'], { cwd: temp, encoding: 'utf8' })
      expect(build.status, build.stderr).toBe(0)
      const capture = spawnSync(process.execPath, ['scripts/inspect-presentation.mjs', 'how-to-make-a-presentation'], {
        cwd: temp,
        encoding: 'utf8',
        env: { ...process.env, INSPECT_SETTLE_MS: '50' },
      })
      expect(capture.status, capture.stderr).toBe(0)
      expect(capture.stdout).toContain('Captured 9 settled steps')
      const files = readdirSync(join(temp, 'artifacts/inspection'))
      expect(files).toHaveLength(9)
      expect(files[0]).toBe('how-to-make-a-presentation-01.png')
      expect(existsSync(join(temp, 'artifacts/inspection/how-to-make-a-presentation-09.png'))).toBe(true)
    } finally { rmSync(temp, { recursive: true, force: true }) }
  }, 60_000)
})
