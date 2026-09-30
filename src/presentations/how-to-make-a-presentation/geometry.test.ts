import { describe, expect, it } from 'vitest'
import { DESIGN_W } from '../../presentation-kit/constants'
import css from './presentation.css?raw'
import scene from './Scene.tsx?raw'

// Composition checks for this presentation's scene, in design-canvas
// coordinates. Both SVG connectors draw in plain CSS pixels inside their own
// absolutely positioned slot (no viewBox), so a slot's `left`/`top` plus a path
// coordinate is a position on the 880 × 380 canvas. jsdom has no layout engine,
// so the geometry is read as source from the two files that define it — the
// stylesheet that places each slot and the scene that draws inside it.
//
// These lock in scene intent that `presentation-verification/spec.md` fixes for
// steps 2 and 8 and that neither `npm run verify` nor `npm run inspect` can see:
// verify only checks for errors, and the inspection helper's overlap heuristic
// only considers elements that own text nodes, so an SVG arrow is invisible to
// it.

function rule(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.[\]='*-]/g, (c) => `\\${c}`)
  const match = css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'))
  expect(match, `no rule for ${selector}`).not.toBeNull()
  const declarations: Record<string, string> = {}
  for (const declaration of match![1].split(';')) {
    const [property, ...value] = declaration.split(':')
    if (!property.trim() || value.length === 0) continue
    declarations[property.trim()] = value.join(':').trim()
  }
  return declarations
}

function px(selector: string, property: string): number {
  const raw = rule(selector)[property]
  expect(raw, `${selector} has no ${property}`).toBeDefined()
  const value = Number.parseFloat(raw)
  expect(Number.isFinite(value), `${selector} ${property} is not a length`).toBe(true)
  return value
}

// Resolves an SVG geometry attribute that may be a percentage of its slot.
function resolve(raw: string, extent: number): number {
  return raw.trim().endsWith('%') ? (Number.parseFloat(raw) / 100) * extent : Number.parseFloat(raw)
}

// The scene draws several SVGs; each carries its own class, so scope the search
// to that element's subtree rather than taking the first tag in the file.
function markup(className: string): string {
  const start = scene.indexOf(`className="${className}"`)
  expect(start, `no element with class ${className}`).toBeGreaterThan(-1)
  const end = scene.indexOf('</Arrow>', start)
  expect(end, `no closing </Arrow> after ${className}`).toBeGreaterThan(start)
  return scene.slice(start, end)
}

function attributesOf(source: string, tag: string): Record<string, string> {
  const match = source.match(new RegExp(`<${tag}\\s([^>]*?)/?>`, 's'))
  expect(match, `no <${tag}> found`).not.toBeNull()
  const attributes: Record<string, string> = {}
  for (const attribute of match![1].matchAll(/([\w-]+)="([^"]*)"/g)) {
    attributes[attribute[1]] = attribute[2]
  }
  return attributes
}

describe('step 2 — the you↔skill connector', () => {
  const slotLeft = px('.connector-slot', 'left')
  const slotWidth = px('.connector-slot', 'width')
  const line = attributesOf(markup('connector-arrow'), 'line')
  const lineStart = slotLeft + resolve(line.x1, slotWidth)
  const lineEnd = slotLeft + resolve(line.x2, slotWidth)

  const youRight = px('.node-you', 'left') + px('.node-you', 'width')
  const skillLeft = DESIGN_W - px('.node-skill-slot', 'right') - px('.node-skill', 'width')

  // The spec fixes step 2's scene content as "a two-way arrow connects
  // you↔skill". An arrow that stops a third of the way across reads as pointing
  // at empty canvas.
  const REACH_TOLERANCE = 48

  it('draws from you across to skill rather than stopping short', () => {
    expect(lineStart).toBeGreaterThan(youRight)
    expect(lineStart - youRight).toBeLessThanOrEqual(REACH_TOLERANCE)
    expect(lineEnd).toBeLessThan(skillLeft)
    expect(skillLeft - lineEnd).toBeLessThanOrEqual(REACH_TOLERANCE)
  })

  it('puts the question chip above the drawn arrow, not beside it', () => {
    const chipLeft = px('.question-chip-slot', 'left')
    expect(chipLeft).toBeGreaterThanOrEqual(lineStart)
    expect(chipLeft).toBeLessThanOrEqual(lineEnd)

    const lineY = px('.connector-slot', 'top') + resolve(line.y1, px('.connector-slot', 'height'))
    expect(px('.question-chip-slot', 'top')).toBeLessThan(lineY)
  })
})

describe('steps 8–9 — the modify arc', () => {
  // slot selector → the rule that sizes the entity inside it.
  const TRAY_ENTITIES: [string, string, number][] = [
    ['.card-step-slot', '.node-card', px('.node-card', 'min-height')],
    ['.card-deck-slot', '.node-card', px('.node-card', 'min-height')],
    ['.ghost-card-slot', '.node-card', px('.node-card', 'min-height')],
    ['.verify-node-slot', '.node-verify', px('.node-card', 'min-height')],
  ]

  // The arrowhead is drawn with the default markerUnits="strokeWidth" at 8 × 8
  // marker units over a 2px stroke, so it reaches about this far past the path's
  // end point.
  const ARROWHEAD_CLEARANCE = 8

  it('lands outside every tray entity instead of striking through its label', () => {
    const arc = attributesOf(markup('modify-arrow'), 'path')
    const coordinates = [...arc.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)]
    expect(coordinates.length, 'no coordinates in the modify arc path').toBeGreaterThan(0)
    const [, x, y] = coordinates[coordinates.length - 1]
    const tip = {
      x: px('.modify-arc-slot', 'left') + Number.parseFloat(x),
      y: px('.modify-arc-slot', 'top') + Number.parseFloat(y),
    }

    for (const [slot, entity, height] of TRAY_ENTITIES) {
      const left = px(slot, 'left')
      const top = px(slot, 'top')
      const box = { left, right: left + px(entity, 'width'), top, bottom: top + height }
      const hits =
        tip.x > box.left - ARROWHEAD_CLEARANCE &&
        tip.x < box.right + ARROWHEAD_CLEARANCE &&
        tip.y > box.top - ARROWHEAD_CLEARANCE &&
        tip.y < box.bottom + ARROWHEAD_CLEARANCE
      expect(hits, `the modify arc's arrowhead lands on ${slot} at (${tip.x}, ${tip.y})`).toBe(false)
    }
  })
})
