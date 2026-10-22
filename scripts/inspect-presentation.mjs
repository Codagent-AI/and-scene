#!/usr/bin/env node
// Captures one settled screenshot per step of a registered presentation from a
// production preview, and prints advisory visual-quality warnings. Warnings never
// change the exit code; only real errors (build, browser, filesystem) do.
import fs from 'node:fs'
import path from 'node:path'
import { buildApp } from './lib/build.mjs'
import { loadPlaywright, readStepCount, waitForStepIndex } from './lib/browse.mjs'
import { captureSteps, parseInspectArgs, screenshotPath } from './lib/inspect.mjs'
import { startPreview } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')

/** Runs in the page: gathers plain facts for the analysers in lib/diagnostics.mjs. */
function collectFacts() {
  const CHROME = [
    '[data-presentation-toc]',
    '[data-presentation-progress]',
    '[data-presentation-controls]',
    '[data-presentation-caption]',
    '[data-presentation-marker]',
    '[data-presentation-attribution]',
  ].join(',')
  const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
  const isVisible = (el) => {
    const style = getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01
  }
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') || a.name.startsWith('data-sample'))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const collected = [...document.querySelectorAll('body *')].filter((el) => el.matches(CHROME) || hasOwnText(el))
  const ids = new Map(collected.map((el, i) => [el, i]))
  const elements = collected.map((el) => {
    const box = el.getBoundingClientRect()
    return {
      id: ids.get(el),
      label: describe(el),
      rect: { x: box.x, y: box.y, w: box.width, h: box.height },
      visible: isVisible(el),
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
      ancestors: collected.filter((other) => other !== el && other.contains(el)).map((other) => ids.get(other)),
    }
  })
  const styleOf = (el) => {
    const s = getComputedStyle(el)
    return {
      backgroundColor: s.backgroundColor,
      color: s.color,
      borderColor: s.borderTopColor,
      opacity: s.opacity,
      fontWeight: s.fontWeight,
      outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
      boxShadow: s.boxShadow,
      transform: s.transform,
      width: s.width,
      height: s.height,
    }
  }
  const activeChrome = [
    ['progress indicator', '[data-presentation-progress-dot]'],
    ['table-of-contents entry', '[data-presentation-toc-entry]'],
  ]
    .map(([name, selector]) => {
      const all = [...document.querySelectorAll(selector)]
      const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
      const inactive = all.find((el) => el !== active)
      return active ? { name, active: styleOf(active), inactive: inactive ? styleOf(inactive) : null } : null
    })
    .filter(Boolean)
  const link = document.querySelector('[data-presentation-attribution]')
  const attribution = link
    ? {
        fontSizePx: Number.parseFloat(getComputedStyle(link).fontSize),
        color: getComputedStyle(link).color,
        textDecorationLine: getComputedStyle(link).textDecorationLine,
        fontFamily: getComputedStyle(link).fontFamily,
        parentFontFamily: getComputedStyle(link.parentElement).fontFamily,
      }
    : null
  return { elements, activeChrome, attribution }
}

async function main() {
  const options = parseInspectArgs(process.argv.slice(2))
  if (options.build) {
    const { status, output } = buildApp(root)
    if (status !== 0) throw new Error(`npm run build failed\n${output}`)
  }
  const outDir = path.resolve(root, options.out)
  fs.mkdirSync(path.join(outDir, options.slug), { recursive: true })
  const { chromium } = await loadPlaywright(root)
  let preview
  let browser
  try {
    preview = await startPreview(root)
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: options.viewport })
    const url = preview.url(`/${options.slug}`)
    await page.goto(url)
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    const count = await readStepCount(page)
    console.log(`inspect: ${url} (${count} steps, ${options.viewport.width}x${options.viewport.height}, settle ${options.settleMs}ms)`)
    const written = await captureSteps({
      count,
      settleMs: options.settleMs,
      advance: () => page.keyboard.press('ArrowRight'),
      waitForStep: (index) => waitForStepIndex(page, index),
      sleep: (ms) => page.waitForTimeout(ms),
      screenshot: async (index) => {
        const file = screenshotPath(outDir, options.slug, index)
        await page.screenshot({ path: file })
        return file
      },
      collect: () => page.evaluate(collectFacts),
      warn: (line) => console.log(line),
    })
    console.log(`inspect: wrote ${written.length} screenshots under ${path.join(outDir, options.slug)}`)
  } finally {
    await browser?.close()
    preview?.stop()
  }
}

main().catch((error) => {
  console.error(`inspect failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
