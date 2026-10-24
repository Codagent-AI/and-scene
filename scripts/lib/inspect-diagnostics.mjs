/** Defaults for the inspection helper. */
export const VIEWPORT = { width: 1280, height: 720 }
/** Longer than the kit's longest transition (layout morph + enter delay + fade-in ≈ 1.05 s). */
export const DEFAULT_SETTLE_MS = 1500
export const MIN_ATTRIBUTION_PX = 11
export const OVERLAP_MIN_PX = 4
export const DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(158, 158, 255)', 'rgb(255, 0, 0)']

/** Computed-style properties that can make an active control look different. */
export const DISTINCTION_PROPS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'outlineStyle',
  'outlineWidth', 'outlineColor', 'boxShadow', 'fontWeight', 'opacity', 'width', 'height',
  'textDecorationLine', 'transform',
]

/** Overlapping area exceeds `min` px in both axes. */
export function rectsOverlap(a, b, min = OVERLAP_MIN_PX) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > min && h > min
}

/**
 * Pairs of visible text/chrome items that overlap. Ancestor/descendant pairs and
 * pairs with a member inside an allow-overlap subtree are exempt.
 * item: { desc, rect, allowed, ancestors: number[] }
 */
export function findOverlaps(items) {
  const pairs = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(j) || b.ancestors.includes(i)) continue
      if (rectsOverlap(a.rect, b.rect)) pairs.push([a.desc, b.desc])
    }
  }
  return pairs
}

/**
 * True when every compared style property of the active control equals the inactive one.
 * Size only counts for controls without a text label, since label widths differ regardless of styling.
 */
export function isIndistinct(active, inactive) {
  const labelled = active._hasText || inactive._hasText
  return DISTINCTION_PROPS.filter((prop) => !(labelled && (prop === 'width' || prop === 'height'))).every((prop) => active[prop] === inactive[prop])
}

export function attributionIssues(snapshot) {
  if (!snapshot.present) return ['no default attribution link was found']
  const issues = []
  if (snapshot.fontSize < MIN_ATTRIBUTION_PX) issues.push(`text is ${snapshot.fontSize}px, under ${MIN_ATTRIBUTION_PX}px`)
  if (DEFAULT_LINK_COLORS.includes(snapshot.color)) issues.push(`uses the browser-default link color ${snapshot.color}`)
  if (snapshot.fontFamily === snapshot.defaultFontFamily) issues.push('uses the browser-default font family')
  return issues
}

/** Turns an in-page snapshot of one settled step into advisory warning lines. */
export function warningsForStep(step, snapshot) {
  const warnings = []
  for (const [a, b] of findOverlaps(snapshot.items)) {
    warnings.push(`WARN step ${step} overlap: ${a} overlaps ${b} (mark an intentional overlap with data-presentation-allow-overlap)`)
  }
  for (const group of snapshot.nav) {
    if (group.active && group.inactive && isIndistinct(group.active, group.inactive)) {
      warnings.push(`WARN step ${step} active-chrome: the active ${group.name} looks the same as inactive ones (style [data-presentation-active="true"])`)
    }
  }
  const issues = attributionIssues(snapshot.attribution)
  if (issues.length) {
    warnings.push(`WARN step ${step} attribution: ${issues.join('; ')} (style [data-presentation-attribution])`)
  }
  return warnings
}

/** Largest per-axis drift (px) between two samples that still counts as "not moving". */
export const SETTLE_DRIFT_PX = 0.5

/**
 * Entities whose content is not yet reliably on screen, from two samples taken a few frames apart.
 * sample: [{ id, hasContent, opacity, visible, rect: { x, y, width, height } }]
 * An entity is unsettled while it is moving, partly transparent, hidden, empty-sized, or newly mounted.
 */
