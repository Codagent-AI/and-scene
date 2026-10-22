// Pure analysers for the screenshot helper. The helper collects plain facts from the
// page; everything that decides what is suspicious lives here so it can be tested
// without a browser. Warnings are advisory and never change the exit code.

export const MIN_ATTRIBUTION_FONT_PX = 11
export const BROWSER_DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
export const COLOR_TOLERANCE = 8
export const NUMBER_TOLERANCE = 0.5
export const OVERLAP_TOLERANCE_PX = 1
export const ATTRIBUTION_HOOK = 'data-presentation-attribution'

const intersect = (a, b, tolerance) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > tolerance &&
  Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > tolerance

/**
 * @param elements `{ id, label, rect: {x,y,w,h}, visible, allowed, ancestors: string[] }`.
 *   `allowed` means the element sits inside an allow-overlap subtree; `ancestors` are ids of
 *   containing collected elements (a container is not "overlapping" what it contains).
 */
export function findOverlaps(elements, tolerance = OVERLAP_TOLERANCE_PX) {
  const shown = elements.filter((e) => e.visible && e.rect.w > 0 && e.rect.h > 0)
  const found = []
  for (let i = 0; i < shown.length; i += 1) {
    for (let j = i + 1; j < shown.length; j += 1) {
      const a = shown[i]
      const b = shown[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors?.includes(b.id) || b.ancestors?.includes(a.id)) continue
      if (intersect(a.rect, b.rect, tolerance)) found.push([a.label, b.label])
    }
  }
  return found
}

function parseColor(value) {
  const match = /^rgba?\(([^)]+)\)$/.exec(String(value).trim())
  if (!match) return null
  const [r, g, b, a = 1] = match[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  return [r, g, b, a]
}

function sameValue(prop, a, b) {
  const colorA = parseColor(a)
  const colorB = parseColor(b)
  if (colorA && colorB) {
    return colorA.every((channel, i) => Math.abs(channel - colorB[i]) <= (i === 3 ? 0.05 : COLOR_TOLERANCE))
  }
  const numA = Number.parseFloat(a)
  const numB = Number.parseFloat(b)
  if (['opacity', 'fontWeight', 'width', 'height'].includes(prop) && !Number.isNaN(numA) && !Number.isNaN(numB)) {
    return Math.abs(numA - numB) <= (prop === 'opacity' ? 0.05 : NUMBER_TOLERANCE)
  }
  return a === b
}

export const ACTIVE_STYLE_PROPS = [
  'backgroundColor',
  'color',
  'borderColor',
  'opacity',
  'fontWeight',
  'outline',
  'boxShadow',
  'transform',
  'width',
  'height',
]

/** Which computed-style properties differ between an active element and an inactive sibling. */
export function differingProps(active, inactive) {
  return ACTIVE_STYLE_PROPS.filter((prop) => !sameValue(prop, active[prop], inactive[prop]))
}

export const isIndistinct = (active, inactive) => differingProps(active, inactive).length === 0

/** @returns 'missing' | 'small' | 'browser-default' | null for a legible, deliberate attribution. */
export function classifyAttribution(info) {
  if (!info) return 'missing'
  if (info.fontSizePx < MIN_ATTRIBUTION_FONT_PX) return 'small'
  const defaultLink =
    sameValue('color', info.color, BROWSER_DEFAULT_LINK_COLOR) &&
    String(info.textDecorationLine).includes('underline') &&
    info.fontFamily === info.parentFontFamily
  return defaultLink ? 'browser-default' : null
}

const pad = (n) => String(n).padStart(2, '0')

export const screenshotName = (index) => `step-${pad(index)}.png`

export function formatWarning(index, kind, message) {
  return `WARN step ${index} ${kind}: ${message}`
}

/** Turns the facts gathered at one step into advisory warning lines. */
export function warningsForStep(index, facts) {
  const lines = []
  for (const [a, b] of findOverlaps(facts.elements)) {
    lines.push(formatWarning(index, 'overlap', `${a} overlaps ${b} (mark an intentional readable overlap with data-presentation-allow-overlap)`))
  }
  for (const chrome of facts.activeChrome) {
    if (chrome.inactive && isIndistinct(chrome.active, chrome.inactive)) {
      lines.push(
        formatWarning(index, 'active-chrome', `active ${chrome.name} looks the same as inactive ones; style [data-presentation-active="true"] / [aria-current]`),
      )
    }
  }
  const attribution = classifyAttribution(facts.attribution)
  if (attribution === 'missing') {
    lines.push(formatWarning(index, 'attribution', `no [${ATTRIBUTION_HOOK}] link found; render the kit attribution and style [${ATTRIBUTION_HOOK}]`))
  } else if (attribution === 'small') {
    lines.push(formatWarning(index, 'attribution', `attribution text is under ${MIN_ATTRIBUTION_FONT_PX}px; style [${ATTRIBUTION_HOOK}]`))
  } else if (attribution === 'browser-default') {
    lines.push(formatWarning(index, 'attribution', `attribution has the browser-default link look; style [${ATTRIBUTION_HOOK}]`))
  }
  return lines
}
