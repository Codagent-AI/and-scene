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
    const { stdout } = await promisify(execFile)('pgrep', ['-fl', '-P', String(process.pid)])
    const child = stdout.split('\n').find(line => line.includes('vite.js preview'))
    expect(child).toBeTruthy()
    process.kill(Number(child!.trim().split(/\s/)[0]), 'SIGKILL')
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
