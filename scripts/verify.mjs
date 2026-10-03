#!/usr/bin/env node
/**
 * Deterministic build + browser-render gate for the whole app.
 *
 * 1. `npm run build` — fails on any type or build error.
 * 2. Confirms the committed reference sample ("how-to-make-a-presentation")
 *    is registered and implements the nine canonical steps, in order, with
 *    their normative titles and captions.
 * 3. Starts `vite preview` on 127.0.0.1 and, for every route registered in
 *    `src/presentations/index.ts`, drives it with Playwright/Chromium through
 *    every step (via the `data-step-count` / `data-step-index` chrome hooks),
 *    failing on console errors, page errors, or a step that does not advance.
 *
 * Exits non-zero and names the failing phase/step on any failure.
 */
import { advanceToStep, openPresentation, readRegistrySlugs, runProjectBuild, startPreviewServer } from './lib/preview-server.mjs'

/** Slug of the committed reference sample this project must always ship. */
const REFERENCE_SLUG = 'how-to-make-a-presentation'

/**
 * Normative titles/captions from
 * `openspec/changes/create-and-scene/specs/presentation-verification/spec.md`.
 * Order and text are authoritative.
 */
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

function runBuild() {
  console.log('[verify] building...')
  if (!runProjectBuild()) {
    fail('npm run build did not succeed')
    return false
  }
  console.log('[verify] build OK')
  return true
}

function assertReferenceSampleRegistered(registry) {
  const entry = registry.find((candidate) => candidate.slug === REFERENCE_SLUG)
  if (!entry) {
    fail(`committed reference sample "${REFERENCE_SLUG}" is not registered in src/presentations/index.ts`)
    return false
  }
  return true
}

/** Bounded pause after a step becomes current, so delayed entrances/timers/animation-completion errors surface before it's checked. */
const STEP_SETTLE_MS = 500

async function verifyRoute(browser, baseUrl, entry) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })

  const isReferenceSample = entry.slug === REFERENCE_SLUG
  const observedSteps = []

  try {
    const { root, stepCount } = await openPresentation(page, baseUrl, entry.slug)

    if (isReferenceSample && stepCount !== CANONICAL_STEPS.length) {
      return {
        ok: false,
        reason: `"${entry.slug}" must implement all ${CANONICAL_STEPS.length} canonical steps, found data-step-count=${stepCount}`,
      }
    }

    for (let index = 0; index < stepCount; index += 1) {
      const current = Number(await root.getAttribute('data-step-index'))
      if (current !== index) {
        return { ok: false, reason: `"${entry.slug}" step ${index}: expected data-step-index=${index}, got ${current}` }
      }

      if (isReferenceSample) {
        const title = (await page.locator('[data-presentation-step-title]').textContent())?.trim() ?? ''
        const caption = (await page.locator('[data-presentation-caption]').textContent())?.trim() ?? ''
        observedSteps.push({ title, caption })
      }

      // Let this step's own entrances/timers/animation-completion callbacks
      // run (and any error they throw) before checking errors or advancing —
      // including the last step, which otherwise never gets this wait. Any
      // error fails immediately, so every error seen here belongs to this step.
      await page.waitForTimeout(STEP_SETTLE_MS)
      if (errors.length > 0) {
        return {
          ok: false,
          reason: `"${entry.slug}" step ${index} reported ${errors.length} browser error(s):\n  ${errors.join('\n  ')}`,
        }
      }

      if (index < stepCount - 1) {
        try {
          await advanceToStep(page, index + 1)
        } catch {
          const stalledAt = await root.getAttribute('data-step-index')
          return {
            ok: false,
            reason: `"${entry.slug}" step ${index} did not advance to step ${index + 1}: data-step-index is still ${stalledAt}`,
          }
        }
      }
    }

    if (isReferenceSample) {
      for (let index = 0; index < CANONICAL_STEPS.length; index += 1) {
        const expected = CANONICAL_STEPS[index]
        const observed = observedSteps[index]
        if (observed.title !== expected.title || observed.caption !== expected.caption) {
          return {
            ok: false,
            reason:
              `"${entry.slug}" step ${index} does not match the canonical outline:\n` +
              `  expected title "${expected.title}", caption "${expected.caption}"\n` +
              `  got      title "${observed.title}", caption "${observed.caption}"`,
          }
        }
      }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: `"${entry.slug}" failed to render: ${error.message}` }
  } finally {
    await context.close()
  }
}

async function runRenderChecks() {
  const registry = await readRegistrySlugs()
  if (registry.length === 0) {
    fail('no presentations are registered; the committed reference sample must exist')
    return false
  }

  if (!assertReferenceSampleRegistered(registry)) {
    return false
  }

  const { chromium } = await import('playwright')
  const server = await startPreviewServer()
  console.log(`[verify] preview server ready at ${server.baseUrl}`)
  let browser

  try {
    browser = await chromium.launch()
    let allOk = true
    for (const entry of registry) {
      console.log(`[verify] rendering "${entry.slug}"...`)
      const result = await verifyRoute(browser, server.baseUrl, entry)
      if (!result.ok) {
        fail(result.reason)
        allOk = false
      } else {
        console.log(`[verify] "${entry.slug}" OK (${entry.title})`)
      }
    }
    return allOk
  } finally {
    await browser?.close()
    await server.stop()
  }
}

async function main() {
  if (!runBuild()) {
    process.exit(1)
  }

  const renderOk = await runRenderChecks()
  if (!renderOk) {
    process.exit(1)
  }

  console.log('\n[verify] PASS')
}

main().catch((error) => {
  fail(error.stack ?? String(error))
  process.exit(1)
})
