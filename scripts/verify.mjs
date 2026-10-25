#!/usr/bin/env node
// Build + browser-render verification. Exits non-zero on any failure and names the failed phase.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { run, startPreview } from './preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REFERENCE_SLUG = 'how-to-make-a-presentation'
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 150

// The canonical reference sample: titles and captions are normative.
const REFERENCE_STEPS = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ["Changed your mind? Loop it.", 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

class VerifyError extends Error {
  constructor(phase, message, where = {}) {
    super(message)
    this.phase = phase
    this.where = where
  }
}

const log = (line) => console.log(`[verify] ${line}`)
const norm = (s) => (s ?? '').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()

function requiresReference() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  return pkg.andScene?.requireReferenceSample === true
}

function registeredSlugs() {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(file)) throw new VerifyError('registry', 'src/presentations/index.ts is missing')
  return [...fs.readFileSync(file, 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

async function buildPhase() {
  log('phase build: npm run build')
  const { code, output } = await run('npm', ['run', 'build'], root)
  if (code !== 0) throw new VerifyError('build', `npm run build failed (exit ${code})\n${output.trim().split('\n').slice(-30).join('\n')}`)
  log('PASS build')
}

function sampleRegistryPhase(slugs) {
  if (!requiresReference()) return
  log('phase sample: reference sample is registered')
  if (!slugs.includes(REFERENCE_SLUG)) {
    throw new VerifyError('sample', `reference sample "${REFERENCE_SLUG}" is not registered in src/presentations/index.ts`)
  }
  log('PASS sample registry')
}

async function stepThrough(browser, baseUrl, slug) {
  const isReference = requiresReference() && slug === REFERENCE_SLUG
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  let current = 0
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: current, text: `console error: ${msg.text()}` })
  })
  page.on('pageerror', (err) => errors.push({ step: current, text: `uncaught exception: ${err.message}` }))
  const fail = (phase, message) => new VerifyError(phase, message, { presentation: slug, step: current })
  const url = `${baseUrl}/${slug}`
  log(`render ${url}`)
  try {
    await page.goto(url, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      throw fail('render', 'presentation root [data-presentation-root] did not render')
    }
    const root$ = page.locator('[data-presentation-root]')
    const count = Number(await root$.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw fail('render', 'data-step-count is missing or invalid')
    if (isReference) {
      if (count !== REFERENCE_STEPS.length) {
        throw fail('sample', `reference sample has ${count} steps, expected ${REFERENCE_STEPS.length}`)
      }
      if ((await root$.getAttribute('data-mode')) !== 'browse') await page.keyboard.press('p')
    }
    for (let i = 0; i < count; i++) {
      const index = Number(await root$.getAttribute('data-step-index'))
      if (index !== i) throw fail('render', `expected data-step-index ${i}, found ${index}`)
      await page.waitForTimeout(SETTLE_MS)
      if (isReference) {
        const title = norm(await page.locator('[data-presentation-step-title]').textContent())
        const caption = norm(await page.locator('[data-presentation-caption]').textContent())
        const [wantTitle, wantCaption] = REFERENCE_STEPS[i].map(norm)
        if (title !== wantTitle) throw fail('sample', `title mismatch: expected "${wantTitle}", found "${title}"`)
        if (caption !== wantCaption) throw fail('sample', `caption mismatch: expected "${wantCaption}", found "${caption}"`)
      }
      const here = errors.find((e) => e.step === i)
      if (here) throw fail('render', here.text)
      log(`  step ${i + 1}/${count} ok${isReference ? `: ${REFERENCE_STEPS[i][0]}` : ''}`)
      if (i < count - 1) {
        // Errors raised while moving to the next step belong to that step.
        current = i + 1
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            i + 1,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          throw new VerifyError('render', `transition did not advance data-step-index from ${i} to ${i + 1}`, { presentation: slug, step: i })
        }
      }
    }
    const trailing = errors.find((e) => e.step >= count - 1)
    if (trailing) throw fail('render', trailing.text)
    log(`PASS render ${slug} (${count} steps)`)
  } finally {
    await context.close()
  }
}

async function renderPhase(slugs) {
  log('phase render: vite preview on 127.0.0.1')
  const preview = await startPreview(root).catch((err) => {
    throw new VerifyError('preview', err.message)
  })
  log(`preview ready at ${preview.url}`)
  let browser
  try {
    browser = await chromium.launch()
    for (const slug of slugs) await stepThrough(browser, preview.url, slug)
  } finally {
    await browser?.close().catch(() => {})
    preview.stop()
  }
}

async function main() {
  const slugs = registeredSlugs()
  await buildPhase()
  sampleRegistryPhase(slugs)
  if (slugs.length === 0) throw new VerifyError('registry', 'no presentations are registered')
  await renderPhase(slugs)
  log('VERIFY PASSED')
}

main().catch((err) => {
  if (err instanceof VerifyError) {
    const { presentation, step } = err.where
    const at = presentation !== undefined ? ` presentation=${presentation} step=${step + 1} (index ${step})` : ''
    console.error(`[verify] FAIL phase=${err.phase}${at}: ${err.message}`)
    console.error(`[verify] VERIFY FAILED (phase: ${err.phase})`)
  } else {
    console.error(`[verify] FAIL phase=unexpected: ${err?.stack ?? err}`)
    console.error('[verify] VERIFY FAILED (phase: unexpected)')
  }
  process.exit(1)
})
