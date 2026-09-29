import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import test from 'node:test'
import { chromium } from 'playwright'
import { isolatedProject } from './helpers/isolated-project.mjs'

const port = 4321
const origin = `http://127.0.0.1:${port}`
const route = `${origin}/how-to-make-a-presentation`
const viewports = [{ name: 'wide', width: 1440, height: 1000 }, { name: 'narrow', width: 390, height: 844 }]
const entity = (name) => `[data-entity-id="how-to:${name}"]`

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(origin)).ok) return } catch { /* preview is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('vite preview did not become ready')
}

async function goToStep(page, step) {
  for (;;) {
    const current = Number(await page.locator('[data-step-index]').getAttribute('data-step-index')) + 1
    if (current >= step) return
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, current)
  }
}

// Bounding box of the rendered text of an element, ignoring the element's own padding and empty space.
const textBox = (page, selector) => page.evaluate((target) => {
  const range = document.createRange()
  range.selectNodeContents(document.querySelector(target))
  const { left, right, top, bottom } = range.getBoundingClientRect()
  return { left, right, top, bottom }
}, selector)
// Waits until the scene's entities stop moving so geometry is measured after layout animations settle.
const settle = (page) => page.waitForFunction(() => {
  const snapshot = [...document.querySelectorAll('.how-scene [data-entity-id]')].map((element) => { const { left, top } = element.getBoundingClientRect(); return `${left.toFixed(1)},${top.toFixed(1)}` }).join('|')
  const stable = window.__sceneSnapshot === snapshot
  window.__sceneSnapshot = snapshot
  return stable
}, undefined, { polling: 250 })
const box = (page, selector) => page.locator(selector).evaluate((element) => { const { left, right, top, bottom } = element.getBoundingClientRect(); return { left, right, top, bottom } })
const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

test('reference sample keeps its tray readable, links consecutive cards, and animates newcomers in', { timeout: 240_000 }, async () => {
  const { temporary, project } = await isolatedProject('and-scene-sample-')
  let preview, browser
  try {
    const build = spawnSync('npm', ['run', 'build'], { cwd: project, encoding: 'utf8', timeout: 120_000 })
    assert.equal(build.status, 0, build.stdout + build.stderr)
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: project, stdio: 'ignore' })
    await waitForPreview()
    browser = await chromium.launch({ headless: true })

    for (const { name, ...viewport } of viewports) {
      const page = await browser.newPage({ viewport })
      try {
        await page.goto(route, { waitUntil: 'networkidle' })

        // Newcomers fade in rather than popping in: the first card starts transparent and settles fully opaque.
        await goToStep(page, 2)
        await page.keyboard.press('ArrowRight')
        await page.waitForSelector(entity('step-1'), { state: 'attached' })
        assert.ok(Number(await page.locator(entity('step-1')).evaluate((element) => getComputedStyle(element).opacity)) < 1, `${name}: first card should animate in`)
        await page.waitForFunction((selector) => getComputedStyle(document.querySelector(selector)).opacity === '1', entity('step-1'))

        for (const step of [4, 9]) {
          await goToStep(page, step)
          await page.waitForFunction((selector) => getComputedStyle(document.querySelector(selector)).opacity === '1', entity('step-3'))
          await settle(page)
          const label = await textBox(page, `${entity('tray')} > span`)
          const cards = [await box(page, entity('step-1')), await box(page, entity('step-2')), await box(page, entity('step-3'))]
          assert.ok(label.right > label.left && label.bottom > label.top, `${name} step ${step}: tray label should be rendered`)
          cards.forEach((card, index) => assert.ok(!intersects(label, card), `${name} step ${step}: tray label is covered by card ${index + 1}`))

          // Each link sits in the gap between two consecutive cards, level with them.
          for (const [index, link] of [1, 2].entries()) {
            const linkBox = await box(page, entity(`link-${link}`))
            assert.ok(linkBox.left >= cards[index].right - 1 && linkBox.right <= cards[index + 1].left + 1, `${name} step ${step}: link ${link} should sit between cards ${link} and ${link + 1}`)
            assert.ok(linkBox.top > cards[index].top && linkBox.bottom < cards[index].bottom, `${name} step ${step}: link ${link} should be level with its cards`)
          }
        }
      } finally { await page.close() }
    }
  } finally {
    await browser?.close()
    preview?.kill()
    await rm(temporary, { recursive: true, force: true })
  }
})
