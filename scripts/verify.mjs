// Deterministic verification gate: build, registry, and real-browser render check.
// Usage: node scripts/verify.mjs [--slug <slug>]...
// Every registered presentation is stepped through. With scripts/reference-sample.json
// present, the canonical reference sample is additionally held to its normative outline
// (existence, registration, every title/caption in order); `--slug` limits the run.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium, run, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 800

class VerifyError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

function registeredSlugs() {
  const file = ['index.ts', 'index.tsx']
    .map((f) => path.join(root, 'src', 'presentations', f))
    .find(existsSync)
  if (!file) throw new VerifyError('registry', 'src/presentations/index.ts is missing')
  return [...readFileSync(file, 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

function loadReference() {
  const file = path.join(root, 'scripts', 'reference-sample.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

function targets() {
  const args = process.argv.slice(2)
  const slugs = args.flatMap((a, i) => (a === '--slug' ? [args[i + 1]] : []))
  const registered = registeredSlugs()
  const reference = loadReference()
  if (reference && !registered.includes(reference.slug)) {
    throw new VerifyError('sample', `reference sample "${reference.slug}" is not registered`)
  }
  const wanted = slugs.length ? slugs : registered
  if (!wanted.length) throw new VerifyError('registry', 'no presentations are registered')
  for (const slug of wanted) {
    if (!registered.includes(slug)) throw new VerifyError('registry', `"${slug}" is not registered`)
  }
  return wanted.map((slug) => ({ slug, steps: slug === reference?.slug ? reference.steps : null }))
}

async function text(page, selector) {
  return (await page.locator(selector).first().textContent({ timeout: 2000 }))?.trim() ?? ''
}

async function renderPresentation(browser, baseUrl, { slug, steps }) {
  const page = await browser.newPage()
  let step = 0 // the step being rendered, or entered by the key press in flight
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`step ${step}: console error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`step ${step}: uncaught exception: ${err.message}`))
  const fail = (message) => new VerifyError('render', `${slug}: ${message}`)
  const root$ = '[data-presentation-root]'
  try {
    await page.goto(`${baseUrl}/${slug}`)
    try {
      await page.waitForSelector(root$, { timeout: 10_000 })
    } catch {
      throw fail(`step 0: presentation did not render${errors.length ? ` (${errors[0]})` : ''}`)
    }
    const count = Number(await page.getAttribute(root$, 'data-step-count'))
    if (!count) throw fail('step 0: missing data-step-count hook')
    if (steps && count !== steps.length) {
      throw fail(`expected ${steps.length} steps but the presentation reports ${count}`)
    }
    step = 0
    for (;;) {
      const index = Number(await page.getAttribute(root$, 'data-step-index'))
      if (index !== step) throw fail(`step ${step}: transition failed, step index is ${index}`)
      if (steps) {
        const title = await text(page, '[data-presentation-step-title]')
        const caption = await text(page, '[data-presentation-caption]').catch(() => '')
        if (title !== steps[step].title) {
          throw fail(`step ${step}: title "${title}" does not match "${steps[step].title}"`)
        }
        if (caption !== steps[step].caption) {
          throw fail(`step ${step}: caption "${caption}" does not match "${steps[step].caption}"`)
        }
      }
      await page.waitForTimeout(SETTLE_MS)
      if (errors.length) throw fail(errors[0])
      if (step === count - 1) break
      step += 1
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          ([sel, next]) =>
            document.querySelector(sel)?.getAttribute('data-step-index') === String(next),
          [root$, step],
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        if (errors.length) throw fail(errors[0])
        throw fail(`step ${step - 1}: transition failed, step index did not advance to ${step}`)
      }
    }
    if (errors.length) throw fail(errors[0])
    console.log(`  ok  ${slug}: ${count} steps rendered without errors`)
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('[verify] build')
  if ((await run('npm', ['run', 'build'], { cwd: root })) !== 0) {
    throw new VerifyError('build', 'npm run build failed')
  }
  console.log('[verify] registry')
  const list = targets()
  console.log(`[verify] render`)
  const preview = await startPreview(root)
  let browser
  try {
    browser = await launchChromium()
    console.log(`  preview at ${preview.baseUrl}`)
    for (const target of list) await renderPresentation(browser, preview.baseUrl, target)
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().then(
  () => console.log('VERIFY PASSED'),
  (err) => {
    console.error(`VERIFY FAILED [${err.phase ?? 'internal'}]: ${err.message}`)
    process.exit(1)
  },
)
