#!/usr/bin/env node
/**
 * Deterministic build + browser-render verification for this repository.
 *
 * Unlike the generic bootstrap template's `scripts/verify.mjs` (which makes
 * no assumption about which presentations exist), this script additionally
 * knows about the committed reference sample — "How to Use This Skill to
 * Make a Presentation" — and asserts it is registered and implements the
 * canonical nine-step outline from
 * `openspec/changes/create-and-scene/specs/presentation-verification/spec.md`
 * in order.
 *
 * Phases (any failure exits non-zero and names the phase):
 *   1. build    - `npm run build` (tsc -b && vite build)
 *   2. registry - src/presentations/index.ts must register the canonical
 *                 sample slug, in canonical position/order
 *   3. render   - `vite preview` on 127.0.0.1, then Playwright Chromium
 *                 opens the sample route and steps through all nine steps,
 *                 asserting each step's title/caption match the canonical
 *                 outline in order, with no console/page errors
 */
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const isWindows = process.platform === 'win32'

// Covers the kit's ENTER_DELAY (500ms) + ENTER_T (350ms) newcomer-entry
// animation plus a margin, so console/page errors raised by an entry
// animation or an async effect after navigation are observed before the
// next step advances or the page closes (mirrors scripts/inspect-presentation.mjs).
const SETTLE_MS = 1000

const CANONICAL_SLUG = 'how-to-make-a-presentation'

/** The nine-step outline is normative (titles/captions/order); see the spec cited above. */
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
  {
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  },
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

function fail(phase, message) {
  console.error(`\n[verify] FAILED (${phase}): ${message}\n`)
  process.exit(1)
}

function runBuild() {
  console.log('[verify] build: running `npm run build` (tsc -b && vite build)...')
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.status !== 0) {
    fail('build', 'tsc/vite build reported errors (see output above)')
  }
  console.log('[verify] build: OK')
}

function readRegisteredSlugs() {
  const registryPath = path.join(ROOT, 'src', 'presentations', 'index.ts')
  let source
  try {
    source = readFileSync(registryPath, 'utf8')
  } catch {
    fail('registry', `could not read ${registryPath}`)
  }
  const slugPattern = /slug:\s*['"]([^'"]+)['"]/g
  const slugs = []
  let match
  while ((match = slugPattern.exec(source)) !== null) {
    slugs.push(match[1])
  }
  if (slugs.length === 0) {
    fail('registry', 'src/presentations/index.ts has zero registered presentations')
  }
  if (!slugs.includes(CANONICAL_SLUG)) {
    fail(
      'registry',
      `the committed reference sample "${CANONICAL_SLUG}" is not registered in src/presentations/index.ts`,
    )
  }
  console.log(`[verify] registry: found ${slugs.length} presentation(s): ${slugs.join(', ')}`)
  return slugs
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => (port ? resolve(port) : reject(new Error('could not allocate a free port'))))
    })
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {
      // Not up yet; retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`preview server at ${url} did not become ready within ${timeoutMs}ms`)
}

/** Kills a spawned process and waits for it to actually exit, so the port is released before this script exits. */
function terminate(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    child.once('exit', () => resolve())
    child.kill()
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }, 3000).unref()
  })
}

