#!/usr/bin/env node
// Deterministic gate: whole-app build, reference-presentation outline, and a real-browser render of every step.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOST, launchChromium, runCommand, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STEP_TIMEOUT_MS = 5000
const SETTLE_MS = 400
const failures = []

const fail = (phase, message, step) => {
  failures.push({ phase, message, step })
  console.error(`FAIL [${phase}]${step === undefined ? '' : ` step ${step + 1}`}: ${message}`)
}
const normalize = (text) => (text ?? '').replace(/\s+/g, ' ').trim()
const readIndex = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-presentation-step-index]')
    return el ? Number(el.getAttribute('data-presentation-step-index')) : null
  })

async function verifyBuild() {
  console.log('[verify] build: npm run build')
  const { code, output } = await runCommand('npm', ['run', 'build'], root)
  if (code !== 0) {
    console.error(output.trim().split('\n').slice(-25).join('\n'))
    fail('build', `npm run build exited with code ${code}`)
    return false
  }
  console.log('PASS [build]')
  return true
}

async function verifyReference(config) {
  const { slug, steps: expected } = config.reference
  const preview = await startPreview(root)
  const browser = await launchChromium(root)
  try {
    const page = await browser.newPage()
    let current = 0
    page.on('console', (message) => {
      if (message.type() === 'error') fail('render', `console error: ${message.text()}`, current)
    })
    page.on('pageerror', (error) => fail('render', `uncaught page error: ${error.message}`, current))

    console.log(`[verify] preview: ${preview.url}`)
    await page.goto(`${preview.url}/`, { waitUntil: 'networkidle' })
    const linked = await page.locator(`[data-presentation-link="${slug}"]`).count()
    if (!linked) {
      fail('sample', `reference presentation "${slug}" is not registered (no link on the index page)`)
      return
    }

    await page.goto(`${preview.url}/${slug}`, { waitUntil: 'networkidle' })
    try {
      await page.waitForSelector('[data-presentation-step-count]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      fail('render', `route /${slug} did not render a presentation`, 0)
      return
    }
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') {
      await page.keyboard.press('p')
    }
    const count = Number(await page.getAttribute('[data-presentation-step-count]', 'data-presentation-step-count'))
    if (count !== expected.length) {
      fail('sample', `expected ${expected.length} steps, found ${count}`)
      return
    }

    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-step-index]')?.getAttribute('data-presentation-step-index') === String(n),
            i,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          fail('render', `transition did not advance the step index (still ${await readIndex(page)})`, i)
          return
        }
      }
      await page.waitForTimeout(SETTLE_MS)
      const title = normalize(await page.textContent('[data-presentation-title]'))
      const caption = normalize(await page.textContent('[data-presentation-caption]').catch(() => null))
      if (title !== expected[i].title || caption !== expected[i].caption) {
        fail('sample', `title/caption mismatch: expected "${expected[i].title}" / "${expected[i].caption}", got "${title}" / "${caption}"`, i)
      }
    }
    if (!failures.some((f) => f.phase === 'render')) console.log(`PASS [render] ${count} steps without console or page errors on ${HOST}`)
    if (!failures.some((f) => f.phase === 'sample')) console.log(`PASS [sample] ${count} steps match the reference outline`)
  } finally {
    await browser.close()
    preview.stop()
  }
}

async function main() {
  const config = JSON.parse(await readFile(path.join(root, 'verify.config.json'), 'utf8'))
  if (await verifyBuild()) {
    try {
      await verifyReference(config)
    } catch (error) {
      fail('render', `verification crashed: ${error.message}`)
    }
  }
  if (failures.length) {
    const phases = [...new Set(failures.map((f) => f.phase))].join(', ')
    console.error(`\nVERIFY FAILED (${phases})`)
    process.exit(1)
  }
  console.log('\nVERIFY PASSED')
}

main()
