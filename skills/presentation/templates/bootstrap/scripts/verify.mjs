import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { startPreview } from './preview-server.mjs'

const slug = process.env.PRESENTATION_SLUG ?? 'starter'
let preview
let browser
let activeStep = 0
const errors = []

async function runBuild() {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
  const status = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('close', resolve)
  })
  if (status !== 0) throw new Error(`Build check failed (exit ${status})`)
}

async function renderSteps(page, root, stepCount) {
  for (let index = 0; index < stepCount; index += 1) {
    activeStep = index
    const actualIndex = Number(await root.getAttribute('data-step-index'))
    if (actualIndex !== index) {
      throw new Error(`Render check failed at step ${index + 1}: observed index ${actualIndex}`)
    }
    if (errors.length > 0) {
      throw new Error(`Render check failed at step ${index + 1}: ${errors.join('; ')}`)
    }
    if (index === stepCount - 1) continue

    activeStep = index + 1
    await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction(
        expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected,
        index + 1,
        { timeout: 5000 },
      )
    } catch (error) {
      if (errors.length > 0) {
        throw new Error(`Render check failed at step ${index + 2}: ${errors.join('; ')}`)
      }
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Render check failed at step ${index + 2}: transition did not advance`)
      }
      throw new Error(`Render check failed at step ${index + 2}: browser wait failed: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Render check failed at step ${activeStep + 1}: ${errors.join('; ')}`)
  }
}

try {
  await runBuild()
  preview = await startPreview()
  const previewUrl = await preview.waitForPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`step ${activeStep + 1}: console: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`step ${activeStep + 1}: page error: ${error.message}`))

  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const stepCount = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(stepCount) || stepCount < 1) {
    throw new Error(`Render check failed: route /${slug} exposed no presentation steps`)
  }

  await renderSteps(page, root, stepCount)
  console.log(`PASS: build and ${stepCount}-step production render check for /${slug} at ${previewUrl}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await preview?.stop()
}
