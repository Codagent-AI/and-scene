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
 * 3. If no presentations are registered yet, opens the landing route instead
 *    so a freshly scaffolded (pre-content) app still gets a real render check.
 *
 * Exits non-zero on any failure and names the failing phase/step.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer, preview } from 'vite'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const HOST = '127.0.0.1'
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

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: ROOT, ...options })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

/**
 * Starts a preview server this process exclusively owns, on an OS-assigned
 * port (`port: 0`), so a stale server left on a fixed port by another run
 * can never be mistaken for the build just produced.
 */
async function startOwnedPreview() {
  const server = await preview({
    root: ROOT,
    logLevel: 'silent',
    preview: { host: HOST, port: 0, strictPort: false },
  })
  const address = server.httpServer.address()
  if (!address || typeof address !== 'object') {
    throw new Error('Preview server did not report a bound port')
  }
  return { server, baseUrl: `http://${HOST}:${address.port}` }
}

/** Closes the underlying HTTP server directly, not via PreviewServer.close(). */
function closePreviewServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  })
}

/**
 * Reads the registered presentation slugs by loading the actual exported
 * `presentations` registry through Vite's SSR module loader, rather than
 * regex-matching the source text — a registry entry built from a variable or
 * shorthand (e.g. `const slug = 'x'; { slug, ... }`) has no `slug: '...'`
 * text for a regex to match, so it would silently go unchecked.
 */
async function readRegisteredSlugs() {
  const loader = await createServer({ root: ROOT, server: { middlewareMode: true }, logLevel: 'silent' })
  try {
    const { presentations } = await loader.ssrLoadModule('/src/presentations/index.ts')
    return presentations.map((entry) => entry.slug)
  } finally {
    await loader.close()
  }
}

async function checkRoute(page, baseUrl, routePath, { requireSteps, expectedSteps }) {
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

  if (requireSteps) {
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

    let previousIndex = -1
    for (let step = 0; step < count; step += 1) {
      const indexAttr = await page.locator('[data-step-index]').first().getAttribute('data-step-index')
      const currentIndex = Number(indexAttr)
      if (!Number.isFinite(currentIndex) || currentIndex !== step) {
        throw new Error(`route ${routePath} step ${step} did not report the expected data-step-index`)
      }
      if (currentIndex <= previousIndex && step > 0) {
        throw new Error(`route ${routePath} step index did not advance past ${previousIndex}`)
      }
      previousIndex = currentIndex

      if (expectedSteps) {
        const expected = expectedSteps[step]
        const caption = await page.locator('[data-presentation-caption]').first().textContent()
        if (caption?.trim() !== expected.caption) {
          throw new Error(
            `route ${routePath} step ${step} ("${expected.title}") has caption "${caption?.trim()}", expected "${expected.caption}"`,
          )
        }
      }

      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(SETTLE_MS)
      }
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
  console.log(
    slugs.length > 0
      ? `[verify] found ${slugs.length} registered presentation(s): ${slugs.join(', ')}`
      : '[verify] no presentations registered yet; checking the landing route only',
  )

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
      await checkRoute(page, baseUrl, `/${slug}`, { requireSteps: true, expectedSteps })
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
