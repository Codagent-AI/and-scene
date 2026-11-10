import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, withPreview } from './browser.mjs'
import { inspectDocument } from './diagnostics.mjs'
export async function inspect(slug, { settle = Number(process.env.INSPECT_SETTLE_MS ?? 900), width = 1440, height = 1000 } = {}) {
  if (!/^[a-z0-9-]+$/.test(slug ?? '')) throw new Error('usage: npm run inspect -- <registered-slug>')
  await command('npm', ['run', 'build'])
  await withPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(`${url}/${slug}`)
    const root = page.locator('[data-step-count]')
    await root.waitFor({ timeout: 5000 })
    const count = Number(await root.getAttribute('data-step-count'))
    const dir = `artifacts/inspection/${slug}`
    await mkdir(dir, { recursive: true })
    for (let i = 0; i < count; i++) {
      await page.waitForFunction(index => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(index), i)
      await page.waitForTimeout(settle)
      for (const warning of await page.evaluate(inspectDocument)) console.log(`WARN step ${i}: ${warning}`)
      const path = `${dir}/step-${String(i + 1).padStart(2, '0')}.png`
      await page.screenshot({ path, fullPage: true })
      console.log(`CAPTURE step ${i} settled ${settle}ms: ${path}`)
      if (i < count - 1) await page.keyboard.press('ArrowRight')
    }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await inspect(process.argv[2]) } catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
}
