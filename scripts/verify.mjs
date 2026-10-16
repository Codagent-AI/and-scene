// Deterministic gate: build the whole app, check the reference presentation is
// registered, then render it through every step in Chromium against a production preview.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { HOST, projectRoot, readIndex, run, startPreview, waitForIndex } from './lib.mjs'

const root = projectRoot

class Failure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

function loadReference() {
  const file = path.join(root, 'verify.config.json')
  if (!fs.existsSync(file)) throw new Failure('sample', 'verify.config.json is missing')
  return JSON.parse(fs.readFileSync(file, 'utf8')).reference
}

function checkRegistered(slug) {
  const index = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(index)) throw new Failure('sample', 'src/presentations/index.ts is missing')
  if (!fs.readFileSync(index, 'utf8').includes(`slug: '${slug}'`)) {
    throw new Failure('sample', `reference presentation "${slug}" is not registered in src/presentations/index.ts`)
  }
  if (!fs.existsSync(path.join(root, 'src', 'presentations', slug))) {
    throw new Failure('sample', `reference presentation folder src/presentations/${slug}/ is missing`)
  }
}

async function render(reference) {
  const preview = await startPreview(root).catch((e) => {
    throw new Failure('preview', e.message)
  })
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    let step = 0
    const errors = []
    const note = (kind, text) => errors.push(new Failure('render', `${kind}: ${text}`, step))
    page.on('console', (m) => m.type() === 'error' && note('console.error', m.text()))
    page.on('pageerror', (e) => note('pageerror', e.message))

    const url = `${preview.base}/${reference.slug}`
    if (!url.startsWith(`http://${HOST}:`)) throw new Failure('render', `unexpected URL ${url}`)
    await page.goto(url)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
    } catch {
      throw errors[0] ?? new Failure('render', `route ${url} did not render a presentation`, 0)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (count !== reference.steps.length) {
      throw new Failure('sample', `expected ${reference.steps.length} steps, found ${count}`)
    }
    if (!(await page.$('[data-presentation-caption]'))) await page.keyboard.press('p')

    for (step = 0; step < count; step++) {
      if (!(await waitForIndex(page, step))) {
        throw new Failure('transition', `step index did not advance to ${step} (at ${await readIndex(page)})`, step)
      }
      await page.waitForTimeout(300)
      const title = await page.textContent('[data-presentation-title]')
      const caption = await page.textContent('[data-presentation-caption]')
      const want = reference.steps[step]
      if (title !== want.title || caption !== want.caption) {
        throw new Failure('sample', `step ${step} title/caption differ from the reference (got "${title}")`, step)
      }
      if (errors.length) throw errors[0]
      if (step < count - 1) await page.keyboard.press('ArrowRight')
    }
    await page.waitForTimeout(500)
    if (errors.length) throw errors[0]
    return count
  } finally {
    await browser.close()
    preview.stop()
  }
}

async function main() {
  const build = await run('npm', ['run', 'build'], root)
  if (build.code !== 0) throw new Failure('build', `npm run build failed\n${build.output.slice(-2000)}`)
  console.log('[verify] build: ok')

  const reference = loadReference()
  checkRegistered(reference.slug)
  console.log(`[verify] sample: "${reference.slug}" is registered`)

  const steps = await render(reference)
  console.log(`[verify] render: ${steps} steps rendered without errors on ${HOST}`)
}

main().then(
  () => console.log('VERIFY PASSED'),
  (e) => {
    const where = e.step === undefined ? '' : ` step=${e.step}`
    console.error(`VERIFY FAILED phase=${e.phase ?? 'internal'}${where}: ${e.message}`)
    process.exit(1)
  },
)
