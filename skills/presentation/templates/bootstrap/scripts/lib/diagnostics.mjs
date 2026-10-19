// Advisory visual diagnostics. `collectSnapshot` runs inside the page and is
// self-contained; `analyzeSnapshot` is pure so it can be unit-tested.

export const MIN_ATTRIBUTION_PX = 11
export const BROWSER_DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'

/* c8 ignore start -- executed in the browser; exercised by the inspect integration test */
export function collectSnapshot(doc, win) {
  const CHROME_SELECTOR = [
    '[data-presentation-progress-dot]',
    '[data-presentation-toc-entry]',
    '[data-presentation-prev]',
    '[data-presentation-next]',
    '[data-presentation-mode-toggle]',
    '[data-presentation-attribution]',
  ].join(',')
  const STYLE_KEYS = [
    'backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'width', 'height',
    'fontWeight', 'textDecorationLine', 'opacity', 'boxShadow', 'outlineStyle', 'transform',
  ]

  const visible = (el, rect) => {
    const style = win.getComputedStyle(el)
    return (
      rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
      style.visibility !== 'hidden' && Number(style.opacity) > 0
    )
  }
  const pathOf = (el) => {
    const parts = []
    for (let node = el; node && node !== doc.body; node = node.parentElement) {
      parts.unshift(Array.prototype.indexOf.call(node.parentElement.children, node))
    }
    return parts.join('/')
  }
  const describe = (el) => {
    const hook = el.getAttributeNames().find((name) => name.startsWith('data-presentation-'))
    const entity = el.getAttribute('data-presentation-entity')
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    const name = entity ? `[data-presentation-entity=${entity}]` : hook ? `[${hook}]` : el.tagName.toLowerCase()
    return text ? `${name} "${text}"` : name
  }
  const textRect = (el) => {
    const range = doc.createRange()
    range.selectNodeContents(el)
    const r = range.getBoundingClientRect()
    return r
  }

  const elements = []
  const seen = new Set()
  const add = (el, rect) => {
    if (seen.has(el)) return
    seen.add(el)
    elements.push({
      label: describe(el),
      path: pathOf(el),
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      allow: el.closest('[data-presentation-allow-overlap]') !== null,
    })
  }
  for (const el of doc.body.querySelectorAll('*')) {
    const ownText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())
    if (ownText) {
      const rect = textRect(el)
      if (visible(el, rect)) add(el, rect)
    } else if (el.matches(CHROME_SELECTOR)) {
      const rect = el.getBoundingClientRect()
      if (visible(el, rect)) add(el, rect)
    }
  }

  const signature = (el) => {
    const style = win.getComputedStyle(el)
    return Object.fromEntries(STYLE_KEYS.map((key) => [key, style[key]]))
  }
  const activeChrome = (selector) => {
    const items = Array.from(doc.querySelectorAll(selector))
    const active = items.find((el) => el.hasAttribute('aria-current'))
    return items.length === 0 || !active
      ? null
      : { active: signature(active), inactive: items.filter((el) => el !== active).map(signature) }
  }

  const link = doc.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const rect = link.getBoundingClientRect()
    const style = win.getComputedStyle(link)
    attribution = {
      visible: visible(link, rect),
      fontSize: parseFloat(style.fontSize),
      color: style.color,
      textDecorationLine: style.textDecorationLine,
    }
  }

  return {
    elements,
    progress: activeChrome('[data-presentation-progress-dot]'),
    toc: activeChrome('[data-presentation-toc-entry]'),
    attribution,
  }
}
/* c8 ignore stop */

const intersects = (a, b) =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1

/** True when `a` is an ancestor of `b` in the DOM. */
const isAncestor = (a, b) => b.path.startsWith(`${a.path}/`)

function overlapWarnings(elements, step) {
  const warnings = []
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]
      if (a.allow || b.allow) continue
      if (isAncestor(a, b) || isAncestor(b, a)) continue
      if (!intersects(a.rect, b.rect)) continue
      warnings.push({
        step,
        kind: 'overlap',
        message: `${a.label} overlaps ${b.label}; fix the collision or mark an intentional overlap with data-presentation-allow-overlap`,
      })
    }
  }
  return warnings
}

function sameSignature(a, b) {
  return Object.keys(a).every((key) => a[key] === b[key])
}

function indistinct(chrome) {
  if (!chrome || chrome.inactive.length === 0) return false
  const tally = new Map()
  for (const sig of chrome.inactive) {
    const key = JSON.stringify(sig)
    tally.set(key, (tally.get(key) ?? 0) + 1)
  }
  const [modal] = [...tally.entries()].sort((x, y) => y[1] - x[1])
  return sameSignature(chrome.active, JSON.parse(modal[0]))
}

/** Advisory warnings for one settled step; never affects pass/fail. */
export function analyzeSnapshot(snapshot, step) {
  const warnings = overlapWarnings(snapshot.elements, step)
  for (const [name, chrome, hook] of [
    ['progress indicator', snapshot.progress, '[data-presentation-progress-dot][data-presentation-active]'],
    ['table-of-contents entry', snapshot.toc, '[data-presentation-toc-entry][data-presentation-active]'],
  ]) {
    if (indistinct(chrome)) {
      warnings.push({
        step,
        kind: 'active-chrome',
        message: `active ${name} looks the same as inactive ones; style ${hook} (or [aria-current]) in presentation CSS`,
      })
    }
  }
  const attribution = snapshot.attribution
  const hint = 'style [data-presentation-attribution] in presentation CSS or pass the attribution option'
  if (!attribution || !attribution.visible) {
    warnings.push({ step, kind: 'attribution', message: `attribution is missing or hidden; ${hint}` })
  } else {
    if (attribution.fontSize < MIN_ATTRIBUTION_PX) {
      warnings.push({ step, kind: 'attribution', message: `attribution text is ${attribution.fontSize}px (under ${MIN_ATTRIBUTION_PX}px); ${hint}` })
    }
    if (attribution.color === BROWSER_DEFAULT_LINK_COLOR && attribution.textDecorationLine.includes('underline')) {
      warnings.push({ step, kind: 'attribution', message: `attribution uses the browser-default link style; ${hint}` })
    }
  }
  return warnings
}

export function formatWarning(warning) {
  return `WARN step ${String(warning.step).padStart(2, '0')} [${warning.kind}]: ${warning.message}`
}
