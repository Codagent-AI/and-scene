#!/usr/bin/env node
// Deterministic gate: whole-app build, then a real-browser render of every step of every registered
// presentation, plus the reference outline from verify.config.json when one is configured.
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

/** Steps through one presentation, checking every step renders; compares text when an outline is given. */
async function tour(page, baseUrl, slug, expected, state) {
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  try {
    await page.waitForSelector('[data-presentation-step-count]', { timeout: STEP_TIMEOUT_MS })
  } catch {
    fail('render', `route /${slug} did not render a presentation`, 0)
    return 0
  }
  if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') {
    await page.keyboard.press('p')
  }
  const count = Number(await page.getAttribute('[data-presentation-step-count]', 'data-presentation-step-count'))
  if (expected && count !== expected.length) {
    fail('sample', `expected ${expected.length} steps, found ${count}`)
    return count
  }
  for (let i = 0; i < count; i++) {
    state.step = i
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
        return count
      }
    }
    await page.waitForTimeout(SETTLE_MS)
    if (expected) {
      const title = normalize(await page.textContent('[data-presentation-title]'))
      const caption = normalize(await page.textContent('[data-presentation-caption]').catch(() => null))
      if (title !== expected[i].title || caption !== expected[i].caption) {
        fail('sample', `title/caption mismatch: expected "${expected[i].title}" / "${expected[i].caption}", got "${title}" / "${caption}"`, i)
      }
    }
  }
  return count
}

async function verifyPresentations(config) {
  const reference = config.reference
  const preview = await startPreview(root)
  const browser = await launchChromium(root)
  try {
    const page = await browser.newPage()
    const state = { step: 0 }
    page.on('console', (message) => {
      if (message.type() === 'error') fail('render', `console error: ${message.text()}`, state.step)
    })
    page.on('pageerror', (error) => fail('render', `uncaught page error: ${error.message}`, state.step))

    console.log(`[verify] preview: ${preview.url}`)
    await page.goto(`${preview.url}/`, { waitUntil: 'networkidle' })
    const slugs = await page.$$eval('[data-presentation-link]', (links) => links.map((l) => l.getAttribute('data-presentation-link')))
    if (reference && !slugs.includes(reference.slug)) {
      fail('sample', `reference presentation "${reference.slug}" is not registered (no link on the index page)`)
    }
    if (!slugs.length) fail('render', 'no presentation is registered')
    for (const slug of slugs) {
      const before = failures.length
      const count = await tour(page, preview.url, slug, slug === reference?.slug ? reference.steps : undefined, state)
      if (failures.length === before) console.log(`PASS [render] /${slug}: ${count} steps without console or page errors on ${HOST}`)
    }
    if (reference && slugs.includes(reference.slug) && !failures.some((f) => f.phase === 'sample')) {
      console.log(`PASS [sample] ${reference.steps.length} steps match the reference outline`)
    }
  } finally {
    await browser.close()
    preview.stop()
  }
}

async function main() {
  const config = JSON.parse(await readFile(path.join(root, 'verify.config.json'), 'utf8'))
  if (await verifyBuild()) {
    try {
      await verifyPresentations(config)
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
