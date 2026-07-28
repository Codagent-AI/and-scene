import { beforeEach, describe, expect, it } from 'vitest'
import { findUnmarkedOverlaps } from './inspect-checks.mjs'

/** jsdom returns zeroed rects, so give each element an explicit box. */
function setBox(el, { x, y, w, h }) {
  el.getBoundingClientRect = () => ({
    x,
    y,
    width: w,
    height: h,
    top: y,
    left: x,
    right: x + w,
    bottom: y + h,
  })
  // The visibility filter reads computed opacity, which jsdom leaves blank.
  el.style.opacity = '1'
  return el
}

function build({ sceneHtml, tocBox = { x: 900, y: 100, w: 80, h: 150 } }) {
  document.body.innerHTML = `
    <nav data-presentation-toc=""><button data-presentation-toc-entry="">the reveal</button></nav>
    <div data-presentation-stage="">${sceneHtml}</div>
  `
  setBox(document.querySelector('[data-presentation-toc]'), tocBox)
  return document.querySelector('[data-presentation-stage]')
}

describe('findUnmarkedOverlaps', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('reports a bordered scene frame that overlaps chrome even though it has children', () => {
    const stage = build({
      sceneHtml: `<div data-presentation-frame=""><span>inner</span></div>`,
    })
    setBox(stage.querySelector('[data-presentation-frame]'), { x: 40, y: 90, w: 900, h: 300 })
    setBox(stage.querySelector('span'), { x: 100, y: 200, w: 60, h: 20 })

    const warnings = findUnmarkedOverlaps()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('frame')
    expect(warnings[0]).toContain('toc')
  })

  it('still reports leaf scene text overlapping chrome', () => {
    const stage = build({ sceneHtml: `<span>a topic</span>` })
    setBox(stage.querySelector('span'), { x: 880, y: 120, w: 120, h: 24 })

    const warnings = findUnmarkedOverlaps()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('a topic')
  })

  it('does not report a scene frame that clears the chrome', () => {
    const stage = build({
      sceneHtml: `<div data-presentation-frame=""><span>inner</span></div>`,
    })
    setBox(stage.querySelector('[data-presentation-frame]'), { x: 40, y: 90, w: 700, h: 300 })
    setBox(stage.querySelector('span'), { x: 100, y: 200, w: 60, h: 20 })

    expect(findUnmarkedOverlaps()).toEqual([])
  })

  it('honours an explicit allow-overlap marker', () => {
    const stage = build({
      sceneHtml: `<div data-presentation-allow-overlap=""><div data-presentation-frame=""><span>inner</span></div></div>`,
    })
    setBox(stage.querySelector('[data-presentation-frame]'), { x: 40, y: 90, w: 900, h: 300 })
    setBox(stage.querySelector('span'), { x: 100, y: 200, w: 60, h: 20 })

    expect(findUnmarkedOverlaps()).toEqual([])
  })

  it('ignores structural scene wrappers that span the whole canvas', () => {
    const stage = build({
      sceneHtml: `<div data-presentation-scene-layer=""><div data-presentation-appear=""></div></div>`,
    })
    setBox(stage.querySelector('[data-presentation-scene-layer]'), { x: 0, y: 0, w: 1280, h: 600 })
    setBox(stage.querySelector('[data-presentation-appear]'), { x: 0, y: 0, w: 1280, h: 600 })

    expect(findUnmarkedOverlaps()).toEqual([])
  })

  it('returns nothing when there is no stage', () => {
    document.body.innerHTML = `<nav data-presentation-toc=""></nav>`
    expect(findUnmarkedOverlaps()).toEqual([])
  })
})
