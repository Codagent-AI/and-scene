// Deterministic verification: outline -> registry -> build -> production render.
// Usage: node scripts/verify.mjs   (npm run verify). Exits non-zero on any failure.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HOST, PhaseError, defaultDeps, previewUrl } from './lib/preview.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TRANSITION_TIMEOUT_MS = 5000

/** Validate the outline data this verifier enforces (scripts/verify.config.json). */
export function validateOutline(outline) {
  const fail = (message) => {
    throw new PhaseError('outline', `scripts/verify.config.json is malformed: ${message}`)
  }
  if (!outline || typeof outline !== 'object') fail('expected an object')
  for (const key of ['slug', 'title']) {
    if (typeof outline[key] !== 'string' || !outline[key].trim()) fail(`"${key}" must be a non-empty string`)
  }
  if (!Array.isArray(outline.steps) || outline.steps.length === 0) fail('"steps" must be a non-empty array')
  outline.steps.forEach((step, i) => {
    for (const key of ['era', 'title', 'caption']) {
      if (typeof step?.[key] !== 'string' || !step[key].trim()) fail(`steps[${i}].${key} must be a non-empty string`)
    }
  })
  return outline
}

/** `verify.config.json` holds one outline, or `{ "presentations": [outline, ...] }` to verify several. */
export function loadOutlines(root) {
  const file = join(root, 'scripts', 'verify.config.json')
  if (!existsSync(file)) throw new PhaseError('outline', `missing ${file}`)
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new PhaseError('outline', `scripts/verify.config.json is not valid JSON: ${error.message}`)
  }
  if (Array.isArray(parsed?.presentations)) {
    if (parsed.presentations.length === 0) throw new PhaseError('outline', 'scripts/verify.config.json is malformed: "presentations" must not be empty')
    return parsed.presentations.map(validateOutline)
  }
  return [validateOutline(parsed)]
}

export const loadOutline = (root) => loadOutlines(root)[0]

/** The sample must be registered and its loader's file must exist. */
export function checkRegistry(root, outline) {
  const indexFile = join(root, 'src', 'presentations', 'index.ts')
  if (!existsSync(indexFile)) throw new PhaseError('registry', 'missing src/presentations/index.ts')
  const source = readFileSync(indexFile, 'utf8')
  const entry = new RegExp(`slug:\\s*['"]${outline.slug}['"][\\s\\S]*?import\\(\\s*['"]([^'"]+)['"]\\s*\\)`).exec(source)
  if (!entry) throw new PhaseError('registry', `presentation "${outline.slug}" is not registered in src/presentations/index.ts`)
  const target = join(root, 'src', 'presentations', entry[1])
  if (!existsSync(target)) throw new PhaseError('registry', `registered presentation "${outline.slug}" is missing its entry file ${entry[1]}`)
}

/** A transition must land exactly on the next index. */
export function checkTransition(from, to, expected) {
  if (to === expected) return
  throw new PhaseError('transition', `step ${from + 1}: pressing ArrowRight left data-step-index at ${to}, expected ${expected}`)
}

/** Collects console.error and uncaught page errors against the step being viewed. */
export function createErrorCollector(page, getStep) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ step: getStep(), kind: 'console.error', text: message.text() })
  })
  page.on('pageerror', (error) => errors.push({ step: getStep(), kind: 'pageerror', text: error.message }))
  return {
    errors,
    assertClean() {
      if (errors.length === 0) return
      const first = errors[0]
      throw new PhaseError('render', `step ${first.step + 1}: ${first.kind}: ${first.text}`)
    },
  }
}

async function readIndex(page) {
  return Number(await page.getAttribute('[data-presentation-root]', 'data-step-index'))
}

export async function renderSteps(page, outline, baseUrl, log = () => {}) {
  let current = 0
  const collector = createErrorCollector(page, () => current)
  const url = `${baseUrl}/${outline.slug}`
  log(`verify: opening ${url}`)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('[data-presentation-root]', { timeout: 15000 }).catch(() => {
    collector.assertClean()
    throw new PhaseError('render', `${url} did not render a presentation`)
  })
  const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
  if (count !== outline.steps.length) {
    throw new PhaseError('render', `expected ${outline.steps.length} steps, the chrome reports data-step-count=${count}`)
  }
  if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') {
    throw new PhaseError('render', 'the presentation must open in browse mode so titles and captions are rendered')
  }
  for (let i = 0; i < count; i++) {
    current = i
    const index = await readIndex(page)
    if (index !== i) throw new PhaseError('render', `step ${i + 1}: data-step-index is ${index}, expected ${i}`)
    const era = (await page.textContent('[data-presentation-era]'))?.trim()
    const title = (await page.textContent('[data-presentation-step-title]'))?.trim()
    const caption = (await page.textContent('[data-presentation-caption]'))?.trim()
    const want = outline.steps[i]
    if (era !== want.era) throw new PhaseError('render', `step ${i + 1}: era "${era}" does not match "${want.era}"`)
    if (title !== want.title) throw new PhaseError('render', `step ${i + 1}: title "${title}" does not match "${want.title}"`)
    if (caption !== want.caption) throw new PhaseError('render', `step ${i + 1}: caption does not match the outline`)
    if (i < count - 1) {
      current = i + 1 // anything raised while the next step renders belongs to that step
      await page.keyboard.press('ArrowRight')
      const landed = await page
        .waitForFunction(
          (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
          i + 1,
          { timeout: TRANSITION_TIMEOUT_MS },
        )
        .then(() => i + 1, () => null)
      checkTransition(i, landed ?? (await readIndex(page)), i + 1)
    }
    await page.waitForTimeout(150)
    collector.assertClean()
    log(`verify: step ${i + 1}/${count} (data-step-index=${i}) "${title}" ok`)
  }
  await page.waitForTimeout(500)
  collector.assertClean()
  return count
}

export async function verify(root = ROOT, log = console.log, deps = defaultDeps) {
  const outlines = loadOutlines(root)
  log(`verify: outline ok (${outlines.map((o) => `${o.slug}, ${o.steps.length} steps`).join('; ')})`)
  for (const outline of outlines) checkRegistry(root, outline)
  log('verify: registry ok')
  await deps.runBuild(root)
  log('verify: build ok')
  const preview = await deps.startPreview(root)
  let browser
  try {
    log(`verify: preview on ${HOST}:${preview.port}`)
    browser = await deps.launchBrowser()
    for (const outline of outlines) {
      const page = await browser.newPage()
      const count = await renderSteps(page, outline, previewUrl(preview.port, ''), log)
      log(`verify: render ok (${count} steps)`)
    }
  } finally {
    // The preview must stop even when closing the browser fails.
    try {
      await browser?.close()
    } finally {
      await preview.stop()
    }
  }
  return outlines
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verify().then(
    (outlines) => {
      console.log(`PASS verify: outline, registry, build, render (${outlines.reduce((n, o) => n + o.steps.length, 0)} steps)`)
    },
    (error) => {
      console.error(`FAIL verify [${error.phase ?? 'error'}]: ${error.message}`)
      process.exitCode = 1
    },
  )
}
