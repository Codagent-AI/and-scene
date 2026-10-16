#!/usr/bin/env node
// Deterministic verification gate: build, reference-outline check, then render
// every step of each presentation in Chromium against `vite preview` on 127.0.0.1.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadChromium, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(path.join(root, 'scripts', 'verify.config.json'), 'utf8'))
const STEP_TIMEOUT = 5_000

class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

function build() {
  const res = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  if (res.status !== 0) throw new VerifyError('build', 'npm run build failed')
}

function registeredSlugs() {
  let text
  try {
    text = readFileSync(path.join(root, 'src', 'presentations', 'index.ts'), 'utf8')
  } catch {
    throw new VerifyError('registry', 'src/presentations/index.ts is missing')
  }
  return [...text.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

function checkRegistry() {
  const slugs = registeredSlugs()
  for (const req of config.required) {
    if (!slugs.includes(req.slug)) {
      throw new VerifyError('registry', `required presentation "${req.slug}" is not registered`)
    }
  }
  return slugs
}

const textOf = (page, selector) =>
  page.locator(selector).first().textContent({ timeout: STEP_TIMEOUT }).then((t) => (t ?? '').trim())

async function renderPresentation(browser, origin, slug, outline) {
  const page = await browser.newPage()
  let step = 0
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  const fail = (message) => {
    throw new VerifyError('render', `${slug}: ${message}`, step)
  }
  const flush = () => {
    if (errors.length) fail(errors.join('; '))
  }
  try {
    await page.goto(`${origin}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT })
    } catch {
      flush()
      fail('presentation did not render')
    }
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    if (!(count > 0)) fail('data-step-count is missing or zero')
    if (outline && outline.length !== count) fail(`expected ${outline.length} steps, found ${count}`)
    for (step = 0; step < count; step++) {
      const index = await page.getAttribute('[data-presentation-root]', 'data-step-index')
      if (Number(index) !== step) fail(`expected data-step-index ${step}, found ${index}`)
      if (outline) {
        const title = await textOf(page, '[data-presentation-step-title]')
        if (title !== outline[step].title) fail(`title "${title}" does not match "${outline[step].title}"`)
        const mode = await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')
        if (mode === 'browse') {
          const caption = await textOf(page, '[data-presentation-caption]')
          if (caption !== outline[step].caption) fail(`caption "${caption}" does not match "${outline[step].caption}"`)
        }
      }
      await page.waitForTimeout(250)
      flush()
      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            step + 1,
            { timeout: STEP_TIMEOUT },
          )
        } catch {
          flush()
          step += 1
          fail(`transition to step ${step} did not advance data-step-index`)
        }
      }
    }
    await page.waitForTimeout(250)
    flush()
    return count
  } finally {
    await page.close()
  }
}

async function render(slugs) {
  const chromium = await loadChromium(root)
  const preview = await startPreview(root)
  let browser
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] })
    for (const slug of slugs) {
      const outline = config.required.find((r) => r.slug === slug)?.steps
      const count = await renderPresentation(browser, preview.origin, slug, outline)
      console.log(`[verify] rendered ${slug}: ${count} steps via ${preview.origin}`)
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
}

async function main() {
  let phase = 'build'
  try {
    phase = 'build'
    build()
    console.log('[verify] build: ok')
    phase = 'registry'
    const slugs = checkRegistry()
    console.log(`[verify] registry: ok (${slugs.join(', ')})`)
    phase = 'render'
    await render(slugs)
    console.log('[verify] PASS')
  } catch (err) {
    const where = err instanceof VerifyError ? err.phase : phase
    const step = err instanceof VerifyError && err.step !== undefined ? ` step=${err.step}` : ''
    console.error(`[verify] FAIL phase=${where}${step}: ${err.message}`)
    process.exitCode = 1
  }
}

await main()
