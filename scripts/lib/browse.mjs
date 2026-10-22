import { createRequire } from 'node:module'
import path from 'node:path'

/** Loads Playwright from the project's own dependencies, not from wherever the script sits. */
export async function loadPlaywright(root) {
  const require = createRequire(path.join(root, 'package.json'))
  return require('playwright')
}

/** Waits until the chrome reports `index` as the active step. */
export function waitForStepIndex(page, index, timeout = 5000) {
  return page.waitForFunction(
    (want) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(want),
    index,
    { timeout },
  )
}

export const readStepCount = (page) =>
  page.evaluate(() => Number(document.querySelector('[data-step-count]')?.getAttribute('data-step-count') ?? NaN))

export const readStepIndex = (page) =>
  page.evaluate(() => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index') ?? NaN))

/** Narration of the active step as the chrome currently shows it. */
export const readNarration = (page) =>
  page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? null
    return {
      era: text('[data-presentation-era]'),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })
