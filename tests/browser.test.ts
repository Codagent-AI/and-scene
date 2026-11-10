import { preview } from 'vite'
import { beforeAll, expect, it, vi } from 'vitest'
import { chromium } from 'playwright'
import { build, walk, withPreview } from '../scripts/browser.mjs'
vi.mock('vite', async importOriginal => {
  const actual = await importOriginal<typeof import('vite')>()
  return { ...actual, preview: vi.fn(actual.preview) }
})
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

it.each([false, true])('cleans up a closed preview (visitor rejects: %s)', async rejects => {
  let launched: import('playwright').Browser | undefined
  let previewUrl = ''
  await expect(withPreview(async (browser, url) => {
    launched = browser
    previewUrl = url
    const result = vi.mocked(preview).mock.results.at(-1)
    expect(result?.type).toBe('return')
    const server = await result!.value
    await server.close()
    if (rejects) throw new Error('visitor failed')
  })).rejects.toThrow(rejects ? 'visitor failed' : 'preview terminated unexpectedly')
  expect(launched?.isConnected()).toBe(false)
  await expect(fetch(previewUrl)).rejects.toThrow()
}, 10000)

it('serves overlapping previews on distinct IPv4 ports and closes both', async () => {
  const urls: string[] = []
  const browsers: import('playwright').Browser[] = []
  await withPreview(async (first, firstUrl) => {
    await withPreview(async (second, secondUrl) => {
      urls.push(firstUrl, secondUrl)
      browsers.push(first, second)
      expect(firstUrl).not.toBe(secondUrl)
      for (const url of urls) {
        expect(new URL(url).hostname).toBe('127.0.0.1')
        expect((await fetch(url)).ok).toBe(true)
      }
    })
    expect((await fetch(firstUrl)).ok).toBe(true)
  })
  for (const browser of browsers) expect(browser.isConnected()).toBe(false)
  for (const url of urls) await expect(fetch(url)).rejects.toThrow()
})

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

it.each(['browse', 'present'])('refits the mounted canvas after narrowing and widening in %s mode', async mode => {
  await withPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.goto(url + '/how-to-make-a-presentation')
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    if (mode === 'present') await page.keyboard.press('p')
    for (let index = 0; index < 8; index++) await page.keyboard.press('ArrowRight')
    const canvas = await page.locator('[data-presentation-canvas]').elementHandle()
    const measure = () => page.evaluate(() => {
      const stage = document.querySelector('[data-presentation-stage]')!.getBoundingClientRect()
      const canvas = document.querySelector('[data-presentation-canvas]')!.getBoundingClientRect()
      return {
        width: canvas.width, height: canvas.height,
        contained: canvas.left >= stage.left - 1 && canvas.right <= stage.right + 1 &&
          canvas.top >= stage.top - 1 && canvas.bottom <= stage.bottom + 1,
      }
    })
    await expect.poll(async () => (await measure()).width).toBeGreaterThan(800)
    const wide = await measure()
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport)
      await expect.poll(async () => {
        const bounds = await measure()
        return bounds.contained && bounds.width > 0 && bounds.height > 0 &&
          Math.abs(bounds.width / bounds.height - 880 / 380) < .001 &&
          (viewport.width === 390 ? bounds.width < wide.width / 2 : Math.abs(bounds.width - wide.width) < 1)
      }).toBe(true)
      expect(await root.getAttribute('data-step-index')).toBe('8')
      expect(await root.getAttribute('data-presentation-mode')).toBe(mode)
      expect(await canvas!.evaluate(element => element === document.querySelector('[data-presentation-canvas]'))).toBe(true)
    }
  })
}, 15000)
