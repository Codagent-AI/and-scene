import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { build, withPreview, walk } from './browser.mjs'
try {
  await build()
  const spec = await readFile(new URL('../openspec/changes/create-and-scene/specs/presentation-verification/spec.md', import.meta.url), 'utf8')
  const expected = spec.split('\n').filter(line => /^\| [1-9] \|/.test(line)).map(line => {
    const cells = line.split('|').map(cell => cell.trim())
    return { title: cells[3].replace(/^"|"$/g, ''), caption: cells[4] }
  })
  assert.equal(expected.length, 9, 'reference outline: expected nine normative steps')
  await withPreview(async (browser, url) => {
    const page = await browser.newPage()
    await page.goto(url)
    assert.equal(await page.locator('a[href="/how-to-make-a-presentation"]').count(), 1, 'reference sample must be registered')
    await walk(page, url, 'how-to-make-a-presentation', async (page, index, count) => {
      assert.equal(count, 9, 'reference sample step count')
      assert.equal(await page.locator('[data-presentation-step-title]').textContent(), expected[index].title, 'reference title')
      assert.equal(await page.locator('[data-presentation-caption]').textContent(), expected[index].caption, 'reference caption')
      console.log(`PASS reference step ${index}`)
    })
  })
  console.log('PASS build, registered reference outline, and all rendered steps')
} catch (error) {
  console.error(`FAIL verification: ${error.message}`)
  process.exitCode = 1
}
