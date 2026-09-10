import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import { expect, test } from 'vitest'
import { Footer } from '../src/presentation-kit/chrome/Footer'
import { HowToScene } from '../src/presentations/how-to-make-a-presentation/steps/HowToScene'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'

test('sample browse navigation remains visible at a narrow viewport', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const noop = () => {}
    const markup = renderToStaticMarkup(createElement('main', { className: 'presentation' },
      createElement('div', { className: 'how-to-scene' }),
      createElement(Footer, { steps: STEPS, index: 0, onGoTo: noop, onNext: noop, onPrev: noop })))
    await page.setContent(markup)
    await page.addStyleTag({ content: await readFile('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8') })
    expect(await page.getByRole('button', { name: 'Next step' }).isVisible()).toBe(true)
    expect(await page.getByRole('button', { name: 'Previous step' }).isVisible()).toBe(true)
  } finally {
    await browser.close()
  }
})

// AT-003 regression: guard the sample's text at its observed 314px mobile canvas.
// Real browser layout is required; a unit test cannot establish scaled legibility.
test('sample diagram labels remain legible and contained after narrow scaling', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const scale = 314 / 880
    const markup = renderToStaticMarkup(createElement('main', { className: 'presentation' },
      createElement('div', { style: { position: 'relative', width: 880, height: 380, transform: `scale(${scale})`, transformOrigin: 'top left' } },
        createElement(HowToScene, { payload: { beat: 9 }, step: STEPS[8], index: 8 }))))
    await page.setContent(markup)
    await page.addStyleTag({ content: await readFile('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8') })
    const primary = '.sample-node, .sample-prompt, .sample-step-card > span:last-child, .sample-kit'
    const labels = await page.locator('.how-to-scene').evaluate((scene, primarySelector) => {
      const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT)
      const result = []
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (!node.textContent?.trim()) continue
        const element = node.parentElement!
        const range = document.createRange()
        range.selectNode(node)
        const bounds = range.getBoundingClientRect()
        const container = element.getBoundingClientRect()
        const canvas = scene.getBoundingClientRect()
        result.push({
          text: node.textContent,
          primary: element.matches(primarySelector),
          fontSize: parseFloat(getComputedStyle(element).fontSize),
          contained: bounds.left >= container.left - 1 && bounds.right <= container.right + 1
            && bounds.left >= canvas.left && bounds.right <= canvas.right
            && bounds.top >= canvas.top && bounds.bottom <= canvas.bottom,
        })
      }
      return result
    }, primary)
    expect(labels.length).toBeGreaterThan(15)
    for (const label of labels) {
      expect(label.fontSize * scale, label.text).toBeGreaterThanOrEqual(label.primary ? 12 : 9)
      expect(label.contained, label.text).toBe(true)
    }
  } finally {
    await browser.close()
  }
})
