#!/usr/bin/env node
// Build + browser-render verification. Exits non-zero and names the failed phase on any failure.
//   node scripts/verify.mjs [--canonical-sample]
// --canonical-sample additionally requires the committed reference sample and checks it against its spec.
import path from 'node:path'
import { chromium } from 'playwright'
import { run, sleep, startPreview, tail } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')
const SAMPLE_SLUG = 'how-to-make-a-presentation'
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 250

/** Normative steps of the reference sample: [era, presenter title, browse caption]. */
const CANONICAL_STEPS = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

class VerifyError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

const log = (line) => console.log(`[verify] ${line}`)

async function buildPhase() {
  const { code, output } = await run('npm', ['run', 'build'], { cwd: root })
  if (code !== 0) throw new VerifyError('build', `npm run build exited ${code}\n${tail(output)}`)
  log('PASS build')
}

async function discover(browser, url) {
  const page = await browser.newPage()
  try {
    await page.goto(`${url}/`)
    await page.waitForSelector('main', { timeout: 10_000 })
    return await page.$$eval('a[data-landing-link]', (links) => links.map((a) => a.getAttribute('data-landing-link')))
  } finally {
    await page.close()
  }
}

async function renderPresentation(browser, url, slug) {
  const page = await browser.newPage()
  let step = 0
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`step index ${step}: console error: ${msg.text()}`))
  page.on('pageerror', (error) => errors.push(`step index ${step}: page error: ${error.message}`))
  const assertClean = () => {
    if (errors.length) throw new VerifyError('render', `${slug}: ${errors[0]}`)
  }
  const sel = '[data-presentation-root]'
  try {
    await page.goto(`${url}/${slug}`)
    try {
      await page.waitForSelector(sel, { timeout: 15_000 })
    } catch {
      assertClean()
      throw new VerifyError('render', `${slug}: presentation did not render (step index 0)`)
    }
    const count = Number(await page.getAttribute(sel, 'data-step-count'))
    if (!(count > 0)) throw new VerifyError('render', `${slug}: no steps found (step index 0)`)
    if ((await page.getAttribute(sel, 'data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
    const canonical = slug === SAMPLE_SLUG ? CANONICAL_STEPS : null
    if (canonical && count !== canonical.length) {
      throw new VerifyError('sample', `${slug}: expected ${canonical.length} steps, found ${count}`)
    }

    for (let i = 0; i < count; i++) {
      step = i
      const index = Number(await page.getAttribute(sel, 'data-step-index'))
      if (index !== i) throw new VerifyError('render', `${slug}: step index ${i}: expected index ${i}, saw ${index}`)
      if (canonical) {
        const read = await page.evaluate(() => ({
          era: document.querySelector('[data-presentation-marker]')?.getAttribute('data-presentation-era'),
          title: document.querySelector('[data-presentation-step-title]')?.textContent,
          caption: document.querySelector('[data-presentation-step-caption]')?.textContent,
        }))
        const [era, title, caption] = canonical[i]
        for (const [field, want] of [['era', era], ['title', title], ['caption', caption]]) {
          if (read[field] !== want) {
            throw new VerifyError('sample', `${slug}: step index ${i}: ${field} is ${JSON.stringify(read[field])}, expected ${JSON.stringify(want)}`)
          }
        }
      }
      await sleep(SETTLE_MS)
      assertClean()
      if (i === count - 1) break
      step = i + 1
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          ([s, n]) => document.querySelector(s)?.getAttribute('data-step-index') === String(n),
          [sel, i + 1],
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        assertClean()
        throw new VerifyError('render', `${slug}: step index ${i + 1}: transition from step index ${i} did not advance`)
      }
    }
    log(`PASS render ${slug} (${count} steps)`)
  } finally {
    await page.close()
  }
}

async function main() {
  const canonical = process.argv.includes('--canonical-sample')
  let preview
  let browser
  try {
    await buildPhase()
    try {
      preview = await startPreview(root)
    } catch (error) {
      throw new VerifyError('preview', error.message)
    }
    log(`preview ${preview.url}`)
    browser = await chromium.launch()
    const slugs = await discover(browser, preview.url)
    if (canonical && !slugs.includes(SAMPLE_SLUG)) {
      throw new VerifyError('sample', `reference sample "${SAMPLE_SLUG}" is not registered`)
    }
    if (slugs.length === 0) throw new VerifyError('sample', 'no presentations are registered')
    log(`PASS registry (${slugs.join(', ')})`)
    for (const slug of slugs) await renderPresentation(browser, preview.url, slug)
    log('PASS verification complete')
  } catch (error) {
    const phase = error instanceof VerifyError ? error.phase : 'internal'
    console.error(`[verify] FAIL ${phase}: ${error.message}`)
    process.exitCode = 1
  } finally {
    await browser?.close()
    await preview?.stop()
  }
}

await main()
