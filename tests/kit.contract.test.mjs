import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const slug = 'how-to-make-a-presentation'

async function sources(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? sources(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))
  return nested.flat()
}

test('kit source ships no visual defaults or styling framework', async () => {
  const files = await sources(path.join(repo, 'src/presentation-kit'))
  assert.ok(files.length > 0)
  assert.equal(files.some(file => file.endsWith('.css')), false)
  const visual = /(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|box-shadow|boxShadow|fontFamily|font-family|borderRadius|border-radius|background|tailwind)/i
  for (const file of files) assert.doesNotMatch(await readFile(file, 'utf8'), visual, path.relative(repo, file))
  const pkg = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'))
  assert.equal(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /tailwind/.test(name)), false)
})

test('kit runtime: hooks, attribution, active semantics, modes, and navigation boundaries', { timeout: 90_000 }, async () => {
  const server = await createServer({ root: repo, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, strictPort: false } })
  await server.listen()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

    await page.goto(`${base}/`)
    await page.waitForSelector('[data-presentation-landing]')
    assert.equal(await page.locator(`[data-presentation-link][href="/${slug}"]`).count(), 1)

    await page.goto(`${base}/${slug}`)
    const root = page.locator('[data-presentation]')
    await root.waitFor()
    const count = Number(await root.getAttribute('data-step-count'))
    assert.ok(count > 1)
    assert.equal(await root.getAttribute('data-step-index'), '0')

    const attribution = page.locator('[data-presentation-attribution]')
    assert.equal(await attribution.count(), 1)
    assert.equal(await attribution.textContent(), 'made by and-scene')
    assert.match(await attribution.getAttribute('href'), /^https:\/\/github\.com\//)
    assert.equal((await page.locator('[data-presentation-brand]').textContent()).trim(), '')
    const box = await attribution.boundingBox()
    assert.ok(box.x > 640 && box.y > 400, 'attribution sits bottom-right')

    const active = async selector => page.locator(`${selector}[data-presentation-active="true"]`).count()
    assert.equal(await active('[data-presentation-progress-item]'), 1)
    assert.equal(await page.locator('[data-presentation-progress-item][aria-current="step"]').count(), 1)
    assert.equal(await page.locator('[data-presentation-toc-item][aria-current="location"]').count(), 1)
    assert.equal(await active('[data-presentation-toc-item]'), 1)

    // Boundaries: ArrowLeft at the first step and Next at the last step both clamp.
    await page.keyboard.press('ArrowLeft')
    assert.equal(await root.getAttribute('data-step-index'), '0')
    assert.equal(await page.getByRole('button', { name: 'Previous step' }).isDisabled(), true)
    for (let step = 1; step < count; step += 1) {
      await page.keyboard.press('ArrowRight')
      assert.equal(await root.getAttribute('data-step-index'), String(step))
      assert.equal(await page.locator('[data-presentation-progress-item][data-presentation-active="true"]').getAttribute('aria-label').then(label => label.startsWith(`Go to step ${step + 1}:`)), true)
    }
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('PageDown')
    assert.equal(await root.getAttribute('data-step-index'), String(count - 1))
    assert.equal(await page.getByRole('button', { name: 'Next step' }).isDisabled(), true)

    // Direct navigation preserves position across mode changes.
    await page.locator('[data-presentation-progress-item]').nth(2).click()
    assert.equal(await root.getAttribute('data-step-index'), '2')
    await page.evaluate(() => document.activeElement.blur())
    await page.keyboard.press('p')
    assert.equal(await root.getAttribute('data-mode'), 'present')
    assert.equal(await root.getAttribute('data-step-index'), '2')
    assert.equal(await page.locator('[data-presentation-toc], [data-presentation-progress]').count(), 0)
    assert.equal(await page.locator('[data-presentation-present-title]').count(), 1)
    await page.keyboard.press('p')
    assert.equal(await root.getAttribute('data-mode'), 'browse')
    assert.equal(await root.getAttribute('data-step-index'), '2')

    // Keys do not hijack focused controls.
    await page.getByRole('button', { name: 'Next step' }).focus()
    await page.keyboard.press('ArrowLeft')
    assert.equal(await root.getAttribute('data-step-index'), '2')

    assert.deepEqual(errors, [])
  } finally {
    await browser.close()
    await server.close()
  }
})
