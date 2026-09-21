import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain-JS inspection helper shared with the browser-side script
import { diagnose } from '../scripts/diagnose.mjs'

type Rect = { left: number; top: number; right: number; bottom: number }
type Style = { color?: string; backgroundColor?: string; visibility?: string; fontSize?: string }
type Node = { selectors: string[]; className: string; rect: Rect; style?: Style; allowedBy?: Node }

const style = (node: Node) => ({ color: 'rgb(1, 1, 1)', backgroundColor: 'rgb(2, 2, 2)', visibility: 'visible', fontSize: '14px', ...node.style })

function element(node: Node) {
  const self = {
    className: node.className,
    getBoundingClientRect: () => ({ ...node.rect, width: node.rect.right - node.rect.left, height: node.rect.bottom - node.rect.top }),
    closest: (selector: string) => (selector === '[data-presentation-overlap-allowed]' && node.allowedBy ? element(node.allowedBy) : null),
    node,
  }
  return self
}

function fixture(nodes: Node[]) {
  const matches = (node: Node, selector: string) => selector.split(',').map((part) => part.trim()).some((part) => node.selectors.includes(part))
  const doc = {
    querySelectorAll: (selector: string) => nodes.filter((node) => matches(node, selector)).map(element),
    querySelector: (selector: string) => {
      const found = nodes.find((node) => matches(node, selector))
      return found ? element(found) : null
    },
  }
  const computedStyle = (target: { node: Node }) => style(target.node)
  return { doc, computedStyle }
}

const caption = (rect: Rect, extra: Partial<Node> = {}): Node => ({ selectors: ['[data-presentation-caption]'], className: 'caption', rect, ...extra })
const chrome = (rect: Rect, extra: Partial<Node> = {}): Node => ({ selectors: ['[data-presentation-controls]'], className: 'controls', rect, ...extra })
const activeChrome: Node = { selectors: ['[data-presentation-progress-item][aria-current="step"]'], className: 'progress active', rect: { left: 0, top: 500, right: 20, bottom: 510 } }
const inactiveChrome: Node = { selectors: ['[data-presentation-progress-item]:not([aria-current="step"])'], className: 'progress', rect: { left: 30, top: 500, right: 50, bottom: 510 }, style: { color: 'rgb(9, 9, 9)', backgroundColor: 'rgb(8, 8, 8)' } }
const attribution: Node = { selectors: ['[data-presentation-attribution]'], className: 'attribution', rect: { left: 700, top: 700, right: 800, bottom: 715 } }

function run(nodes: Node[]) {
  const { doc, computedStyle } = fixture([...nodes, activeChrome, inactiveChrome, attribution])
  return diagnose(0, doc, computedStyle) as string[]
}

describe('inspection diagnostics contract', () => {
  it('reports unmarked overlap between visible text and chrome', () => {
    const warnings = run([caption({ left: 0, top: 0, right: 100, bottom: 50 }), chrome({ left: 50, top: 20, right: 150, bottom: 70 })])
    expect(warnings).toEqual([expect.stringContaining('overlap')])
    expect(warnings[0]).toContain('step 1')
  })

  it('exempts overlap only through the explicit allow-overlap marker', () => {
    const tray: Node = { selectors: ['[data-presentation-overlap-allowed]'], className: 'tray', rect: { left: 0, top: 0, right: 200, bottom: 100 } }
    const warnings = run([caption({ left: 0, top: 0, right: 100, bottom: 50 }, { allowedBy: tray }), chrome({ left: 50, top: 20, right: 150, bottom: 70 }, { allowedBy: tray })])
    expect(warnings).toEqual([])
  })

  it('does not exempt overlap for presentation-specific class names', () => {
    const warnings = run([caption({ left: 0, top: 0, right: 100, bottom: 50 }, { className: 'how-to-arrow' }), chrome({ left: 50, top: 20, right: 150, bottom: 70 }, { className: 'how-to-reveal' })])
    expect(warnings).toEqual([expect.stringContaining('overlap')])
  })

  it('ignores elements with no painted box', () => {
    const warnings = run([caption({ left: 0, top: 0, right: 0, bottom: 0 }), chrome({ left: 50, top: 20, right: 150, bottom: 70 })])
    expect(warnings).toEqual([])
  })

  it('reports indistinct active navigation chrome', () => {
    const { doc, computedStyle } = fixture([activeChrome, { ...inactiveChrome, style: undefined }, attribution])
    expect(diagnose(2, doc, computedStyle)).toEqual([expect.stringContaining('visually indistinct')])
  })

  it('reports undersized or browser-default attribution', () => {
    const { doc, computedStyle } = fixture([activeChrome, inactiveChrome, { ...attribution, style: { fontSize: '9px' } }])
    expect(diagnose(0, doc, computedStyle)).toEqual([expect.stringContaining('attribution')])
  })

  it('reports missing active state and missing attribution', () => {
    const { doc, computedStyle } = fixture([])
    expect(diagnose(0, doc, computedStyle)).toEqual([expect.stringContaining('active navigation state is missing'), expect.stringContaining('attribution is missing')])
  })
})
