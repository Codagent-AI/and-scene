#!/usr/bin/env node
// Build the whole app, then render every registered presentation step by step in
// Chromium against a production preview on 127.0.0.1. Exit 0 = pass, 1 = fail.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { Fail, readRegistry, runBuild, startPreview } from './lib/preview.mjs'

const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 150

function parseArgs(argv) {
  const options = { skipBuild: false, root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--skip-build') options.skipBuild = true
    else if (argv[i] === '--root') options.root = path.resolve(argv[++i])
  }
  return options
}

function readOutline(root) {
  const file = path.join(root, 'scripts/reference-outline.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

async function verifyPresentation(browser, baseUrl, slug, outline) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught page error: ${error.message}`))
  const fail = (index, message) => {
    throw new Fail('render', `/${slug} step ${index + 1}: ${message}`)
  }
  const failOnErrors = (index) => {
    if (errors.length > 0) fail(index, errors.join(' | '))
  }
  try {
    await page.goto(`${baseUrl}/${slug}`)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    } catch {
      failOnErrors(0)
      throw new Fail('render', `/${slug} did not render a presentation (no data-step-count hook)`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (outline && count !== outline.steps.length) {
      throw new Fail('sample', `/${slug} has ${count} steps, expected ${outline.steps.length}`)
    }
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) === 'present') {
      await page.keyboard.press('p')
    }
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (expected) =>
              document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(expected),
            i,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          fail(i, `transition did not advance data-step-index to ${i}`)
        }
      }
      await page.waitForTimeout(SETTLE_MS)
      failOnErrors(i)
      if (outline) {
        const expected = outline.steps[i]
        const actual = {
          era: await page.textContent('[data-presentation-era]'),
          title: await page.textContent('[data-presentation-title]'),
          caption: await page.textContent('[data-presentation-caption]'),
        }
        for (const field of ['era', 'title', 'caption']) {
          if (actual[field] !== expected[field]) {
            throw new Fail(
              'sample',
              `/${slug} step ${i + 1} ${field} is ${JSON.stringify(actual[field])}, expected ${JSON.stringify(expected[field])}`,
            )
          }
        }
      }
    }
    return count
  } finally {
    await context.close()
  }
}

async function main() {
  const { skipBuild, root } = parseArgs(process.argv.slice(2))
  if (!skipBuild) {
    console.log('verify: building (npm run build)')
    const build = await runBuild(root)
    if (build.code !== 0) throw new Fail('build', `npm run build exited ${build.code}\n${build.output.trim()}`)
  }

  const registry = readRegistry(root)
  const outline = readOutline(root)
  if (registry.length === 0) throw new Fail('registry', 'no presentations are registered in src/presentations/index.ts')
  if (outline && !registry.some((entry) => entry.slug === outline.slug)) {
    throw new Fail('sample', `reference sample "${outline.slug}" is not registered`)
  }

  const preview = await startPreview(root)
  console.log(`verify: preview at ${preview.url}`)
  let browser
  try {
    browser = await chromium.launch()
    let total = 0
    for (const { slug } of registry) {
      const steps = await verifyPresentation(browser, preview.url, slug, outline?.slug === slug ? outline : null)
      console.log(`verify: /${slug} rendered ${steps} steps without errors`)
      total += steps
    }
    console.log(`PASS verify: build ok, ${registry.length} presentation(s), ${total} step(s) rendered`)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

main().catch((error) => {
  if (error instanceof Fail) console.error(`FAIL verify [${error.phase}]: ${error.message}`)
  else console.error(`FAIL verify [internal]: ${error?.stack ?? error}`)
  process.exit(1)
})
