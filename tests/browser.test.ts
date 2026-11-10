import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { beforeAll, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { build, walk, withPreview } from '../scripts/browser.mjs'
beforeAll(build, 30000)
async function fixture(html: string, check: (page: import('playwright').Page) => Promise<void>) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.route('http://127.0.0.1:49999/**', route => route.fulfill({ contentType: 'text/html', body: html }))
    await check(page)
  } finally { await browser.close() }
}
const root = '<main style="height:100px" data-presentation-root data-step-count="2" data-step-index="0"></main>'
it('walks every rendered step through keyboard input', async () => {
  await fixture(`${root}<script>onkeydown=()=>document.querySelector('main').dataset.stepIndex='1'</script>`, async page => {
    const seen: number[] = []
    await walk(page, 'http://127.0.0.1:49999', 'fixture', async (_: unknown, index: number) => { seen.push(index) })
    expect(seen).toEqual([0,1])
  })
})
it.each(['console.error("broken")', 'throw new Error("broken")'])('reports initial browser failure: %s', async fault => {
  await fixture(`${root}<script>${fault}</script>`, async page => {
    await expect(walk(page, 'http://127.0.0.1:49999', 'fixture', async () => {})).rejects.toThrow(/render step 0:.*broken/)
  })
})
it('reports the step when keyboard navigation stops advancing', async () => {
  await fixture(root, async page => {
    await expect(walk(page, 'http://127.0.0.1:49999', 'fixture', async () => {})).rejects.toThrow('render step 1:')
  })
}, 10000)

it('waits for entering content to settle before inspecting every step', async () => {
  await fixture(`${root}<script>
    const main=document.querySelector('main');
    const settle=()=>setTimeout(()=>main.dataset.settled='true',600);
    settle();onkeydown=()=>{main.dataset.stepIndex='1';main.dataset.settled='false';settle()}
  </script>`, async page => {
    await walk(page, 'http://127.0.0.1:49999', 'fixture', async () => {
      expect(await page.locator('main').getAttribute('data-settled')).toBe('true')
    })
  })
})
it('closes the browser and preview when the visitor fails', async () => {
  let previewUrl = ''
  let launched: import('playwright').Browser | undefined
  await expect(withPreview(async (browser: import('playwright').Browser, url: string) => {
    previewUrl = url
    launched = browser
    throw new Error('visitor failed')
  })).rejects.toThrow('visitor failed')
  expect(launched?.isConnected()).toBe(false)
  await expect(fetch(previewUrl)).rejects.toThrow()
})

it.each(['console', 'pageerror'])('rejects a %s error during the final inspection', async channel => {
  await fixture(root.replace('count="2"', 'count="1"'), async page => {
    await expect(walk(page, 'http://127.0.0.1:49999', 'fixture', async () => {
      if (channel === 'console') await page.evaluate(() => console.error('late-final'))
      else {
        const received = page.waitForEvent('pageerror')
        await page.evaluate(() => { setTimeout(() => { throw new Error('late-final') }, 0) })
        await received
      }
    })).rejects.toThrow('render step 0: late-final')
  })
})

