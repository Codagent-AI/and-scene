// Runs inside Chromium; keep this function self-contained for page.evaluate.
export function inspectDocument() {
  const warnings = []
  const visible = element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  }
  const describe = e => `${e.tagName.toLowerCase()}${e.getAttribute('data-story-entity') ? `[${e.getAttribute('data-story-entity')}]` : ''}: ${e.textContent.trim().slice(0, 48)}`
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    if (!node.textContent.trim() || !parent || parent.closest('script,style,[data-allow-overlap="true"]') || !visible(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({ parent, rect })
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    if (a.parent === b.parent) continue
    const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (x > 1 && y > 1) warnings.push(`overlap ${describe(a.parent)} / ${describe(b.parent)}`)
  }
  const signature = element => {
    const s = getComputedStyle(element)
    return ['color','backgroundColor','borderBottomColor','borderBottomWidth','fontWeight','boxShadow','opacity','transform'].map(k => s[k]).join('|')
  }
  for (const nav of document.querySelectorAll('[data-presentation-progress],[data-presentation-toc]')) {
    const active = nav.querySelector('[data-presentation-active="true"]')
    const inactive = nav.querySelector('[data-presentation-active="false"]')
    if (active && inactive && visible(active) && signature(active) === signature(inactive)) warnings.push(`indistinct active chrome: ${nav.hasAttribute('data-presentation-toc') ? 'toc' : 'progress'}`)
  }
  const link = document.querySelector('[data-presentation-attribution] a')
  if (!link || !visible(link)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const s = getComputedStyle(link)
    if (parseFloat(s.fontSize) < 11 || (s.textDecorationLine.includes('underline') && ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color))) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return warnings
}
