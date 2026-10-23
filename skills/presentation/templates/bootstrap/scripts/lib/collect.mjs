/**
 * Runs inside the page. Collects visible text/chrome boxes and styles for the
 * advisory diagnostics. Kept dependency-free so it can be serialized.
 */
export function collectSnapshot() {
  const ALLOW = 'data-presentation-allow-overlap'
  const CHROME = [
    '[data-presentation-marker]', '[data-presentation-era]', '[data-presentation-title]',
    '[data-presentation-caption]', '[data-presentation-progress-item]', '[data-presentation-prev]',
    '[data-presentation-next]', '[data-presentation-toc-entry]', '[data-presentation-mode-toggle]',
    '[data-presentation-attribution]',
  ].join(',')

  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.value !== '' && !/^(active|step|scale)/.test(a.name.slice(18)))
    const tag = el.tagName.toLowerCase()
    const suffix = hook ? `[${hook.name}="${hook.value}"]` : [...el.attributes].filter((a) => a.name.startsWith('data-presentation-')).map((a) => `[${a.name}]`).slice(0, 1).join('')
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `${tag}${suffix}${text ? ` "${text}"` : ''}`
  }
  const visible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') return false
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (Number(getComputedStyle(n).opacity) < 0.05) return false
    }
    return true
  }
  const textRect = (el) => {
    const range = document.createRange()
    let rect = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) {
        rect = rect
          ? { left: Math.min(rect.left, r.left), top: Math.min(rect.top, r.top), right: Math.max(rect.right, r.right), bottom: Math.max(rect.bottom, r.bottom) }
          : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
      }
    }
    return rect
  }

  const candidates = new Set(document.querySelectorAll(CHROME))
  for (const el of document.body.querySelectorAll('*')) {
    if ([...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) candidates.add(el)
  }
  const list = [...candidates].filter((el) => visible(el))
  const keys = new Map(list.map((el, i) => [el, i]))
  const items = []
  for (const el of list) {
    const own = textRect(el)
    const b = el.getBoundingClientRect()
    const rect = own ?? { left: b.left, top: b.top, right: b.right, bottom: b.bottom }
    if (rect.right - rect.left <= 0 || rect.bottom - rect.top <= 0) continue
    const ancestors = []
    for (let n = el.parentElement; n; n = n.parentElement) if (keys.has(n)) ancestors.push(keys.get(n))
    items.push({ key: keys.get(el), label: describe(el), rect, allowed: !!el.closest(`[${ALLOW}]`), ancestors })
  }

  const style = (el) => {
    const cs = getComputedStyle(el)
    return {
      color: cs.color, backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth, opacity: cs.opacity, fontWeight: cs.fontWeight,
      transform: cs.transform, width: cs.width, height: cs.height,
    }
  }
  const chromeGroup = (name, selector) => {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((el) => el !== active)
    return { name, active: active && inactive ? style(active) : null, inactive: active && inactive ? style(inactive) : null }
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  const acs = attr && getComputedStyle(attr)
  const root = document.querySelector('[data-step-index]')
  return {
    index: Number(root?.getAttribute('data-step-index') ?? -1),
    title: document.querySelector('[data-presentation-title]')?.textContent ?? '',
    items,
    activeChrome: [
      chromeGroup('progress indicator', '[data-presentation-progress-item]'),
      chromeGroup('table-of-contents entry', '[data-presentation-toc-entry]'),
    ],
    attribution: attr ? { fontSize: parseFloat(acs.fontSize), color: acs.color, textDecorationLine: acs.textDecorationLine } : null,
    runningAnimations: document.getAnimations().filter((a) => a.playState === 'running').length,
  }
}