async function checkGenericSlug(browser, baseUrl, slug) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`)
  })

  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ state: 'attached', timeout: 10000 })
    await page.waitForTimeout(SETTLE_MS)

    const stepCount = Number(await root.getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      return { ok: false, reason: `invalid data-step-count on route /${slug}` }
    }

    const initialIndex = Number(await root.getAttribute('data-step-index'))
    if (initialIndex !== 0) {
      return {
        ok: false,
        reason: `expected initial data-step-index=0 on /${slug}, got ${initialIndex}`,
        stepIndex: initialIndex,
      }
    }
    let checkedErrorCount = errors.length
    if (checkedErrorCount > 0) {
      return { ok: false, reason: errors.join('; '), stepIndex: initialIndex }
    }

    for (let expected = 1; expected < stepCount; expected += 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(SETTLE_MS)
      const next = Number(await root.getAttribute('data-step-index'))
      if (next !== expected) {
        return {
          ok: false,
          reason: `step transition did not advance by one: expected data-step-index=${expected}, got ${next}`,
          stepIndex: expected,
        }
      }
      if (errors.length > checkedErrorCount) {
        return { ok: false, reason: errors.slice(checkedErrorCount).join('; '), stepIndex: expected }
      }
      checkedErrorCount = errors.length
    }

    // One more press past the last step must not wrap or overshoot.
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(SETTLE_MS)
    const afterLast = Number(await root.getAttribute('data-step-index'))
    if (afterLast !== stepCount - 1) {
      return {
        ok: false,
        reason: `navigation past the last step should clamp at ${stepCount - 1}, got ${afterLast}`,
        stepIndex: afterLast,
      }
    }

    if (errors.length > checkedErrorCount) {
      return { ok: false, reason: errors.slice(checkedErrorCount).join('; '), stepIndex: afterLast }
    }

    return { ok: true, stepCount }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  } finally {
    await page.close()
  }
}

/**
 * Renders the canonical reference sample and asserts, at every one of its
 * nine steps, that the title/caption match the normative outline in order,
 * in addition to the generic step-count/transition/no-console-error checks.
 */
async function checkCanonicalSample(browser, baseUrl) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`)
  })

  try {
    await page.goto(`${baseUrl}/${CANONICAL_SLUG}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ state: 'attached', timeout: 10000 })
    await page.waitForTimeout(SETTLE_MS)

    const stepCount = Number(await root.getAttribute('data-step-count'))
    if (stepCount !== CANONICAL_STEPS.length) {
      return {
        ok: false,
        reason: `expected the canonical sample to have ${CANONICAL_STEPS.length} steps, found ${stepCount}`,
      }
    }

    let checkedErrorCount = 0
    for (let index = 0; index < CANONICAL_STEPS.length; index += 1) {
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(SETTLE_MS)
      }

      const observedIndex = Number(await root.getAttribute('data-step-index'))
      if (observedIndex !== index) {
        return {
          ok: false,
          reason: `step transition did not advance by one: expected data-step-index=${index}, got ${observedIndex}`,
          stepIndex: index,
        }
      }
      if (errors.length > checkedErrorCount) {
        return { ok: false, reason: errors.slice(checkedErrorCount).join('; '), stepIndex: index }
      }
      checkedErrorCount = errors.length

      const expected = CANONICAL_STEPS[index]
      const title = (await page.locator('[data-presentation-title]').textContent())?.trim()
      const caption = (await page.locator('[data-presentation-caption]').textContent())?.trim()

      if (title !== expected.title) {
        return {
          ok: false,
          reason: `step ${index} title mismatch: expected "${expected.title}", got "${title}"`,
          stepIndex: index,
        }
      }
      if (caption !== expected.caption) {
        return {
          ok: false,
          reason: `step ${index} caption mismatch: expected "${expected.caption}", got "${caption}"`,
          stepIndex: index,
        }
      }
    }

    if (errors.length > 0) {
      return { ok: false, reason: errors.join('; ') }
    }

    return { ok: true, stepCount }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  } finally {
    await page.close()
  }
}

async function main() {
  runBuild()
  const slugs = readRegisteredSlugs()

  const port = await getFreePort()
  const host = '127.0.0.1'
  const baseUrl = `http://${host}:${port}`

  console.log(`[verify] render: starting \`vite preview\` on ${baseUrl} ...`)
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  let previewOutput = ''
  preview.stdout?.on('data', (chunk) => {
    previewOutput += chunk.toString()
  })
  preview.stderr?.on('data', (chunk) => {
    previewOutput += chunk.toString()
  })

  let failures = []
  try {
    await waitForServer(baseUrl)

    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    try {
      for (const slug of slugs) {
        const result =
          slug === CANONICAL_SLUG ? await checkCanonicalSample(browser, baseUrl) : await checkGenericSlug(browser, baseUrl, slug)
        if (result.ok) {
          console.log(`[verify] render: OK "${slug}" (${result.stepCount} steps, no console/page errors)`)
        } else {
          const at = result.stepIndex !== undefined ? ` at step ${result.stepIndex}` : ''
          console.error(`[verify] render: FAILED "${slug}"${at}: ${result.reason}`)
          failures.push({ slug, ...result })
        }
      }
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error(`[verify] render: unexpected failure: ${err instanceof Error ? err.message : String(err)}`)
    console.error(previewOutput)
    failures.push({ slug: '(preview startup)', reason: String(err) })
  } finally {
    await terminate(preview)
  }

  if (failures.length > 0) {
    fail('render', `${failures.length} presentation(s) failed: ${failures.map((f) => f.slug).join(', ')}`)
  }

  console.log('\n[verify] All checks passed (build, registry, render).\n')
  process.exit(0)
}

main().catch((err) => {
  console.error(`[verify] unexpected error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`)
  process.exit(1)
})
