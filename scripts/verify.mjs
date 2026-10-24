// Deterministic verification gate: build, sample outline, real-browser render.
// Usage: npm run verify [-- <slug>]   (a slug checks that presentation instead of the reference one)
import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PhaseError, runNpm, startPreview } from './lib/preview.mjs'

export const SETTLE_MS = Number(process.env.VERIFY_SETTLE_MS ?? 1200)
const TRANSITION_TIMEOUT_MS = 4_000

/** Compare a presentation's steps against the expected outline; returns problems. */
export function checkOutline(outline, steps) {
  const problems = []
  if (!Array.isArray(steps)) return ['steps are not an array']
  if (steps.length === 0) return ['presentation has no steps']
  const ids = new Set()
  steps.forEach((step, i) => {
    for (const field of ['id', 'era', 'title', 'caption']) {
      if (typeof step?.[field] !== 'string' || step[field].trim() === '') {
        problems.push(`step ${i}: missing ${field}`)
      }
    }
    if (typeof step?.id === 'string') {
      if (ids.has(step.id)) problems.push(`step ${i}: duplicate id "${step.id}"`)
      ids.add(step.id)
    }
  })
  if (!outline) return problems
  if (steps.length !== outline.length) {
    problems.push(`expected ${outline.length} steps, found ${steps.length}`)
  }
  outline.forEach((want, i) => {
    const got = steps[i]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        problems.push(`step ${i}: ${field} is ${JSON.stringify(got[field])}, expected ${JSON.stringify(want[field])}`)
      }
    }
  })
  return problems
}

/** The registry must name the slug and title of the reference presentation. */
export function checkRegistry(source, { slug, title }) {
  const problems = []
  const quoted = (value) => `['"\`]${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`
  if (!new RegExp(`['"]?slug['"]?\\s*:\\s*${quoted(slug)}`).test(source)) problems.push(`registry has no entry with slug "${slug}"`)
  if (title && !new RegExp(`['"]?title['"]?\\s*:\\s*${quoted(title)}`).test(source)) problems.push(`registry entry "${slug}" lacks title "${title}"`)
  return problems
}

/** Collects console errors and uncaught page errors, attributed to the active step. */
export function createErrorCollector() {
  const errors = []
  let current = 'initial'
  return {
    setStep: (step) => (current = step),
    onConsole: (type, text) => {
      if (type === 'error') errors.push({ step: current, message: `console.error: ${text}` })
    },
    onPageError: (message) => errors.push({ step: current, message: `uncaught exception: ${message}` }),
    first: () => errors[0],
    count: () => errors.length,
  }
}

async function loadSteps(cwd, config) {
  let server
  try {
    const { createServer } = await import(pathToFileURL(path.join(cwd, 'node_modules/vite/dist/node/index.js')).href)
    server = await createServer({ root: cwd, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' })
    const mod = await server.ssrLoadModule(config.stepsModule)
    return mod[config.stepsExport]
  } catch (error) {
    throw new PhaseError('sample', `could not load ${config.stepsModule}: ${error.message}`)
  } finally {
    await server?.close()
  }
}

async function listSources(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listSources(full)))
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full)
  }
  return out
}

