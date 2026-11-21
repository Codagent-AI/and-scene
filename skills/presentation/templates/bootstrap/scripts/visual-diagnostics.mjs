const browserDefaultLinkColors = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])

export function diagnoseVisualEvidence({ elements, navigation, attribution }) {
  const warnings = []

  for (let index = 0; index < elements.length; index += 1) {
    const first = elements[index]
    for (let other = index + 1; other < elements.length; other += 1) {
      const second = elements[other]
      if (first.ancestors.includes(second.id) || second.ancestors.includes(first.id)) continue
      if (first.id === second.id) continue

      const left = Math.max(first.rect.left, second.rect.left)
      const right = Math.min(first.rect.right, second.rect.right)
      const top = Math.max(first.rect.top, second.rect.top)
      const bottom = Math.min(first.rect.bottom, second.rect.bottom)
      if (right - left > 1 && bottom - top > 1) {
        warnings.push(`overlap between ${first.label} and ${second.label}`)
      }
    }
  }

  for (const { label, active, inactive } of navigation) {
    if (active !== undefined && inactive.includes(active)) {
      warnings.push(`indistinct active ${label}`)
    }
  }

  if (!attribution) {
    warnings.push('missing attribution; check [data-presentation-attribution]')
  } else {
    const { fontSize, color, decoration } = attribution
    if (fontSize < 10) {
      warnings.push(`undersized attribution (${fontSize}px); style [data-presentation-attribution]`)
    }
    if (browserDefaultLinkColors.has(color) && decoration.includes('underline')) {
      warnings.push('browser-default attribution; style [data-presentation-attribution]')
    }
  }

  return [...new Set(warnings)]
}

// This function executes inside the preview page and has no module dependencies.
export function collectVisualEvidence() {
  const { document, innerHeight, innerWidth, NodeFilter, SVGElement } = globalThis
  const host = document.querySelector('[data-presentation]')
  const chromeHooks = [
    'caption', 'title', 'step-title', 'marker', 'brand', 'attribution',
    'progress-item', 'toc-item', 'prev', 'next', 'mode-toggle',
  ]
  const ids = new Map()
  const elements = []

  function idFor(element) {
    if (!ids.has(element)) ids.set(element, ids.size)
    return ids.get(element)
  }

  function visible(element) {
    if (!element) return false

    for (let parent = element; parent; parent = parent.parentElement) {
      const style = globalThis.getComputedStyle(parent)
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) <= 0.01) {
        return false
      }
    }
    return true
  }

  function add(element, rects, label) {
    if (element.closest('[data-presentation-allow-overlap]') || !visible(element)) return
    const ancestors = []
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      ancestors.push(idFor(parent))
    }
    for (const box of rects) {
      const rect = {
        left: Math.max(0, box.left), top: Math.max(0, box.top),
        right: Math.min(innerWidth, box.right), bottom: Math.min(innerHeight, box.bottom),
      }
      if (rect.right <= rect.left || rect.bottom <= rect.top) continue
      elements.push({ id: idFor(element), ancestors, rect, label })
    }
  }

  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const value = text.textContent.replace(/\s+/g, ' ').trim()
    const element = text.parentElement
    if (!value || !element || element.closest('title, desc, script, style')) continue
    const label = `text "${value.slice(0, 64)}"`
    if (element instanceof SVGElement) {
      add(element, [element.getBoundingClientRect()], label)
      continue
    }
    const range = document.createRange()
    range.selectNodeContents(text)
    add(element, range.getClientRects(), label)
  }

  for (const hook of chromeHooks) {
    for (const element of host.querySelectorAll(`[data-presentation-${hook}]`)) {
      const text = element.getAttribute('aria-label') ?? element.textContent.trim()
      add(element, [element.getBoundingClientRect()], `[data-presentation-${hook}]${text ? ` "${text.slice(0, 40)}"` : ''}`)
    }
  }

  const visualProperties = [
    'backgroundColor', 'backgroundImage', 'boxShadow', 'color', 'fill',
    'fontSize', 'fontStyle', 'fontWeight', 'opacity', 'outlineColor', 'outlineStyle',
    'outlineWidth', 'stroke', 'textDecorationLine', 'textDecorationColor', 'textShadow',
    'borderBottomColor', 'borderBottomStyle', 'borderBottomWidth',
    'borderLeftColor', 'borderLeftStyle', 'borderLeftWidth',
    'borderRightColor', 'borderRightStyle', 'borderRightWidth',
    'borderTopColor', 'borderTopStyle', 'borderTopWidth', 'borderRadius',
    'filter', 'transform', 'scale',
  ]

  function signature(element) {
    if (!element) return undefined
    return [null, '::before', '::after'].map((pseudo) => {
      const style = globalThis.getComputedStyle(element, pseudo)
      if (pseudo && ['none', 'normal'].includes(style.content)) return ''
      return visualProperties.map((property) => style[property]).join(';')
    }).join('|')
  }

  const navigationHooks = [['progress-item', 'progress indicator'], ['toc-item', 'table-of-contents entry']]
  const navigation = navigationHooks.map(([hook, label]) => {
    const controls = [...host.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = controls.find((control) => control.getAttribute('data-presentation-active') === 'true')
    return {
      label,
      active: signature(active),
      inactive: controls.filter((control) => control !== active).map(signature),
    }
  })

  const link = host.querySelector('[data-presentation-attribution]')
  const linkStyle = visible(link) && globalThis.getComputedStyle(link)
  const attribution = linkStyle ? {
    fontSize: Number.parseFloat(linkStyle.fontSize),
    color: linkStyle.color,
    decoration: linkStyle.textDecorationLine,
  } : null

  return { elements, navigation, attribution }
}
