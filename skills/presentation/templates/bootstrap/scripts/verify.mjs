#!/usr/bin/env node
// Deterministic verification: build, reference sample check, production render of every step.
import { join } from 'node:path'
import { CheckError, HOST, ROOT, SELECTORS, launchBrowser, readJson, registeredSlugs, run, sleep, startPreview } from './lib.mjs'

const STEP_TIMEOUT = 5000

function loadReference() {
  try {
    const { reference } = readJson(join(ROOT, 'scripts', 'verify.config.json'))
    if (!reference?.slug || !Array.isArray(reference.steps) || reference.steps.length === 0) throw new Error('malformed')
    return reference
  } catch {
    throw new CheckError('reference', 'scripts/verify.config.json is missing or malformed: it must define the reference presentation')
  }
}

/** Opens a presentation route, steps through every step, and returns observed titles/captions. */
async function renderPresentation(browser, base, slug) {
  const page = await browser.newPage()
  let current = 1
  const issues = []
  const note = (what) => issues.push({ step: current, what })
  page.on('console', (m) => m.type() === 'error' && note(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => note(`uncaught error: ${e.message}`))
  try {
    await page.goto(`${base}/${slug}`)
    try {
      await page.waitForSelector(SELECTORS.root, { timeout: STEP_TIMEOUT * 2 })
    } catch {
      throw new CheckError('render', `/${slug}: presentation did not render${issues.length ? ` (${issues[0].what})` : ''}`, 1)
    }
    const count = Number(await page.getAttribute(SELECTORS.root, 'data-step-count'))
    if (!(count > 0)) throw new CheckError('render', `/${slug}: data-step-count is missing or zero`, 1)
    if ((await page.getAttribute(SELECTORS.root, 'data-mode')) === 'present') await page.keyboard.press('p')
    const seen = []
    for (let i = 0; i < count; i++) {
      current = i + 1
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            ([sel, n]) => document.querySelector(sel)?.getAttribute('data-step-index') === String(n),
            [SELECTORS.root, i],
            { timeout: STEP_TIMEOUT },
          )
        } catch {
          throw new CheckError('render', `/${slug}: step ${current}: transition did not advance data-step-index to ${i}`, current)
        }
      }
      await sleep(250)
      seen.push({
        title: (await page.textContent(SELECTORS.title))?.trim(),
        caption: (await page.textContent(SELECTORS.caption))?.trim(),
      })
      if (issues.length) break
    }
    if (issues.length) {
      const first = issues[0]
      throw new CheckError('render', `/${slug}: step ${first.step}: ${first.what}`, first.step)
    }
    return seen
  } finally {
    await page.close()
  }
}

async function verify() {
  const reference = loadReference()

  console.log('[verify] phase build: npm run build')
  await run('npm', ['run', 'build'], 'build')

  console.log(`[verify] phase preview: vite preview on ${HOST}`)
  const preview = await startPreview()
  const browser = await launchBrowser()
  try {
    const probe = await browser.newPage()
    const slugs = await registeredSlugs(probe, preview.base)
    await probe.close()
    if (!slugs.includes(reference.slug)) {
      throw new CheckError('reference', `reference presentation "${reference.slug}" is not registered (registered: ${slugs.join(', ') || 'none'})`)
    }

    for (const slug of [reference.slug, ...slugs.filter((s) => s !== reference.slug)]) {
      console.log(`[verify] phase render: ${preview.base}/${slug}`)
      const seen = await renderPresentation(browser, preview.base, slug)
      console.log(`[verify]   ${seen.length} steps rendered without errors`)
      if (slug !== reference.slug) continue
      if (seen.length !== reference.steps.length) {
        throw new CheckError('reference', `reference presentation has ${seen.length} steps, expected ${reference.steps.length}`)
      }
      reference.steps.forEach((want, i) => {
        const got = seen[i]
        if (got.title !== want.title || got.caption !== want.caption) {
          throw new CheckError(
            'reference',
            `reference step ${i + 1} mismatch: expected "${want.title}" / "${want.caption}", got "${got.title}" / "${got.caption}"`,
            i + 1,
          )
        }
      })
    }
  } finally {
    await browser.close()
    preview.stop()
  }
}

try {
  await verify()
  console.log('[verify] PASS: build, reference sample, and render checks succeeded')
} catch (e) {
  if (e instanceof CheckError) {
    console.error(`[verify] FAIL phase=${e.phase}${e.step ? ` step=${e.step}` : ''}: ${e.message}`)
  } else {
    console.error(`[verify] FAIL phase=unexpected: ${e?.stack ?? e}`)
  }
  process.exitCode = 1
}
