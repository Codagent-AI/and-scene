#!/usr/bin/env node
// Captures one settled screenshot per step from a production preview and prints
// advisory visual warnings. Warnings never change the exit code.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startPreview } from './preview.mjs'
import {
  captureSteps,
  DEFAULT_VIEWPORT,
  parseArgs,
  screenshotDir,
  screenshotName,
  stepWarnings,
} from './inspect-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STEP_TIMEOUT_MS = 5000

function build() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`npm run build failed\n${output.trim()}`))))
  })
}

/** Runs in the page: measures text, chrome, active-state styles, and the attribution link. */
function measure() {
  const root = document.querySelector('[data-presentation-root]')
  const visible = (element) => {
    const style = getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
  }
  const label = (element) => {
    const hook = [...element.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const id = element.getAttribute('data-presentation-entity')
    const hookText = id ? `[data-presentation-entity="${id}"]` : hook ? `[${hook.name}]` : ''
    return `${element.tagName.toLowerCase()}${hookText}`
  }
  const items = []
  const owners = new Map()
  const add = (element, rect, text) => {
    if (!owners.has(element)) owners.set(element, owners.size)
    items.push({
      key: items.length,
      owner: owners.get(element),
      label: label(element),
      text: text?.trim().slice(0, 40),
      visible: visible(element),
      allowOverlap: element.closest('[data-presentation-allow-overlap]') !== null,
      rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    })
  }
  // Every text run is its own item, so a parent's text and a positioned child's text are compared.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const owner = node.parentElement
    if (!owner || !node.textContent.trim() || owner.tagName === 'SCRIPT' || owner.tagName === 'STYLE') continue
    const range = document.createRange()
    range.selectNodeContents(node)
    add(owner, range.getBoundingClientRect(), node.textContent)
  }
  for (const dot of root.querySelectorAll('[data-presentation-progress-dot]')) {
    add(dot, dot.getBoundingClientRect(), '')
  }

  const style = (element) => {
    const s = getComputedStyle(element)
    return {
      color: s.color,
      backgroundColor: s.backgroundColor,
      fontWeight: s.fontWeight,
      opacity: s.opacity,
      borderColor: s.borderTopColor,
      boxShadow: s.boxShadow,
    }
  }
  const pair = (selector) => {
    const active = root.querySelector(`${selector}[data-presentation-active]`)
    const inactive = root.querySelector(`${selector}:not([data-presentation-active])`)
    return active && inactive ? { active: style(active), inactive: style(inactive) } : null
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const linkStyle = link && getComputedStyle(link)
  return {
    items,
    progress: pair('[data-presentation-progress-dot]'),
    toc: pair('[data-presentation-toc-entry]'),
    attribution: link
      ? { fontSize: parseFloat(linkStyle.fontSize), color: linkStyle.color, fontFamily: linkStyle.fontFamily }
      : null,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const viewport = options.viewport ?? DEFAULT_VIEWPORT
  const outDir = path.join(root, screenshotDir(options.slug, options.viewport))
  if (options.build) await build()
  mkdirSync(outDir, { recursive: true })

  const preview = await startPreview(root)
  let browser
  let warningCount = 0
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport })
    await page.goto(`${preview.origin}/${options.slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`${options.slug} reported no steps (data-step-count is ${count})`)
    await captureSteps({
      count,
      settleMs: options.settleMs,
      wait: (ms) => page.waitForTimeout(ms),
      goTo: async (index) => {
        if (index === 0) return
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (want) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(want),
          index,
          { timeout: STEP_TIMEOUT_MS },
        )
      },
      capture: async (index) => {
        const file = path.join(outDir, screenshotName(index))
        await page.screenshot({ path: file })
        console.log(`captured step ${index + 1}/${count}: ${path.relative(root, file)}`)
        for (const warning of stepWarnings(index + 1, await page.evaluate(measure))) {
          warningCount += 1
          console.log(warning)
        }
      },
    })
  } finally {
    await browser?.close()
    await preview.stop()
  }
  console.log(`inspect: ${warningCount} advisory warning(s); screenshots in ${path.relative(root, outDir)}`)
}

main().catch((error) => {
  console.error(`error: ${error.message}`)
  process.exit(1)
})