export function unsettledEntities(before, after) {
  const earlier = new Map(before.map((entity) => [entity.id, entity]))
  const pending = []
  for (const entity of after) {
    const prior = earlier.get(entity.id)
    if (!prior) {
      pending.push(`${entity.id} (mounted since the previous sample)`)
      continue
    }
    const drift = ['x', 'y', 'width', 'height'].some((axis) => Math.abs(entity.rect[axis] - prior.rect[axis]) > SETTLE_DRIFT_PX)
    if (drift) pending.push(`${entity.id} (still moving)`)
    else if (entity.hasContent && (!entity.visible || entity.opacity < 0.999)) pending.push(`${entity.id} (content not yet visible)`)
    else if (entity.hasContent && (entity.rect.width <= 0 || entity.rect.height <= 0)) pending.push(`${entity.id} (no rendered size)`)
  }
  for (const id of earlier.keys()) if (!after.some((entity) => entity.id === id)) pending.push(`${id} (unmounted since the previous sample)`)
  return pending
}

/** Runs inside the page; must stay self-contained (it is serialised into the browser). */
export function collectSceneContent() {
  const opacityOf = (el) => {
    let opacity = 1
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity)
    return opacity
  }
  return [...document.querySelectorAll('[data-presentation-entity]')].map((el) => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return {
      id: el.getAttribute('data-presentation-entity'),
      hasContent: (el.textContent ?? '').trim() !== '' || el.querySelector('svg') !== null,
      opacity: opacityOf(el),
      visible: style.visibility !== 'hidden' && style.display !== 'none',
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    }
  })
}

/** Runs inside the page; must stay self-contained (it is serialised into the browser). */
export function collectSnapshot(props) {
  const root = document.querySelector('[data-presentation-root]')
  const visible = (el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    // hidden when it, or any ancestor, is not displayed or fully transparent
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return true
  }
  const textRect = (el) => {
    let box = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (!r.width || !r.height) continue
      box = box
        ? { x: Math.min(box.x, r.x), y: Math.min(box.y, r.y), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
        : { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
    }
    return box && { x: box.x, y: box.y, width: box.right - box.x, height: box.bottom - box.y }
  }
  const describe = (el) => {
    const owner = el.closest('[data-presentation-entity]')
    const hook = owner ? `[data-presentation-entity="${owner.getAttribute('data-presentation-entity')}"]` : el.getAttributeNames().find((n) => n.startsWith('data-presentation-')) ?? el.tagName.toLowerCase()
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return text ? `${hook} "${text}"` : hook
  }
  const elements = []
  if (root) {
    const controls = '[data-presentation-dot],[data-presentation-prev],[data-presentation-next],[data-presentation-toc-entry]'
    for (const el of root.querySelectorAll('*')) {
      if (!visible(el)) continue
      const box = el.matches(controls) ? el.getBoundingClientRect() : textRect(el)
      if (box) elements.push({ el, rect: { x: box.x, y: box.y, width: box.width, height: box.height } })
    }
  }
  const items = elements.map(({ el, rect }, i) => ({
    desc: describe(el),
    rect,
    allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    ancestors: elements.flatMap((other, j) => (j !== i && other.el.contains(el) ? [j] : [])),
  }))
  const style = (el) => ({ ...Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])), _hasText: el.textContent.trim().length > 0 })
  const group = (name, selector) => {
    const all = [...document.querySelectorAll(selector)].filter(visible)
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((el) => el !== active)
    return { name, active: active ? style(active) : null, inactive: inactive ? style(inactive) : null }
  }
  const link = document.querySelector('[data-presentation-attribution]')
  const frame = document.createElement('iframe')
  document.body.appendChild(frame)
  const probe = frame.contentDocument.createElement('a')
  probe.href = '#'
  frame.contentDocument.body.appendChild(probe)
  const defaultFontFamily = getComputedStyle(probe).fontFamily
  frame.remove()
  const linkStyle = link && getComputedStyle(link)
  return {
    items,
    nav: [group('progress indicator', '[data-presentation-dot]'), group('table-of-contents entry', '[data-presentation-toc-entry]')],
    attribution: {
      present: Boolean(link),
      fontSize: linkStyle ? parseFloat(linkStyle.fontSize) : 0,
      color: linkStyle?.color ?? '',
      fontFamily: linkStyle?.fontFamily ?? '',
      defaultFontFamily,
    },
  }
}
