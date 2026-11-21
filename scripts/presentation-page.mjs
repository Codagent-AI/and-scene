export const defaultViewport = { width: 1440, height: 900 }
export const defaultSettleMs = 650

const hostSelector = '[data-presentation][data-step-count][data-step-index]'
const stepTimeout = 4_000

export function validateSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('a presentation slug must use lowercase letters, digits, and single hyphens')
  }
  return slug
}

export async function assertRegistered(page, baseUrl, slug, expectedTitle) {
  const route = new URL(slug, baseUrl)
  const response = await page.goto(baseUrl, { waitUntil: 'load' })
  if (!response?.ok()) throw new Error(`landing page request failed (${response?.status()})`)

  const link = page.locator(`a[href="${route.pathname}"]`).first()
  try {
    await link.waitFor({ state: 'visible', timeout: stepTimeout })
  } catch {
    throw new Error(`missing registered route ${route.pathname} on the landing page`)
  }

  if (expectedTitle && !(await link.and(page.getByRole('link', { name: expectedTitle, exact: true })).isVisible())) {
    throw new Error(`registered route ${route.pathname} must be titled "${expectedTitle}"`)
  }

  return route
}

export async function openPresentation(page, route) {
  const response = await page.goto(route.href, { waitUntil: 'load' })
  if (!response?.ok()) throw new Error(`route ${route.pathname} request failed (${response?.status()})`)

  const host = page.locator(hostSelector)
  await host.waitFor({ state: 'visible', timeout: stepTimeout })
  const countText = await host.getAttribute('data-step-count')
  const count = Number(countText)
  if (!/^[1-9]\d*$/.test(countText ?? '') || !Number.isSafeInteger(count)) {
    throw new Error(`invalid data-step-count: ${countText}`)
  }
  return { host, count }
}

export async function waitForStep(page, index, settleMs) {
  const active = page.locator(`${hostSelector}[data-step-index="${index}"]`)
  await active.waitFor({ state: 'visible', timeout: stepTimeout })
  if (settleMs > 0) await page.waitForTimeout(settleMs)
  if (!(await active.isVisible())) throw new Error(`step index ${index} changed while settling`)
}

export function recordPageErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (event) => {
    if (event.type() === 'error') errors.push(`console error: ${event.text()}`)
  })
  return errors
}
