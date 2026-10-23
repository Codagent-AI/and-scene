// Advisory visual diagnostics for scripts/inspect-presentation.mjs. Everything here
// except `collectPageData` is pure so it unit-tests without a browser.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Waits for running animations, then the configured settle interval. */
export async function settle(page, ms, sleep = delay) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => {}))))
  await sleep(ms)
}

const MIN_OVERLAP_PX = 2

/** Pairs of visible text/chrome items that overlap without an allow-overlap marker. */
export function findOverlaps(items) {
  const found = []
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      const first = items[a]
      const second = items[b]
      if (first.allowOverlap || second.allowOverlap) continue
      if (first.ancestors.includes(second.idx) || second.ancestors.includes(first.idx)) continue
      const width = Math.min(first.rect.x + first.rect.w, second.rect.x + second.rect.w) - Math.max(first.rect.x, second.rect.x)
      const height = Math.min(first.rect.y + first.rect.h, second.rect.y + second.rect.h) - Math.max(first.rect.y, second.rect.y)
      if (width > MIN_OVERLAP_PX && height > MIN_OVERLAP_PX) {
        found.push({ a: first.label, b: second.label, width: Math.round(width), height: Math.round(height) })
      }
    }
  }
  return found
}

const COLOR_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'outlineColor']
const COLOR_DISTANCE = 32

function parseColor(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value ?? '')
  if (!match) return null
  const [r, g, b, a = 1] = match[1].split(/[,/ ]+/).filter(Boolean).map(Number)
  return { r, g, b, a }
}

function colorsDiffer(one, two) {
  const a = parseColor(one)
  const b = parseColor(two)
  if (!a || !b) return one !== two
  if (Math.abs(a.a - b.a) > 0.25) return true
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) >= COLOR_DISTANCE
}

/** True when the active control's computed style is visibly different from an inactive one. */
export function isDistinct(active, inactive) {
  for (const key of new Set([...Object.keys(active), ...Object.keys(inactive)])) {
    if (COLOR_PROPS.includes(key)) {
      if (colorsDiffer(active[key], inactive[key])) return true
    } else if (active[key] !== inactive[key]) return true
  }
  return false
}

const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(158, 158, 255)', 'rgb(209, 157, 255)'])
const MIN_ATTRIBUTION_FONT_PX = 12

/** Reasons the attribution looks unpolished; empty when it is fine. */
export function attributionIssues(info) {
  if (!info) return ['attribution link is missing']
  const issues = []
  if (info.fontSize < MIN_ATTRIBUTION_FONT_PX || info.rect.h < 12) issues.push(`attribution is undersized (${info.fontSize}px text)`)
  if (DEFAULT_LINK_COLORS.has(info.color)) issues.push('attribution uses the browser-default link color')
  return issues
}

/**
 * Turns collected page data into advisory warnings for one step.
 * `reported` dedupes page-wide findings (attribution, indistinct chrome) across steps.
 */
export function analyze(step, data, reported = new Set()) {
  const warnings = []
  const add = (kind, message, once) => {
    if (once) {
      if (reported.has(`${kind}:${message}`)) return
      reported.add(`${kind}:${message}`)
    }
    warnings.push({ kind, step, message })
  }
  for (const overlap of findOverlaps(data.items)) {
    add('overlap', `${overlap.a} overlaps ${overlap.b} (${overlap.width}x${overlap.height}px); mark intentional overlap with data-presentation-allow-overlap`)
  }
  for (const [kind, label, pair] of [
    ['active-progress', '[data-presentation-dot]', data.dots],
    ['active-toc', '[data-presentation-toc-entry]', data.toc],
  ]) {
    if (pair?.active && pair?.inactive && !isDistinct(pair.active, pair.inactive)) {
      add(kind, `active ${label} looks the same as inactive ones; style [data-presentation-active] in presentation CSS`, true)
    }
  }
  for (const issue of attributionIssues(data.attribution)) {
    add('attribution', `${issue}; style [data-presentation-attribution] in presentation CSS`, true)
  }
  return warnings
}

/** Runs in the page: gathers visible text/chrome boxes and the chrome styles to compare. */
export function collectPageData() {
  const CHROME = '[data-presentation-dot],[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-toc-entry],[data-presentation-attribution]'
  const STYLE_KEYS = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'outlineColor', 'outlineWidth', 'fontWeight', 'opacity', 'width', 'height', 'boxShadow', 'textDecorationLine', 'transform', 'backgroundImage']
  // Entries with different text have different natural sizes, so size only counts for same-sized dots.
  const sig = (el, sized) => {
    const style = getComputedStyle(el)
    return Object.fromEntries(STYLE_KEYS.filter((key) => sized || (key !== 'width' && key !== 'height')).map((key) => [key, style[key]]))
  }
  const rectOf = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })
  const describe = (el, text) => {
    const entity = el.getAttribute('data-presentation-entity')
    const hook = Array.from(el.attributes).find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-entity' && a.name !== 'data-presentation-active')
    const tag = `${el.tagName.toLowerCase()}${entity ? `[${entity}]` : hook ? `[${hook.name}]` : ''}`
    return text ? `${tag} "${text.trim().slice(0, 32)}"` : tag
  }

  const items = []
  const byElement = new Map()
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'PATH', 'LINE'].includes(el.tagName.toUpperCase())) continue
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.05) continue
    const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    const isChrome = el.matches(CHROME)
    if (!textNodes.length && !isChrome) continue
    let rect
    if (isChrome) rect = rectOf(el.getBoundingClientRect())
    else {
      const range = document.createRange()
      const boxes = textNodes.flatMap((node) => {
        range.selectNodeContents(node)
        return Array.from(range.getClientRects())
      })
      if (!boxes.length) continue
      const left = Math.min(...boxes.map((b) => b.left))
      const top = Math.min(...boxes.map((b) => b.top))
      rect = { x: left, y: top, w: Math.max(...boxes.map((b) => b.right)) - left, h: Math.max(...boxes.map((b) => b.bottom)) - top }
    }
    if (rect.w <= 0 || rect.h <= 0) continue
    const idx = items.length
    const ancestors = []
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (byElement.has(parent)) ancestors.push(byElement.get(parent))
    }
    byElement.set(el, idx)
    items.push({ idx, label: describe(el, textNodes.map((n) => n.textContent).join(' ')), rect, allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null, ancestors })
  }

  const pair = (selector, sized) => {
    const active = document.querySelector(`${selector}[data-presentation-active]`)
    const inactive = document.querySelector(`${selector}:not([data-presentation-active])`)
    return active && inactive ? { active: sig(active, sized), inactive: sig(inactive, sized) } : null
  }
  const link = document.querySelector('[data-presentation-attribution]')
  const attribution = link
    ? { fontSize: parseFloat(getComputedStyle(link).fontSize), color: getComputedStyle(link).color, rect: rectOf(link.getBoundingClientRect()) }
    : null
  return { items, dots: pair('[data-presentation-dot]', true), toc: pair('[data-presentation-toc-entry]', false), attribution }
}
