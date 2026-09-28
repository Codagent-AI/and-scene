#!/usr/bin/env node
/**
 * Build + render verification for a scaffolded presentation app.
 *
 * 1. `npm run build` over the whole app.
 * 2. Reads the presentation registry and, for each registered presentation,
 *    starts a production preview it owns exclusively (an OS-assigned port on
 *    127.0.0.1, via Vite's programmatic `preview()` API rather than a spawned
 *    CLI process) and steps through every step with Playwright/Chromium,
 *    failing on console errors, page errors, or a step index that does not
 *    advance.
 * 3. Fails if the committed reference sample is not registered, and checks
 *    its steps against the canonical nine-step outline.
 *
 * Exits non-zero on any failure and names the failing phase/step.
 */
import process from 'node:process'
import { chromium } from 'playwright'
import { HOST, closePreviewServer, readRegisteredSlugs, run, startOwnedPreview } from './preview-utils.mjs'

const SETTLE_MS = 400

/**
 * The committed reference sample this repository ships (see
 * `openspec/changes/create-and-scene/specs/presentation-verification/spec.md`).
 * Its slug, and every step's normative title/caption in order, are asserted
 * here so verification fails if the sample is missing, unregistered, or
 * reordered — not just silently skipped like an app with no presentations
 * yet. This check is specific to this repository (the fixture); the generic
 * `templates/bootstrap/scripts/verify.mjs` a fresh scaffold copies has no
 * canonical sample to assert and intentionally omits it.
 */
const CANONICAL_SAMPLE_SLUG = 'how-to-make-a-presentation'
const CANONICAL_STEPS = [
  { title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  {
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
  },
  {
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  },
  { title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  {
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  },
  {
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  },
  {
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  },
  {
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  },
  {
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
  },
]

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

async function checkRoute(page, baseUrl, routePath, expectedSteps) {
  const consoleErrors = []
  const pageErrors = []
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onPageError = (error) => pageErrors.push(error.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  const url = `${baseUrl}${routePath}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)

  const stepCount = await page
    .locator('[data-step-count]')
    .first()
    .getAttribute('data-step-count')
    .catch(() => null)
  const count = Number(stepCount)
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`route ${routePath} has no readable data-step-count hook`)
  }
  if (expectedSteps && count !== expectedSteps.length) {
    throw new Error(
      `route ${routePath} reports ${count} step(s), expected the canonical ${expectedSteps.length}`,
    )
  }

  for (let step = 0; step < count; step += 1) {
    const indexAttr = await page.locator('[data-step-index]').first().getAttribute('data-step-index')
    const currentIndex = Number(indexAttr)
    if (!Number.isFinite(currentIndex) || currentIndex !== step) {
      throw new Error(`route ${routePath} step ${step} did not report the expected data-step-index`)
    }

    if (expectedSteps) {
      const expected = expectedSteps[step]
      const caption = await page.locator('[data-presentation-caption]').first().textContent()
      if (caption?.trim() !== expected.caption) {
        throw new Error(
          `route ${routePath} step ${step} ("${expected.title}") has caption "${caption?.trim()}", expected "${expected.caption}"`,
        )
      }
      // The per-step title is only rendered in present mode's marker, so
      // toggle there (mode switches preserve the step) and back to browse.
      await page.keyboard.press('p')
      const title = await page
        .locator('[data-presentation-marker] [data-presentation-title]')
        .first()
        .textContent()
      await page.keyboard.press('p')
      if (title?.trim() !== expected.title) {
        throw new Error(`route ${routePath} step ${step} has title "${title?.trim()}", expected "${expected.title}"`)
      }
    }

    if (step < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(SETTLE_MS)
    }
  }

  page.off('console', onConsole)
  page.off('pageerror', onPageError)

  if (consoleErrors.length > 0) {
    throw new Error(`route ${routePath} logged console errors: ${consoleErrors.join(' | ')}`)
  }
  if (pageErrors.length > 0) {
    throw new Error(`route ${routePath} threw uncaught page errors: ${pageErrors.join(' | ')}`)
  }
}

async function main() {
  console.log('[verify] building application...')
  await run('npm', ['run', 'build'])

  const slugs = await readRegisteredSlugs()
  console.log(`[verify] found ${slugs.length} registered presentation(s): ${slugs.join(', ')}`)

  if (!slugs.includes(CANONICAL_SAMPLE_SLUG)) {
    fail(
      `committed reference sample "${CANONICAL_SAMPLE_SLUG}" is not registered in src/presentations/index.ts`,
    )
    return
  }

  console.log(`[verify] starting an owned preview on ${HOST}...`)
  const { server, baseUrl } = await startOwnedPreview()
  console.log(`[verify] preview listening at ${baseUrl}`)

  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()

    for (const slug of slugs) {
      const expectedSteps = slug === CANONICAL_SAMPLE_SLUG ? CANONICAL_STEPS : undefined
      await checkRoute(page, baseUrl, `/${slug}`, expectedSteps)
    }

    console.log('[verify] PASS: build succeeded and every checked route rendered cleanly')
  } catch (error) {
    fail(error.message)
  } finally {
    try {
      if (browser) await browser.close()
    } finally {
      await closePreviewServer(server)
    }
  }
}

main().catch((error) => {
  fail(error.stack ?? String(error))
})
