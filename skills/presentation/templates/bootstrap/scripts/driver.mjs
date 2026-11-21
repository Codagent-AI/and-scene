export const ROOT = '[data-presentation][data-step-count][data-step-index]'

export function watchBrowserErrors(page) {
  const problems = []
  let index = 0
  page.on('console', message => {
    if (message.type() === 'error') problems.push({ index, message: `console.error: ${message.text()}` })
  })
  page.on('pageerror', error => problems.push({ index, message: `pageerror: ${error.message}` }))
  return {
    step: value => { index = value },
    assertClean() {
      const first = problems[0]
      if (first) throw new Error(`Render failed at step index ${first.index}: ${first.message}`)
    },
  }
}

export async function readRegistry(page, origin) {
  await page.goto(origin)
  await page.locator('[data-presentation-landing]').waitFor({ timeout: 5000 })
  return await page.locator('a[data-presentation-route]').evaluateAll(links => links.map(link => ({
    slug: link.dataset.presentationRoute,
    title: link.textContent.trim(),
    href: link.getAttribute('href'),
  })))
}

export async function openPresentation(page, origin, entry, errors) {
  errors.step(0)
  try {
    const response = await page.goto(new URL(entry.href, origin).href)
    if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'error'}`)
    await page.locator(`${ROOT}[data-step-index="0"]`).waitFor({ timeout: 5000 })
    await page.locator('[data-presentation-scene]').first().waitFor({ state: 'attached', timeout: 5000 })
  } catch (error) {
    errors.assertClean()
    throw new Error(`Render failed at step index 0 for "${entry.slug}": ${error.message}`, { cause: error })
  }
  errors.assertClean()

  const count = Number(await page.locator(ROOT).getAttribute('data-step-count'))
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid step count at step index 0')
  return count
}

export async function advance(page, index, errors) {
  errors.step(index)
  try {
    await page.keyboard.press('ArrowRight')
    await page.locator(`${ROOT}[data-step-index="${index}"]`).waitFor({ timeout: 3500 })
  } catch (error) {
    errors.assertClean()
    throw new Error(`Transition failed at step index ${index}: public step index did not advance`, { cause: error })
  }
  errors.assertClean()
}

export async function selectBrowseMode(page) {
  const root = page.locator(ROOT)
  if (await root.getAttribute('data-presentation-mode') === 'present') {
    await page.keyboard.press('p')
    await page.locator(`${ROOT}[data-presentation-mode="browse"]`).waitFor({ timeout: 3500 })
  }
}
