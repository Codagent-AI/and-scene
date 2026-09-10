import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import { expect, test } from 'vitest'
import { Footer } from '../src/presentation-kit/chrome/Footer'
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
