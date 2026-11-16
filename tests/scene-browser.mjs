// Automated assertions used by E2E-001 against its already-built disposable app.
import assert from 'node:assert/strict'
import { withPreview, settle, stepTo } from '../scripts/browser.mjs'
await withPreview(async (page, base) => {
  await page.goto(`${base}/transition-contract`)
  await page.locator('[data-step-index="0"]').waitFor()
  await settle(page)
  const continuing = await page.locator('[data-test-scene="a"]').elementHandle()
  const start = await continuing.boundingBox()
  const canvas = await page.locator('[data-presentation-canvas]').boundingBox()
  await stepTo(page, 1)
  assert.equal(await continuing.evaluate(el => el === document.querySelector('[data-test-scene="a"]')), true, 'grouped scene DOM must persist')
  await page.waitForFunction(({ start, end }) => {
    const x = document.querySelector('[data-test-scene="a"]').getBoundingClientRect().left
    return x > start + 1 && x < end - 1
  }, { start: start.x, end: canvas.x + 300 })
  await settle(page)
  assert.ok(Math.abs((await continuing.boundingBox()).x - (canvas.x + 300)) < 1)
  await stepTo(page, 2)
  await page.waitForFunction(() => {
    const hosts = [...document.querySelectorAll('[data-presentation-scene]')]
    return hosts.length === 2 && hosts.every(host => { const opacity = Number(getComputedStyle(host).opacity); return opacity > 0 && opacity < 1 })
  })
  assert.equal(await continuing.evaluate(el => el.isConnected), true, 'outgoing Scene must survive during its actual exit')
  await page.locator('[data-test-scene="a"]').waitFor({ state: 'detached' })
  await settle(page)
  assert.equal(await page.locator('[data-test-scene="b"]').count(), 1)
  console.log('ASSERT I-3/I-4: real layout interpolation, grouped DOM persistence, and same-group changed-Scene enter/exit cross-fade')

  await page.goto(`${base}/how-to-make-a-presentation`)
  await page.locator('[data-step-index="0"]').waitFor()
  let ghost
  for (let index = 0; index < 9; index++) {
    await stepTo(page, index); await settle(page)
    if (index < 4) continue
    ghost ??= await page.locator('[data-sample-entity="ghost"]').elementHandle()
    assert.equal(await ghost.evaluate(el => el === document.querySelector('[data-sample-entity="ghost"]')), true)
    assert.equal(await ghost.textContent(), '… next beat')
    assert.equal(await ghost.evaluate(el => {
      const rect = el.querySelector('span').getBoundingClientRect()
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('[data-sample-entity="ghost"]') === el
    }), true, `ghost label must remain visible and unoccluded at step ${index}`)
    if (index >= 6) {
      const g = await ghost.boundingBox(), v = await page.locator('[data-sample-entity="verify"]').boundingBox()
      assert.ok(g.x + g.width < v.x, 'ghost and verify need distinct, non-overlapping row slots')
    }
  }
  console.log('ASSERT I-35/I-36: ghost identity, label, hit-test visibility through beats 5–9 and distinct verify slot')

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 390, height: 500 }]) {
    await page.setViewportSize(viewport)
    for (const mode of ['browse', 'present']) {
      if (await page.locator('[data-presentation-root]').getAttribute('data-presentation-mode') !== mode) await page.keyboard.press('p')
      await settle(page, 150)
      const bounds = await page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }
        return { stage: rect('[data-presentation-stage]'), canvas: rect('[data-presentation-canvas]') }
      })
      const { stage: s, canvas: c } = bounds
      assert.ok(c.w > 0 && c.h > 0)
      assert.ok(Math.abs(c.w / 880 - c.h / 380) < 0.00001, 'scaling must be uniform')
      assert.ok(c.x >= s.x - 1 && c.y >= s.y - 1 && c.x + c.w <= s.x + s.w + 1 && c.y + c.h <= s.y + s.h + 1, JSON.stringify({ viewport, mode, bounds }))
      assert.ok(c.x >= -1 && c.y >= -1 && c.x + c.w <= viewport.width + 1 && c.y + c.h <= viewport.height + 1)
      assert.ok(Math.abs(c.x + c.w / 2 - (s.x + s.w / 2)) < 1 && Math.abs(c.y + c.h / 2 - (s.y + s.h / 2)) < 1, 'painted canvas must stay centered')
      console.log(`ASSERT I-17: painted canvas fits and centers at ${viewport.width}x${viewport.height} ${mode}: ${JSON.stringify(c)}`)
    }
  }
}, { root: process.argv[2] })
