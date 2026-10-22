#!/usr/bin/env node
// Deterministic build + browser-render verification. Exits non-zero on any failure
// and names the failed phase (and, for browser faults, the offending step).
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { buildApp } from './lib/build.mjs'
import { loadPlaywright, readNarration, readStepCount, readStepIndex, waitForStepIndex } from './lib/browse.mjs'
import { SAMPLE_OUTLINE, SAMPLE_SLUG, checkSampleRegistration, compareOutline, registeredSlugs } from './lib/outline.mjs'
import { startPreview } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')
const { values: options } = parseArgs({
  options: {
    'no-reference-sample': { type: 'boolean', default: false },
    'settle-ms': { type: 'string', default: '400' },
  },
})
const settleMs = Number(options['settle-ms'])

class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

function build() {
  const { status, output } = buildApp(root)
  if (status !== 0) throw new PhaseError('build', `npm run build failed (exit ${status})\n${output}`)
}

function readRegistry() {
  const indexPath = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(indexPath)) throw new PhaseError('sample', 'src/presentations/index.ts is missing')
  return fs.readFileSync(indexPath, 'utf8')
}

function checkSample(indexSource) {
  const folderExists = fs.existsSync(path.join(root, 'src', 'presentations', SAMPLE_SLUG))
  const problems = checkSampleRegistration(indexSource, { folderExists })
  if (problems.length > 0) throw new PhaseError('sample', problems.join('\n'))
}

/** Steps through one presentation; returns the narration observed at every step. */
async function renderPresentation(browser, preview, slug) {
  const page = await browser.newPage()
  const url = preview.url(`/${slug}`)
  let current = 0
  let fault = null
  const record = (kind, text) => {
    fault ??= `${kind} at step ${current} of /${slug} (${url}): ${text}`
  }
  // Listeners attach before navigation so load-time errors are attributed to step 0.
  page.on('console', (message) => {
    if (message.type() === 'error') record('console error', message.text())
  })
  page.on('pageerror', (error) => record('uncaught page error', error.message))
  const check = () => {
    if (fault) throw new PhaseError('render', fault)
  }
  try {
    console.log(`render: ${url}`)
    await page.goto(url)
    await page.waitForSelector('[data-step-count]', { timeout: 10000 }).catch(() => {
      check()
      throw new PhaseError('render', `no [data-step-count] hook found at step 0 of /${slug} (${url})`)
    })
    const count = await readStepCount(page)
    if (!(count >= 1)) throw new PhaseError('render', `invalid step count ${count} at /${slug}`)
    const narration = []
    for (let index = 0; index < count; index += 1) {
      current = index
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await waitForStepIndex(page, index, 4000).catch(async () => {
          check()
          const observed = await readStepIndex(page)
          throw new PhaseError(
            'render',
            `transition to step ${index} of /${slug} failed: expected index ${index}, observed ${observed}`,
          )
        })
      }
      await page.waitForTimeout(settleMs)
      check()
      narration.push(await readNarration(page))
    }
    console.log(`render: /${slug} stepped through ${count} steps`)
    return narration
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('phase build: npm run build')
  build()

  const indexSource = readRegistry()
  const requireSample = !options['no-reference-sample']
  if (requireSample) {
    console.log('phase sample: checking registration')
    checkSample(indexSource)
  }
  const slugs = registeredSlugs(indexSource)
  if (slugs.length === 0) throw new PhaseError('render', 'no presentations are registered')

  console.log('phase render: vite preview + Chromium')
  const { chromium } = await loadPlaywright(root)
  let preview
  let browser
  try {
    preview = await startPreview(root)
    console.log(`preview: ${preview.url('/')}`)
    browser = await chromium.launch()
    for (const slug of slugs) {
      const narration = await renderPresentation(browser, preview, slug)
      if (requireSample && slug === SAMPLE_SLUG) {
        const problems = compareOutline(narration)
        if (problems.length > 0) throw new PhaseError('outline', problems.join('\n'))
        console.log(`outline: ${SAMPLE_OUTLINE.length} steps match, in order`)
      }
    }
  } finally {
    await browser?.close()
    preview?.stop()
  }
  console.log(`PASS verify: build, ${requireSample ? 'sample outline, ' : ''}render of ${slugs.length} presentation(s)`)
}

main().catch((error) => {
  const phase = error instanceof PhaseError ? error.phase : 'render'
  console.error(`FAIL [${phase}] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
