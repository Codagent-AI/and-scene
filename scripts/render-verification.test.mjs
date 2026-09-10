import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { expect, test } from 'vitest'
import { withPreview } from './preview-server.mjs'
import { verifyPresentation } from './render-verification.mjs'

const laterStepFaults = [
  ['console.error("late console fault")', /step 3:.*late console fault/],
  ['throw new Error("late runtime fault")', /step 3:.*late runtime fault/],
  ['document.querySelector("[data-presentation-scene]").remove()', /step 3: missing presentation state/],
  ['chrome.dataset.stepIndex = "1"', /transition failed at step 3/],
]

async function inspectFixture(fault, inspect) {
  const root = await mkdtemp(resolve(tmpdir(), 'and-scene-render-'))
  try {
    await mkdir(resolve(root, 'dist'))
    await writeFile(resolve(root, 'dist/index.html'), `
      <main data-presentation-chrome data-step-count="3" data-step-index="0">
        <h1 data-presentation-title>Fixture</h1>
        <div data-presentation-canvas><div data-presentation-scene>Scene</div></div>
      </main>
      <script>
        const chrome = document.querySelector('[data-presentation-chrome]')
        let index = 0
        window.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowRight') return
          chrome.dataset.stepIndex = String(++index)
          if (index === 2) { ${fault} }
        })
      </script>
    `)
    await withPreview(root, async (origin) => {
      const browser = await chromium.launch({ headless: true })
      try {
        await inspect(await browser.newPage(), `${origin}/fixture`)
      } finally {
        await browser.close()
      }
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('verifies every step of a healthy route', async () => {
  await inspectFixture('', async (page, url) => {
    const visited = []
    const count = await verifyPresentation(page, url, {
      validateStep: (_page, index) => { visited.push(index) },
    })
    expect(count).toBe(3)
    expect(visited).toEqual([0, 1, 2])
  })
})

test.each(laterStepFaults)('rejects a later-step fault: %s', async (fault, message) => {
  await inspectFixture(fault, async (page, url) => {
    await expect(verifyPresentation(page, url)).rejects.toThrow(message)
  })
}, 15_000)
