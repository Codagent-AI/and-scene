#!/usr/bin/env node
// Build the whole app, check the reference sample's outline, then render the
// registered presentations in Chromium against a production preview.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  loadActualOutline,
  loadConfig,
  loadReferenceOutline,
  loadRegistry,
} from './lib/config.mjs'
import { startPreview } from './lib/preview.mjs'
import { renderRoute } from './lib/render.mjs'
import { compareOutline, formatFailure, parseArgs, selectRoutes, VerifyError } from './lib/verify-core.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const log = (line) => console.log(line)

function build() {
  log('[build] npm run build')
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    process.stdout.write(`${result.stdout ?? ''}${result.stderr ?? ''}`)
    throw new VerifyError('build', `npm run build failed with exit code ${result.status}`)
  }
}

async function checkOutline(config, registry) {
  const reference = config.referenceSample
  if (reference === null) {
    log('[sample-outline] skipped: presentation.config.json declares no reference sample')
    return null
  }
  const expected = loadReferenceOutline(root, reference)
  const entry = registry.find((e) => e.slug === reference.slug)
  if (!entry) throw new VerifyError('sample-outline', `reference sample "${reference.slug}" is not registered`)
  const errors = compareOutline({ ...(await loadActualOutline(root, reference)), title: entry.title }, expected)
  if (errors.length > 0) throw new VerifyError('sample-outline', errors.join('; '))
  log(`[sample-outline] ${expected.steps.length} steps match the reference outline`)
  return expected
}

async function render({ config, registry, reference, args }) {
  const routes = selectRoutes({ registry, sampleSlug: config.referenceSample?.slug, only: args.slug })
  const preview = await startPreview(root)
  log(`[render] preview ${preview.url('/')}`)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    const errors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`uncaught page error: ${error.message}`))
    for (const route of routes) {
      log(`[render] /${route.slug} (${route.allSteps ? 'all steps' : 'first step'})`)
      await renderRoute({
        page,
        url: preview.url(`/${route.slug}`),
        allSteps: route.allSteps,
        reference: route.allSteps ? reference : null,
        errors,
        timeoutMs: args.timeoutMs,
        log,
      })
    }
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

try {
  const args = parseArgs(process.argv.slice(2), process.env)
  const config = loadConfig(root)
  build()
  const registry = await loadRegistry(root)
  const reference = await checkOutline(config, registry)
  await render({ config, registry, reference, args })
  log('VERIFY PASSED')
} catch (error) {
  console.error(formatFailure(error))
  process.exitCode = 1
}
