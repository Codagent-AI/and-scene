const transitionTimeout = Number(process.env.VERIFY_TRANSITION_TIMEOUT || 3000)

export async function verifyPresentation(page, url, { expectedCount, validateStep } = {}) {
  const route = new URL(url).pathname
  const errors = []
  let activeStep = 1
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text())
  }
  const onPageError = (error) => errors.push(error.message)
  const checkErrors = () => {
    if (errors.length) throw new Error(`render failed at ${route} step ${activeStep}: ${errors.join('; ')}`)
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    checkErrors()
    const chrome = page.locator('[data-presentation-chrome]')
    const count = Number(await chrome.getAttribute('data-step-count', { timeout: transitionTimeout }))
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`render failed at ${route} step 1: missing initial presentation state`)
    }
    if (expectedCount !== undefined && count !== expectedCount) {
      throw new Error(`render check expected ${expectedCount} steps but found ${count} at ${route}`)
    }
    for (let index = 0; index < count; index += 1) {
      activeStep = index + 1
      if (index > 0) await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction((expected) =>
          document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === String(expected),
        index, { timeout: transitionTimeout })
      } catch (error) {
        checkErrors()
        throw new Error(`render transition failed at step ${activeStep} on ${route}: ${error.message}`)
      }
      checkErrors()
      const validState = await page.evaluate(({ stepCount, index }) => {
        const chrome = document.querySelector('[data-presentation-chrome]')
        return chrome?.getAttribute('data-step-count') === String(stepCount)
          && chrome.getAttribute('data-step-index') === String(index)
          && Boolean(document.querySelector('[data-presentation-canvas]'))
          && Boolean(document.querySelector('[data-presentation-scene]'))
          && Boolean(document.querySelector('[data-presentation-title]'))
      }, { stepCount: count, index })
      if (!validState) throw new Error(`render failed at ${route} step ${activeStep}: missing presentation state`)
      await validateStep?.(page, index)
      checkErrors()
    }
    return count
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }
}