it.each([false, true])('cleans up a signalled preview (visitor rejects: %s)', async rejects => {
  await expect(withPreview(async (_browser, url) => {
    const { stdout } = await promisify(execFile)('pgrep', ['-f', '-P', String(process.pid), 'vite.js preview'])
    const child = stdout.trim()
    expect(child).toBeTruthy()
    process.kill(Number(child), 'SIGKILL')
    for (let attempt = 0; attempt < 100; attempt++) {
      try { await fetch(url) } catch { break }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (rejects) throw new Error('visitor failed')
  })).rejects.toThrow(rejects ? 'visitor failed' : 'preview terminated unexpectedly')
}, 10000)

it('keeps native disclosure activation and supports click Present then keyboard delivery', async () => {
  await withPreview(async (browser, url) => {
    const page = await browser.newPage()
    await page.goto(url + '/how-to-make-a-presentation')
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    await page.locator('header').evaluate(header => {
      const details = document.createElement('details')
      details.innerHTML = '<summary>More information</summary>Extra information'
      header.prepend(details)
    })
    await page.locator('summary').focus()
    await page.keyboard.press('Space')
    expect(await page.locator('details').getAttribute('open')).not.toBeNull()
    expect(await root.getAttribute('data-step-index')).toBe('0')
    await page.getByRole('button', { name: 'Toggle presentation mode' }).click()
    for (const key of ['ArrowRight', 'PageDown', 'Space']) await page.keyboard.press(key)
    expect(await root.getAttribute('data-step-index')).toBe('3')
    expect(await root.getAttribute('data-presentation-mode')).toBe('present')
    await page.keyboard.press('p')
    expect(await root.getAttribute('data-step-index')).toBe('3')
  })
})

it('retains a departing entity until its shared presence exit completes', async () => {
  await withPreview(async (browser, url) => {
    const page = await browser.newPage()
    await page.goto(url + '/how-to-make-a-presentation')
    await page.getByRole('button', { name: 'Step 2: The skill interviews you' }).click()
    const departing = page.locator('[data-entity="skill"]')
    await departing.waitFor()
    const you = await page.locator('[data-entity="you"]').elementHandle()
    await page.waitForTimeout(900)
    await page.getByRole('button', { name: 'Previous step' }).click()
    expect(await departing.count()).toBe(1)
    await departing.waitFor({ state: 'detached' })
    expect(await you!.evaluate(element => element === document.querySelector('[data-entity="you"]'))).toBe(true)
  })
})

it('contains a failed production chunk with visible recovery guidance', async () => {
  await withPreview(async (browser, url) => {
    const page = await browser.newPage()
    await page.route('**/assets/Talk-*.js', route => route.abort())
    await page.goto(url + '/how-to-make-a-presentation')
    await page.getByRole('alert').waitFor()
    expect(await page.getByRole('alert').textContent()).toContain('Reload')
    expect(await page.getByRole('link', { name: 'Back to presentations' }).getAttribute('href')).toBe('/')
  })
})

it('fits short mobile layouts, preserves key swipes and reveals every declared explanation', async () => {
  await withPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true })
    await page.goto(url + '/how-to-make-a-presentation')
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    const session = await page.context().newCDPSession(page)
    const key = await page.locator('.scene-key').boundingBox()
    expect(key).not.toBeNull()
    for (const [start, end, expected] of [[.85, .15, '1'], [.15, .85, '0']] as const) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: key!.x + key!.width * start, y: key!.y + 8 }] })
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: key!.x + key!.width * end, y: key!.y + 8 }] })
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      expect(await root.getAttribute('data-step-index')).toBe(expected)
    }
    for (let index = 0; index < 9; index++) {
      for (const note of await page.locator('.scene-key [data-from]').all()) {
        expect(await note.isVisible()).toBe(Number(await note.getAttribute('data-from')) <= index + 1)
      }
      if (index < 8) await page.keyboard.press('ArrowRight')
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 600, height: 600 }, { width: 640, height: 667 }, { width: 650, height: 700 }, { width: 600, height: 400 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      for (const mode of ['browse', 'present']) {
        if (await root.getAttribute('data-presentation-mode') !== mode) await page.keyboard.press('p')
        await page.waitForTimeout(200)
        const bounds = await page.evaluate(() => {
          const rect = (selector: string) => {
            const r = document.querySelector(selector)!.getBoundingClientRect()
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
          }
          return { stage: rect('[data-presentation-stage]'), canvas: rect('[data-presentation-canvas]'), key: rect('.scene-key'), footer: document.querySelector('footer') ? rect('footer') : null }
        })
        expect(bounds.canvas.top).toBeGreaterThanOrEqual(bounds.stage.top - 1)
        expect(bounds.canvas.bottom).toBeLessThanOrEqual(bounds.stage.bottom + 1)
        expect(bounds.canvas.left).toBeGreaterThanOrEqual(0)
        expect(bounds.canvas.right).toBeLessThanOrEqual(viewport.width + 1)
        expect(bounds.key.bottom).toBeLessThanOrEqual(bounds.stage.top + 1)
        if (bounds.footer) expect(bounds.canvas.bottom).toBeLessThanOrEqual(bounds.footer.top + 1)
      }
    }
  })
}, 30000)
