// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { diagnosePresentation } from '../scripts/inspection-diagnostics.mjs'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
function addNode(name: string, left: number, top: number, allow = false) {
  const wrapper = document.createElement('div')
  if (allow) wrapper.setAttribute('data-presentation-allow-overlap', '')
  const node = document.createElement('div')
  node.setAttribute('data-presentation-node', 'box')
  node.className = name
  node.textContent = name
  Object.defineProperty(node, 'innerText', { get: () => node.textContent })
  wrapper.append(node)
  document.body.append(wrapper)
  vi.spyOn(node, 'getClientRects').mockReturnValue([{ } as DOMRect])
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ left, top, right: left + 20, bottom: top + 20 } as DOMRect)
  return node
}
function addAttribution(size = '12px') {
  const link = document.createElement('a')
  link.setAttribute('data-presentation-attribution', '')
  link.textContent = 'made by and-scene'
  link.style.fontSize = size
  document.body.append(link)
  vi.spyOn(link, 'getClientRects').mockReturnValue([{} as DOMRect])
  return link
}

describe('presentation inspection diagnostics (INT-002)', () => {
  it('reports unmarked text overlap and exempts only the explicitly marked subtree', () => {
    addNode('unmarked', 10, 10)
    addNode('colliding', 15, 15)
    addNode('intentional-a', 50, 50, true)
    addNode('intentional-b', 55, 55)
    addAttribution()
    const warnings = diagnosePresentation()
    expect(warnings).toContain('possible overlap: box / box')
    expect(warnings).not.toContainEqual(expect.stringContaining('intentional'))
    expect(warnings).not.toContain('missing attribution; style [data-presentation-attribution]')
  })

  it('reports visually indistinct active navigation and undersized attribution', () => {
    const active = document.createElement('button')
    active.setAttribute('data-presentation-progress-item', '')
    active.setAttribute('aria-current', 'step')
    const inactive = document.createElement('button')
    inactive.setAttribute('data-presentation-progress-item', '')
    document.body.append(active, inactive)
    vi.spyOn(active, 'getClientRects').mockReturnValue([{} as DOMRect])
    vi.spyOn(inactive, 'getClientRects').mockReturnValue([{} as DOMRect])
    addAttribution('9px')
    const warnings = diagnosePresentation()
    expect(warnings).toContain('active navigation may be visually indistinct')
    expect(warnings).toContain('attribution may be browser-default or undersized; style [data-presentation-attribution]')
  })
})
