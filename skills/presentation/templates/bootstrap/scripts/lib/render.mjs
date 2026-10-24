// Steps one presentation through a browser page and fails on any console or page error.
import { sleep as realSleep } from './preview.mjs'

export const STEP_TIMEOUT = 5000
// Longer than the kit's default entrance (delay plus duration, 0.95 s), so errors raised late in a
// transition are seen while the step that caused them is still current.
export const SETTLE_MS = 1100
// Extra dwell on the last step before the page closes: nothing follows it to catch an error that
// fires after its settle window, so errors raised up to SETTLE_MS + FINAL_DWELL_MS after the step
// renders still fail verification and name that step.
export const FINAL_DWELL_MS = 2500

export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export async function renderPresentation(browser, baseUrl, slug, reference, { sleep = realSleep, settleMs = SETTLE_MS, finalDwellMs = FINAL_DWELL_MS } = {}) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: current, text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ step: current, text: String(err) }))
  const fail = (message, step = current) => new VerifyError('render', `${slug}: ${message}`, step + 1)
  const firstError = () => errors[0]
  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ timeout: STEP_TIMEOUT })
    } catch {
      throw fail(firstError() ? `did not render: ${firstError().text}` : 'presentation root never rendered')
    }
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw fail('data-step-count hook missing or invalid')
    if (reference && count !== reference.steps.length) {
      throw new VerifyError('reference-sample', `${slug}: expected ${reference.steps.length} steps, found ${count}`, 1)
    }
    if ((await root.getAttribute('data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            i,
            { timeout: STEP_TIMEOUT },
          )
        } catch {
          throw fail(`step index did not advance to ${i}`)
        }
      }
      await sleep(i === count - 1 ? settleMs + finalDwellMs : settleMs)
      if (errors.length) throw fail(`browser error: ${errors[0].text}`, errors[0].step)
      if (reference) {
        const title = (await page.locator('[data-presentation-title]').textContent())?.trim()
        const caption = (await page.locator('[data-presentation-caption]').textContent())?.trim()
        const want = reference.steps[i]
        if (title !== want.title || caption !== want.caption) {
          throw new VerifyError(
            'reference-sample',
            `${slug}: step ${i + 1} should be "${want.title}" but shows "${title}"${caption === want.caption ? '' : ' (caption differs)'}`,
            i + 1,
          )
        }
      }
    }
    console.log(`[verify] render ${slug}: ${count} steps ok`)
  } finally {
    await page.close()
  }
}
