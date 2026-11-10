import { expect, it } from 'vitest'
import { chromium } from 'playwright'
import { walk } from '../scripts/browser.mjs'
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
