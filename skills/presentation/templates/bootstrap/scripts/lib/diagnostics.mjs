// Advisory visual diagnostics for inspect-presentation.mjs. `collectDiagnostics` runs inside
// the page (it must stay self-contained); `formatWarnings` turns its findings into messages.

export const OVERLAP_TOLERANCE_PX = 2
export const ATTRIBUTION_MIN_FONT_PX = 11
export const ATTRIBUTION_MIN_HIT_PX = 16
export const BROWSER_DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
export const ALLOW_OVERLAP_ATTRIBUTE = 'data-presentation-allow-overlap'

export const CHROME_SELECTOR = [
  '[data-presentation-progress-item]',
  '[data-presentation-toc-entry]',
  '[data-presentation-prev]',
  '[data-presentation-next]',
  '[data-presentation-attribution]',
  '[data-presentation-marker]',
].join(',')

export function collectDiagnostics(options) {
  const { tolerance, minFont, minHit, defaultLinkColor, chromeSelector, allowAttribute } = options

  const isVisible = (element) => {
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.05) {
        return false
      }
    }
    return true
  }

  const describe = (element) => {
    const hooks = element.getAttributeNames().filter((name) => name.startsWith('data-presentation-'))
    const entity = element.getAttribute('data-presentation-entity')
    const label = entity ? `data-presentation-entity="${entity}"` : hooks[0]
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)
    return `<${element.tagName.toLowerCase()}${label ? ` ${label}` : ''}>${text ? ` "${text}"` : ''}`
  }

  const union = (rects) => {
    const boxes = rects.filter((rect) => rect.width > 0 && rect.height > 0)
    if (!boxes.length) return null
    return {
      left: Math.min(...boxes.map((r) => r.left)),
      top: Math.min(...boxes.map((r) => r.top)),
      right: Math.max(...boxes.map((r) => r.right)),
      bottom: Math.max(...boxes.map((r) => r.bottom)),
    }
  }

  const candidates = new Map()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || !node.textContent.trim() || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) continue
    if (!isVisible(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = union([...range.getClientRects()])
    if (!rect) continue
    const previous = candidates.get(parent)
    candidates.set(parent, previous ? union([previous, rect].map(toRect)) : rect)
  }
  function toRect(box) {
    return { ...box, width: box.right - box.left, height: box.bottom - box.top }
  }
  for (const element of document.querySelectorAll(chromeSelector)) {
    if (!isVisible(element)) continue
    const box = element.getBoundingClientRect()
    if (box.width > 0 && box.height > 0) {
      candidates.set(element, { left: box.left, top: box.top, right: box.right, bottom: box.bottom })
    }
  }

  const overlaps = []
  const entries = [...candidates.entries()]
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, boxA] = entries[i]
      const [b, boxB] = entries[j]
      if (a.contains(b) || b.contains(a)) continue
      if (a.closest(`[${allowAttribute}]`) || b.closest(`[${allowAttribute}]`)) continue
      const width = Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left)
      const height = Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top)
      if (width > tolerance && height > tolerance) {
        overlaps.push({ a: describe(a), b: describe(b) })
      }
    }
  }

  const styleKeys = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderLeftColor',
    'opacity',
    'fontWeight',
    'textDecorationLine',
    'transform',
  ]
  const signature = (element) => {
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    // Text-bearing items differ in width just because their labels differ, which is not a
    // visual distinction, so width counts only for items without text (such as dots).
    const hasText = element.textContent.trim() !== ''
    return JSON.stringify([
      ...styleKeys.map((key) => style[key]),
      hasText ? null : Math.round(box.width),
      Math.round(box.height),
    ])
  }
  const indistinct = []
  for (const [kind, selector] of [
    ['progress', '[data-presentation-progress-item]'],
    ['toc', '[data-presentation-toc-entry]'],
  ]) {
    const items = [...document.querySelectorAll(selector)].filter(isVisible)
    const active = items.filter((item) => item.getAttribute('data-presentation-active') === 'true')
    const inactive = items.filter((item) => !active.includes(item))
    if (active.length && inactive.length) {
      const activeSignature = signature(active[0])
      // matching any inactive peer is enough: the viewer cannot tell those two apart
      if (inactive.some((item) => signature(item) === activeSignature)) {
        indistinct.push({ kind, hook: selector.slice(1, -1) })
      }
    }
  }

  let attribution = { status: 'missing' }
  const link = document.querySelector('[data-presentation-attribution]')
  if (link && isVisible(link)) {
    const box = link.getBoundingClientRect()
    if (box.width > 0 && box.height > 0) {
      const style = getComputedStyle(link)
      const probe = document.createElement('span')
      probe.style.cssText = 'all: initial'
      document.body.append(probe)
      const defaultFamily = getComputedStyle(probe).fontFamily
      probe.remove()
      const browserDefault =
        style.color === defaultLinkColor &&
        style.textDecorationLine.includes('underline') &&
        style.fontFamily === defaultFamily
      attribution = {
        status: 'present',
        fontSize: parseFloat(style.fontSize),
        height: box.height,
        browserDefault,
      }
    }
  }

  return { overlaps: overlaps.slice(0, 20), indistinct, attribution, minFont, minHit }
}

export function formatWarnings(step, findings) {
  const warnings = []
  for (const { a, b } of findings.overlaps) {
    warnings.push({
      step,
      kind: 'overlap',
      message: `${a} overlaps ${b}; mark an intentional overlap with ${ALLOW_OVERLAP_ATTRIBUTE}`,
    })
  }
  for (const { kind, hook } of findings.indistinct) {
    warnings.push({
      step,
      kind: 'active-chrome',
      message: `active ${kind} item is visually indistinct from inactive items; style [${hook}][data-presentation-active="true"]`,
    })
  }
  const { attribution } = findings
  const hint = 'style it through [data-presentation-attribution]'
  if (attribution.status === 'missing') {
    warnings.push({ step, kind: 'attribution', message: `attribution is missing or hidden; ${hint}` })
  } else {
    if (attribution.fontSize < findings.minFont) {
      warnings.push({
        step,
        kind: 'attribution',
        message: `attribution font size ${attribution.fontSize}px is under ${findings.minFont}px; ${hint}`,
      })
    }
    if (attribution.height < findings.minHit) {
      warnings.push({
        step,
        kind: 'attribution',
        message: `attribution hit box ${Math.round(attribution.height)}px is under ${findings.minHit}px; ${hint}`,
      })
    }
    if (attribution.browserDefault) {
      warnings.push({
        step,
        kind: 'attribution',
        message: `attribution uses the browser-default link look; ${hint}`,
      })
    }
  }
  return warnings
}

export const diagnosticOptions = {
  tolerance: OVERLAP_TOLERANCE_PX,
  minFont: ATTRIBUTION_MIN_FONT_PX,
  minHit: ATTRIBUTION_MIN_HIT_PX,
  defaultLinkColor: BROWSER_DEFAULT_LINK_COLOR,
  chromeSelector: CHROME_SELECTOR,
  allowAttribute: ALLOW_OVERLAP_ATTRIBUTE,
}
