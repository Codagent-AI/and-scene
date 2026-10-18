#!/usr/bin/env node
// Build + browser-render verification. Exit 0 only when every phase passes.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { HOST, startPreview } from './preview.mjs'
import { checkSample, EXPECTED_OUTLINE } from './verify-outline.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STEP_TIMEOUT_MS = Number(process.env.VERIFY_STEP_TIMEOUT_MS ?? 5000)
const SETTLE_MS = Number(process.env.VERIFY_SETTLE_MS ?? 250)

class VerifyFailure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => resolve({ code: 1, output: String(error) }))
    child.on('close', (code) => resolve({ code, output }))
  })
}

async function buildPhase() {
  const { code, output } = await run('npm', ['run', 'build'])
  if (code !== 0) throw new VerifyFailure('build', `npm run build failed\n${output.trim()}`)
}

function readConfig() {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  return { sample: pkg.andScene?.sample }
}

async function loadRegistry() {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  if (!existsSync(file)) throw new VerifyFailure('sample', 'src/presentations/index.ts is missing')
  try {
    return (await import(pathToFileURL(file).href)).PRESENTATIONS
  } catch (error) {
    throw new VerifyFailure('sample', `presentation registry cannot be read: ${error.message}`)
  }
}

/** Confirms the registry (and, when a canonical sample is configured, its outline). */
async function samplePhase(sample) {
  const registry = await loadRegistry()
  if (!sample) {
    if (!Array.isArray(registry) || registry.length === 0) {
      throw new VerifyFailure('sample', 'no presentations are registered in src/presentations/index.ts')
    }
    return registry.map((entry) => entry.slug)
  }
  let outline
  const outlineFile = path.join(root, 'src', 'presentations', sample, 'outline.ts')
  if (existsSync(outlineFile)) {
    try {
      outline = (await import(pathToFileURL(outlineFile).href)).OUTLINE
    } catch (error) {
      throw new VerifyFailure('sample', `sample outline cannot be read: ${error.message}`)
    }
  }
  const problems = checkSample({ registry, outline, slug: sample })
  if (problems.length) throw new VerifyFailure('sample', problems.join('\n'))
  return [sample]
}

async function renderPresentation(browser, origin, slug, expected) {
  const page = await browser.newPage()
  const failures = []
  let current = 0
  const fail = (message) => failures.push({ step: current, message })
  page.on('console', (message) => {
    if (message.type() === 'error') fail(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => fail(`uncaught error: ${error.message}`))
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) fail(`request failed: ${request.url()}`)
  })
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      fail(`HTTP ${response.status()}: ${response.url()}`)
    }
  })

  try {
    await page.goto(`${origin}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      throw new VerifyFailure('render', `${slug}: the presentation did not render a step`, 0)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (expected && count !== expected.length) {
      throw new VerifyFailure('render', `${slug}: expected ${expected.length} steps, rendered ${count}`, 0)
    }
    for (let index = 0; index < count; index += 1) {
      current = index
      if (index > 0) await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (want) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(want),
          index,
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        throw new VerifyFailure('render', `${slug}: transition did not advance to step index ${index}`, index)
      }
      if (expected) {
        const title = await page.textContent('[data-presentation-title]')
        const caption = await page.textContent('[data-presentation-caption]')
        if (title !== expected[index].title) fail(`title is ${JSON.stringify(title)}, expected ${JSON.stringify(expected[index].title)}`)
        if (caption !== expected[index].caption) fail(`caption is ${JSON.stringify(caption)}, expected ${JSON.stringify(expected[index].caption)}`)
      }
      await page.waitForTimeout(SETTLE_MS)
    }
    if (failures.length) {
      const first = failures[0]
      const detail = failures.map((f) => `step index ${f.step}: ${f.message}`).join('\n')
      throw new VerifyFailure('render', `${slug}: ${failures.length} error(s)\n${detail}`, first.step)
    }
    return count
  } finally {
    await page.close()
  }
}

async function renderPhase(slugs, sample) {
  const preview = await startPreview(root)
  let browser
  try {
    browser = await chromium.launch()
    const counts = []
    for (const slug of slugs) {
      counts.push(`${slug}: ${await renderPresentation(browser, preview.origin, slug, sample ? EXPECTED_OUTLINE : null)} steps`)
    }
    console.log(`render: ${counts.join(', ')} (${preview.origin})`)
  } catch (error) {
    if (error instanceof VerifyFailure) throw error
    throw new VerifyFailure('render', `browser run failed: ${error.message}`)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

async function main() {
  const { sample } = readConfig()
  const phases = []
  try {
    console.log('verify: build')
    await buildPhase()
    phases.push('build')
    console.log('verify: sample')
    const slugs = await samplePhase(sample)
    phases.push('sample')
    console.log(`verify: render (${HOST})`)
    await renderPhase(slugs, sample)
    phases.push('render')
  } catch (error) {
    if (error instanceof VerifyFailure) {
      const where = error.step === undefined ? '' : ` (step index ${error.step})`
      console.error(`FAIL verify: ${error.phase} phase failed${where}\n${error.message}`)
    } else {
      console.error(`FAIL verify: unexpected error\n${error.stack ?? error}`)
    }
    process.exit(1)
  }
  console.log(`PASS verify: ${phases.join(', ')}`)
}

await main()
