#!/usr/bin/env node
// Whole-app verification: build -> reference sample present -> render every step in Chromium.
// Usage: node scripts/verify.mjs [--root <dir>] [--port <n>]   (config: <root>/verify.config.json)
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { checkRenderedStep, checkSampleRegistration } from './lib/outline.mjs'
import { HOST, freePort, startPreview, trackErrors, waitForStep } from './lib/preview.mjs'

const argv = process.argv.slice(2)
const rootArg = argv.indexOf('--root')
const root = path.resolve(rootArg >= 0 ? argv[rootArg + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), '..'))

const portArg = argv.indexOf('--port')

class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => reject(new PhaseError('build', `could not run npm: ${e.message}`)))
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new PhaseError('build', `npm run build exited ${code}\n${output.trim().split('\n').slice(-25).join('\n')}`))
    })
  })
}

async function renderEveryStep(config, settleMs) {
  const port = portArg >= 0 ? Number(argv[portArg + 1]) : await freePort()
  let preview
  let browser
  try {
    preview = await startPreview(root, port).catch((e) => {
      throw new PhaseError('render', `preview failed to start: ${e.message}`)
    })
    browser = await chromium.launch().catch((e) => {
      throw new PhaseError('render', `browser failed to launch: ${e.message}`)
    })
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = trackErrors(page)
    const route = `${preview.url}/${config.slug}`
    await page.goto(route)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    } catch {
      throw new PhaseError('render', `step 0: ${route} did not render a presentation${errors.length ? `\n${errors.join('\n')}` : ''}`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (count !== config.steps.length) {
      throw new PhaseError('outline', `sample has ${count} steps, expected ${config.steps.length}`)
    }
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
      }
      if (!(await waitForStep(page, i))) {
        throw new PhaseError('render', `step ${i}: the step index did not advance to ${i}${errors.length ? `\n${errors.join('\n')}` : ''}`)
      }
      await page.waitForTimeout(settleMs)
      const rendered = await page.evaluate(() => ({
        era: document.querySelector('[data-presentation-marker]')?.getAttribute('data-presentation-era'),
        title: document.querySelector('[data-presentation-title]')?.textContent,
        caption: document.querySelector('[data-presentation-caption]')?.textContent,
      }))
      const problems = checkRenderedStep(config.steps[i], rendered)
      if (problems.length) throw new PhaseError('outline', `step ${i}: ${problems.join('; ')}`)
      if (errors.length) throw new PhaseError('render', `step ${i}: ${errors.join('; ')}`)
      console.log(`verify: [render] ${config.slug}: step ${i} ok (${rendered.title})`)
    }
    return { count, url: route }
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

async function main() {
  const configPath = path.join(root, 'verify.config.json')
  if (!existsSync(configPath)) throw new PhaseError('config', `${configPath} is missing`)
  const { presentations = [], settleMs = 700 } = JSON.parse(readFileSync(configPath, 'utf8'))
  if (!presentations.length) throw new PhaseError('config', 'verify.config.json lists no presentations')
  console.log(`verify: root ${root}`)

  console.log('verify: [build] npm run build')
  await runBuild()

  const rendered = []
  for (const config of presentations) {
    console.log(`verify: [sample] ${config.slug}`)
    const problems = checkSampleRegistration(root, config)
    if (problems.length) throw new PhaseError('sample', problems.join('; '))

    console.log(`verify: [render] ${config.slug}: stepping through ${config.steps.length} steps on http://${HOST}`)
    const { count, url } = await renderEveryStep(config, settleMs)
    rendered.push(`${count} steps at ${url}`)
  }
  console.log(`PASS verify: build, sample, render (${rendered.join('; ')}; no console or page errors)`)
}

main().catch((error) => {
  const phase = error instanceof PhaseError ? error.phase : 'internal'
  console.error(`FAIL verify [${phase}]: ${error.message}`)
  process.exit(1)
})
