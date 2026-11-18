import { sleep } from './browser-runtime.mjs'

// Serialized into the page. Motion can animate through requestAnimationFrame,
// so document.getAnimations() alone cannot establish that the scene is ready.
export function readSceneState() {
  return [...document.querySelectorAll('[data-presentation-canvas] [data-presentation-entity]')].map(element => {
    const box = element.getBoundingClientRect()
    let opacity = 1
    let hidden = false
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      opacity *= style.opacity === '' ? 1 : Number(style.opacity)
      hidden ||= style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility)
    }
    const round = value => Math.round(value * 1000) / 1000
    return { id: element.getAttribute('data-presentation-entity'), x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height), opacity: round(opacity), visible: !hidden && opacity > 0 && box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight }
  })
}

async function paint() {
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))
}

/** Capture only a painted, visible, stable viewport; never resize for fullPage. */
export async function captureStep(page, { index, settle }) {
  await page.bringToFront()
  await page.evaluate(async () => { await document.fonts?.ready })
  await page.evaluate(paint)
  await sleep(settle)
  let previous
  for (let attempt = 0; attempt < 60; attempt++) {
    await page.evaluate(paint)
    const state = await page.evaluate(readSceneState)
    const signature = JSON.stringify(state)
    // Intentionally empty/raw scenes without kit entities remain supported.
    const visible = !state.length || state.some(entity => entity.visible)
    if (visible && signature === previous) {
      const buffer = await page.screenshot({ fullPage: false, animations: 'allow' })
      await page.evaluate(paint)
      const after = await page.evaluate(readSceneState)
      if (JSON.stringify(after) === signature) return { buffer, scene: after }
    }
    previous = signature
    await sleep(50)
  }
  throw new Error(`inspection step ${index}: scene did not become visible and settle; no screenshot saved`)
}
