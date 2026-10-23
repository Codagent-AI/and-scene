// Deterministic verification: build, sample check, and a real-browser render of every step.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  VerifyError, collectBrowserErrors, formatFailure, validateRegistry, validateSampleStep, validateStepCount, waitForIndex,
} from './lib/checks.mjs'
import { SAMPLE_OUTLINE, SAMPLE_SLUG, SAMPLE_TITLE } from './lib/outline.mjs'
import { withPreview } from './lib/preview.mjs'
import { loaderExists, readRegistry } from './lib/registry.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function readConfig() {
  const file = join(ROOT, 'verify.config.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

function build() {
  return new Promise((resolveBuild, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => reject(new VerifyError('build', e.message)))
    child.on('exit', (code) => {
      if (code === 0) return resolveBuild()
      reject(new VerifyError('build', `npm run build exited with code ${code}\n${output.split('\n').slice(-25).join('\n')}`))
    })
  })
}

const readText = (page, selector) => page.locator(selector).first().textContent()

async function renderSteps(page, baseUrl, slug, outline) {
  let current = 0
  const visited = []
  const collector = collectBrowserErrors(page, () => current)
  const url = `${baseUrl}/${slug}`
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('[data-step-count]', { timeout: 10000 }).catch(() => {
    collector.check()
    throw new VerifyError('render', `/${slug} did not render the step-count hook`)
  })
  const read = async () => {
    const value = await page.evaluate(() => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') ?? null)
    return value === null ? null : Number(value)
  }
  const options = (from) => ({ from, check: () => collector.check() })
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count', { timeout: 5000 }))
  if (outline) validateStepCount(count, outline)
  if (!(count > 0)) throw new VerifyError('render', `/${slug} reports ${count} steps`)
  for (let i = 0; i < count; i++) {
    current = i
    await waitForIndex(read, i, options(i === 0 ? 0 : i - 1))
    visited.push(i)
    await sleep(150)
    collector.check()
    if (outline) {
      const rendered = { title: await readText(page, '[data-presentation-title]'), caption: await readText(page, '[data-presentation-caption]') }
      await page.keyboard.press('p')
      rendered.presentTitle = await readText(page, '[data-presentation-title]')
      await page.keyboard.press('p')
      validateSampleStep(i, rendered, outline)
    }
    if (i < count - 1) {
      current = i + 1
      await page.keyboard.press('ArrowRight')
      await waitForIndex(read, i + 1, options(i))
    }
  }
  await sleep(150)
  collector.check()
  return { count, visited, url }
}

async function main() {
  const config = readConfig()
  const required = config.requiredSample ?? null
  await build()
  console.log('ok build')

  const registry = readRegistry(ROOT)
  if (required) validateRegistry(registry, { slug: required, title: SAMPLE_TITLE }, (l) => loaderExists(ROOT, l))
  const targets = required ? [required] : registry.map((e) => e.slug)
  if (targets.length === 0) throw new VerifyError('sample', 'no presentations are registered')
  console.log(`ok sample (${targets.join(', ')})`)

  let total = 0
  await withPreview(ROOT, async (baseUrl) => {
    console.log(`ok preview ${baseUrl}`)
    const browser = await chromium.launch()
    try {
      for (const slug of targets) {
        const page = await browser.newPage()
        const { count, visited, url } = await renderSteps(page, baseUrl, slug, slug === SAMPLE_SLUG ? SAMPLE_OUTLINE : null)
        total += count
        console.log(`ok render ${url} steps ${visited.join(',')}`)
        await page.close()
      }
    } finally {
      await browser.close()
    }
  })
  console.log(`PASS verify: build, sample, render (${targets.length} presentation(s), ${total} steps)`)
}

main().catch((err) => {
  console.error(formatFailure(err))
  process.exit(1)
})
