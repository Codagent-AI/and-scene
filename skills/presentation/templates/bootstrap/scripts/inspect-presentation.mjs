import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { command, traverse, withPreview, SETTLE_MS } from './browser.mjs'
import { diagnose } from './diagnostics.mjs'
export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export async function inspect({ slug, cwd = ROOT, build = true, settleMs = SETTLE_MS, viewport = { width: 1440, height: 900 } } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Provide a registered presentation slug')
  if (build) await command('npm', ['run', 'build'], cwd)
  const out = resolve(cwd, 'artifacts/inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(out, { recursive: true })
  const result = []
  await withPreview(cwd, async (browser, url) => {
    const page = await browser.newPage({ viewport })
    await traverse(page, `${url}/${slug}`, { settleMs, onStep: async index => {
      const warnings = await page.evaluate(diagnose)
      warnings.forEach(warning => console.warn(`advisory step ${index}: ${warning}`))
      const file = resolve(out, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file, fullPage: true })
      result.push({ index, file, warnings })
    } })
  })
  console.log(`Captured ${result.length} settled steps: ${out}`)
  return result
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const width = Number(process.argv[3]) || 1440
  inspect({ slug: process.argv[2], viewport: { width, height: 900 } }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
