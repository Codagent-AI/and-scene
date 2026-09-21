import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const root = new URL('..', import.meta.url).pathname
const slug = process.argv[2] || 'how-to-make-a-presentation'
const output = join(root, 'artifacts/inspection')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const browser = await chromium.launch({ headless: true })
const warnings = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:4173/${slug}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation]').waitFor()
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(700)
    await page.screenshot({ path: join(output, `${slug}-${index}.png`), fullPage: true })
    warnings.push(...await page.evaluate(diagnose, index))
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  for (const error of errors) warnings.push(`step runtime error: ${error}`)
  if (warnings.length) for (const warning of warnings) console.warn(`inspect warning [${slug}]: ${warning}`)
  console.log(`inspect: captured ${count} settled steps for ${packageJson.name}`)
} finally { await browser.close() }

function diagnose(step) {
  const result = []
  const visible = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-controls], [data-presentation-toc], [data-presentation-node]:not(.how-to-arrow):not(.how-to-arc):not(.how-to-reveal), [data-presentation-attribution]')].filter((element) => {
    const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden'
  })
  const allowed = (element) => element.closest('[data-presentation-overlap-allowed]')
  for (let i = 0; i < visible.length; i += 1) for (let j = i + 1; j < visible.length; j += 1) {
    const a = visible[i].getBoundingClientRect(); const b = visible[j].getBoundingClientRect()
    if (!allowed(visible[i]) && !allowed(visible[j]) && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`step ${step + 1}: visible chrome/text overlap between ${visible[i].className} and ${visible[j].className}`)
  }
  const active = document.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
  const inactive = document.querySelector('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')
  if (!active) result.push(`step ${step + 1}: active navigation state is missing`)
  else if (inactive && getComputedStyle(active).color === getComputedStyle(inactive).color && getComputedStyle(active).backgroundColor === getComputedStyle(inactive).backgroundColor) result.push(`step ${step + 1}: active navigation state is visually indistinct`)
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push(`step ${step + 1}: attribution is missing`)
  else if (parseFloat(getComputedStyle(attribution).fontSize) < 11 || getComputedStyle(attribution).color === 'rgb(0, 0, 238)') result.push(`step ${step + 1}: attribution is too small or browser-default; style [data-presentation-attribution]`)
  return result
}
