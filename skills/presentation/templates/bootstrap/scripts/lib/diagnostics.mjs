// Advisory visual diagnostics. Pure functions over data collected from the page.

export const MIN_ATTRIBUTION_PX = 11
export const ALLOW_OVERLAP_ATTR = 'data-presentation-allow-overlap'

export function rectsOverlap(a, b, tolerance = 0.5) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > tolerance && h > tolerance
}

/**
 * items: [{ label, rect, allowed, ancestors: [labels of ancestor items] }]
 * Items inside an allow-overlap subtree are exempt; ancestor/descendant pairs
 * never collide with each other.
 */
export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(b.key) || b.ancestors.includes(a.key)) continue
      if (rectsOverlap(a.rect, b.rect)) found.push([a, b])
    }
  }
  return found
}

const STYLE_KEYS = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'fontWeight', 'transform', 'width', 'height']

/** True when the active control looks the same as an inactive sibling. */
export function isIndistinct(active, inactive) {
  return STYLE_KEYS.every((k) => active[k] === inactive[k])
}

const BROWSER_LINK = 'rgb(0, 0, 238)'

/** Returns a reason string when the attribution looks unpolished, else null. */
export function attributionIssue(attr) {
  if (!attr) return 'attribution link is missing'
  if (attr.fontSize < MIN_ATTRIBUTION_PX) return `attribution text is ${attr.fontSize}px (under ${MIN_ATTRIBUTION_PX}px)`
  if (attr.color === BROWSER_LINK && /underline/.test(attr.textDecorationLine)) {
    return 'attribution uses the browser-default link styling'
  }
  return null
}

/**
 * Settle helper: resolves after `settleMs` using the injected sleep, returning
 * the elapsed time as measured by the injected clock.
 */
export async function settle(settleMs, { sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() } = {}) {
  const start = now()
  await sleep(settleMs)
  return now() - start
}

/** Turn a step snapshot into advisory warning lines. */
export function diagnose(step) {
  const warnings = []
  const where = `step ${step.index + 1}${step.title ? ` (${step.title})` : ''}`
  for (const [a, b] of findOverlaps(step.items)) {
    warnings.push(`[overlap] ${where}: ${a.label} overlaps ${b.label}; mark an intentional readable overlap with ${ALLOW_OVERLAP_ATTR}`)
  }
  for (const group of step.activeChrome) {
    if (group.active && group.inactive && isIndistinct(group.active, group.inactive)) {
      warnings.push(`[active-chrome] ${where}: active ${group.name} is visually indistinct from inactive ${group.name}; style [data-presentation-active="true"]`)
    }
  }
  const issue = attributionIssue(step.attribution)
  if (issue) {
    warnings.push(`[attribution] ${where}: ${issue}; style the [data-presentation-attribution] hook`)
  }
  return warnings
}
