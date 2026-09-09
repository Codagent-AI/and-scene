import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const slug = process.argv[2] ?? 'how-to-make-a-presentation'
const host = '127.0.0.1'
const port = 4174
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 700)
const root = process.cwd()
const output = `artifacts/inspection/${slug}`

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve())
  })
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

let server
let browser
try {
  await run('npm', ['run', 'build'])
  await mkdir(output, { recursive: true })
  server = await startPreview({ root, preview: { host, port, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-presentation-root]')
  if (await presentation.count() !== 1) throw new Error(`route /${slug} did not render a presentation`)
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`route /${slug} did not expose a positive data-step-count`)

  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const intersects = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0
      }
      const describe = (element) => element.getAttribute('data-presentation-box') !== null ? 'scene box' : element.getAttributeNames().find((name) => name.startsWith('data-presentation-'))?.replace('data-presentation-', '') ?? element.tagName.toLowerCase()
      const selector = '[data-presentation-caption], [data-presentation-header] > *, [data-presentation-toc] > *, [data-presentation-progress-list], [data-presentation-prev], [data-presentation-next], [data-presentation-attribution], [data-presentation-box], [data-presentation-label], [data-presentation-symbol-chip], [data-presentation-emphasis], [data-presentation-frame], [data-presentation-arrow]'
      const items = [...document.querySelectorAll(selector)].filter((element) => visible(element) && !element.closest('[data-allow-overlap]'))
      const warnings = []
      for (let first = 0; first < items.length; first += 1) {
        for (let second = first + 1; second < items.length; second += 1) {
          if (intersects(items[first].getBoundingClientRect(), items[second].getBoundingClientRect())) warnings.push(`possible text/chrome overlap: ${describe(items[first])} × ${describe(items[second])}`)
        }
      }
      const active = document.querySelector('[data-presentation-progress][data-active="true"], [data-presentation-toc-entry][data-active="true"]')
      const inactive = active?.parentElement?.querySelector('button:not([data-active="true"])')
      if (active && inactive) {
        const current = getComputedStyle(active)
        const other = getComputedStyle(inactive)
        if (current.color === other.color && current.backgroundColor === other.backgroundColor && current.borderColor === other.borderColor && current.fontWeight === other.fontWeight) warnings.push('active navigation may be visually indistinct')
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) warnings.push('attribution is missing; style [data-presentation-attribution] locally')
      else {
        const style = getComputedStyle(attribution)
        if (Number.parseFloat(style.fontSize) < 10 || style.fontSize === '16px') warnings.push('attribution is browser-default or undersized; style [data-presentation-attribution] locally')
      }
      return [...new Set(warnings)]
    })
    warnings.forEach((warning) => console.warn(`INSPECT WARNING step ${index + 1}: ${warning}`))
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(next), index + 1)
    }
  }
  console.log(`INSPECT PASS: wrote ${count} settled screenshots to ${output}`)
} catch (error) {
  console.error(`INSPECT FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (server) await closeServer(server)
  }
}
