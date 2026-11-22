import { PNG } from 'pngjs'
import { sleep } from './browser-runtime.mjs'

// Serialized into the page. Include viewport chrome and author-marked portal
// regions: stable canvas entities alone do not prove the whole UI is ready.
export function readCaptureState() {
  const round = value => Math.round(value * 1000) / 1000
  const describe = element => {
    const box = element.getBoundingClientRect()
    let opacity = 1
    let hidden = false
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      opacity *= style.opacity === '' ? 1 : Number(style.opacity)
      hidden ||= style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility)
    }
    return { x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height), opacity: round(opacity), visible: !hidden && opacity > 0 && box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight }
  }
  const entities = [...document.querySelectorAll('[data-presentation-canvas] [data-presentation-entity]')].map(element => ({ id: element.getAttribute('data-presentation-entity'), ...describe(element) }))
  const chrome = [...document.querySelectorAll('[data-presentation-header], [data-presentation-footer], [data-presentation-toc], [data-presentation-attribution]')].map(element => ({ text: element.textContent, ...describe(element) }))
  const regions = [...document.querySelectorAll('[data-presentation-capture-region]')].map(element => ({
    id: element.getAttribute('data-presentation-capture-region'), text: element.textContent, scrollTop: element.scrollTop, scrollLeft: element.scrollLeft,
    background: getComputedStyle(element).backgroundColor,
    probes: (element.getAttribute('data-presentation-capture-probes') || '').split(';').filter(Boolean).map(point => point.split(',').map(Number)),
    ...describe(element),
  }))
  return { viewport: { width: innerWidth, height: innerHeight, x: scrollX, y: scrollY, visualWidth: window.visualViewport?.width, visualHeight: window.visualViewport?.height, scale: window.visualViewport?.scale }, entities, chrome, regions }
}

// Pixel probes are opt-in author hooks in clear, opaque background padding.
// They catch a composited panel omitted from the image despite stable DOM state.
export function regionsArePainted(buffer, state) {
  const regions = state.regions.filter(region => region.visible && region.probes.length)
  if (!regions.length) return true
  const image = PNG.sync.read(buffer)
  const scaleX = image.width / state.viewport.width, scaleY = image.height / state.viewport.height
  return regions.every(region => {
    const color = region.background.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
    if (!color || (color[4] !== undefined && Number(color[4]) !== 1)) return false
    return region.probes.every(([px, py]) => {
      if (!Number.isFinite(px) || !Number.isFinite(py)) return false
      const localX = px < 0 ? region.width + px : px, localY = py < 0 ? region.height + py : py
      if (localX < 0 || localX >= region.width || localY < 0 || localY >= region.height) return false
      const x = Math.floor((region.x + localX) * scaleX), y = Math.floor((region.y + localY) * scaleY)
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) return false
      const offset = (y * image.width + x) * 4
      return [0, 1, 2].every(channel => Math.abs(image.data[offset + channel] - Number(color[channel + 1])) <= 1)
    })
  })
}

async function paint() {
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))
}

/** Capture one stable, painted viewport, including marked UI outside the canvas. */
export async function captureStep(page, { index, settle }) {
  await page.bringToFront()
  await page.evaluate(async () => { await document.fonts?.ready })
  await page.evaluate(paint)
  await sleep(settle)
  let previous
  for (let attempt = 0; attempt < 60; attempt++) {
    await page.evaluate(paint)
    const state = await page.evaluate(readCaptureState)
    const signature = JSON.stringify(state)
    const visible = !state.entities.length || state.entities.some(entity => entity.visible)
    if (visible && signature === previous) {
      const buffer = await page.screenshot({ fullPage: false, animations: 'allow' })
      await page.evaluate(paint)
      const after = await page.evaluate(readCaptureState)
      if (JSON.stringify(after) === signature && regionsArePainted(buffer, after)) {
        return { buffer, scene: after.entities, chrome: after.chrome, regions: after.regions, viewport: after.viewport }
      }
    }
    previous = signature
    await sleep(50)
  }
  throw new Error(`inspection step ${index}: scene or chrome did not become stable and painted; no screenshot saved`)
}