/** The registry is `src/presentations/index.*`, or any source mapping slugs to loaders. */
async function readRegistrySource(cwd) {
  const files = (await listSources(path.join(cwd, 'src'))).sort((a, b) => Number(/presentations[\\/]index\./.test(b)) - Number(/presentations[\\/]index\./.test(a)))
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    if (/['"]?\bslug\b['"]?\s*:/.test(text) && /['"]?\bload\b['"]?\s*:/.test(text)) return text
  }
  return undefined
}

async function samplePhase(cwd, config, log) {
  const registryOnly = !config.stepsModule
  const source = await readRegistrySource(cwd)
  if (source === undefined) throw new PhaseError('sample', 'no presentation registry (a file mapping slug to load) found under src/')
  const problems = checkRegistry(source, config)
  if (problems.length === 0 && !registryOnly) problems.push(...checkOutline(config.outline, await loadSteps(cwd, config)))
  if (problems.length > 0) throw new PhaseError('sample', problems.join('; '))
  log(`[verify] sample ok: "${config.slug}" registered${config.outline && !registryOnly ? `, ${config.outline.length} steps match the outline` : ''}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function readText(page, selector) {
  const el = page.locator(selector)
  return (await el.count()) > 0 ? ((await el.first().textContent()) ?? '').trim() : null
}

const modeOf = (page) => page.locator('[data-presentation-root]').getAttribute('data-mode')

async function setMode(page, wanted) {
  if ((await modeOf(page)) === wanted) return
  await page.keyboard.press('p')
  await page.waitForFunction(
    (m) => document.querySelector('[data-presentation-root]')?.getAttribute('data-mode') === m,
    wanted,
    { timeout: TRANSITION_TIMEOUT_MS },
  )
}

/** The browse-mode caption and the present-mode title must both show the outline's text. */
async function observeNarration(page, want, step) {
  const fail = (what, got, expected) =>
    new PhaseError('render', `rendered ${what} ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`, step)
  const original = await modeOf(page)
  await setMode(page, 'browse')
  const caption = await readText(page, '[data-presentation-caption]')
  if (caption !== want.caption) throw fail('browse caption', caption, want.caption)
  await setMode(page, 'present')
  const title = await readText(page, '[data-presentation-title]')
  if (title !== want.title) throw fail('present title', title, want.title)
  await setMode(page, original ?? 'browse')
}

async function renderPhase(cwd, config, log) {
  const { chromium } = await import('playwright')
  const preview = await startPreview({ cwd, phase: 'render', log })
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    const collector = createErrorCollector()
    page.on('console', (message) => collector.onConsole(message.type(), message.text()))
    page.on('pageerror', (error) => collector.onPageError(error.message))
    const assertClean = () => {
      const bad = collector.first()
      if (bad) throw new PhaseError('render', bad.message, bad.step)
    }

    const target = preview.url(`/${config.slug}`)
    log(`[verify] open ${target}`)
    await page.goto(target)
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: 10_000 })
    } catch {
      assertClean()
      throw new PhaseError('render', `no presentation rendered at ${target}`, 0)
    }
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new PhaseError('render', 'data-step-count is missing or invalid', 0)
    if (config.outline && count !== config.outline.length) {
      throw new PhaseError('render', `data-step-count is ${count}, expected ${config.outline.length}`, 0)
    }

    for (let i = 0; i < count; i++) {
      collector.setStep(i)
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (want) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(want),
            i,
            { timeout: TRANSITION_TIMEOUT_MS },
          )
        } catch {
          assertClean()
          const seen = await root.getAttribute('data-step-index')
          throw new PhaseError('render', `transition did not advance: data-step-index is ${seen}, expected ${i}`, i)
        }
      }
      await sleep(SETTLE_MS)
      assertClean()
      const want = config.outline?.[i]
      if (want) {
        await observeNarration(page, want, i)
        await sleep(300)
        assertClean()
      }
      log(`[verify] step ${i + 1}/${count} rendered (data-step-index=${i})`)
    }
  } catch (error) {
    if (error instanceof PhaseError) throw error
    throw new PhaseError('render', error.message)
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

/**
 * With `slug`, verifies that one registered presentation (build, registration,
 * every step renders) instead of the reference one, without outline matching.
 */
export async function runVerify({ cwd = process.cwd(), log = console.log, slug } = {}) {
  const configFile = path.join(cwd, 'scripts/verify.config.mjs')
  let config = await access(configFile).then(
    async () => (await import(pathToFileURL(configFile).href)).default,
    () => ({ slug: undefined, outline: null }),
  )
  if (slug && slug !== config.slug) config = { slug, outline: null }
  if (!config.slug) {
    throw new PhaseError('sample', 'no reference presentation is configured: run `npm run verify -- <slug>` for a registered presentation')
  }
  log('[verify] phase build: npm run build')
  await runNpm(['run', 'build'], { cwd, phase: 'build' })
  log('[verify] phase build: ok')
  await samplePhase(cwd, config, log)
  await renderPhase(cwd, config, log)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const onSignal = () => process.exit(130)
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  try {
    await runVerify({ slug: process.argv[2] })
    console.log('VERIFY PASSED (build, sample, render)')
  } catch (error) {
    const phase = error instanceof PhaseError ? error.phase : 'unknown'
    const step = error instanceof PhaseError && error.step !== undefined ? ` step=${error.step}` : ''
    console.error(`VERIFY FAILED phase=${phase}${step}: ${error.message}`)
    process.exitCode = 1
  }
}
