import { beforeEach, it, expect } from 'vitest'
import { diagnose } from '../scripts/diagnostics.mjs'
function rect(element: Element, x = 0, y = 0, width = 100, height = 20) { element.getBoundingClientRect = () => ({ x, y, width, height, top: y, left: x, right: x + width, bottom: y + height, toJSON() {} }) }
beforeEach(() => { document.body.innerHTML = '<main data-presentation-root data-step-index="2"><div data-presentation-attribution><a style="color: rgb(70, 70, 70); font-size: 12px" href="#">made by and-scene</a></div></main>'; for (const e of document.querySelectorAll('*')) rect(e, 500, 500) })
it('I-50 visible collisions identify step and texts while marked subtrees and hidden elements are exempt', () => {
  const root = document.querySelector('main')!; root.insertAdjacentHTML('beforeend', '<span>A</span><span>B</span><div data-presentation-allow-overlap><span>allowed one</span><span>allowed two</span></div><span style="visibility:hidden">hidden</span>')
  for (const e of root.querySelectorAll('span')) rect(e)
  const warnings = diagnose(); expect(warnings).toContain('step 2: overlap: A / B'); expect(warnings.join('\n')).not.toContain('allowed'); expect(warnings.join('\n')).not.toContain('hidden')
})
it('I-51 indistinct progress and ToC and missing small or default attribution are diagnosed', () => {
  const root = document.querySelector('main')!; for (const hook of ['progress', 'toc']) root.insertAdjacentHTML('beforeend', `<nav data-presentation-${hook}><button data-presentation-active="true">Active</button><button data-presentation-active="false">Other</button></nav>`)
  for (const e of root.querySelectorAll('button')) rect(e, 200, 100)
  const warnings = diagnose(); expect(warnings.some((x: string) => x.includes('indistinct active progress'))).toBe(true); expect(warnings.some((x: string) => x.includes('indistinct active toc'))).toBe(true)
  const link = root.querySelector('a')!; link.style.fontSize = '9px'; expect(diagnose().join('\n')).toContain('unpolished attribution'); link.style.fontSize = '12px'; link.style.color = 'rgb(0, 0, 238)'; expect(diagnose().join('\n')).toContain('unpolished attribution'); link.remove(); expect(diagnose().join('\n')).toContain('missing attribution')
})
it('I-51 distinct active chrome and legible local attribution avoid polish warnings', () => {
  const root = document.querySelector('main')!; root.insertAdjacentHTML('beforeend', '<nav data-presentation-progress><button style="background:rgb(90,40,140);color:rgb(255,255,255)" data-presentation-active="true">Active</button><button data-presentation-active="false">Other</button></nav>'); for (const e of root.querySelectorAll('button')) rect(e, e.textContent === 'Active' ? 100 : 300, 100)
  expect(diagnose().join('\n')).not.toContain('indistinct'); expect(diagnose().join('\n')).not.toContain('attribution')
})
it('I-50 icon-only navigation and graphical progress collide as atomic chrome targets', () => {
  const root = document.querySelector('main')!
  root.insertAdjacentHTML('beforeend', '<span id="icon-content">icon content</span><nav data-presentation-navigation><button aria-label="Icon next"><svg aria-hidden="true"><path /></svg></button></nav><span id="progress-content">progress content</span><nav data-presentation-progress><span data-presentation-active="true" aria-label="Graphical step"></span></nav><nav data-presentation-navigation data-presentation-allow-overlap><button aria-label="Allowed icon"><svg /></button><span>allowed chrome</span></nav><nav data-presentation-navigation style="opacity:0"><button aria-label="Hidden icon"><svg /></button></nav>')
  for (const e of root.querySelectorAll('button,svg,#icon-content,[data-presentation-allow-overlap] span')) rect(e)
  rect(root.querySelector('#progress-content')!, 200, 0)
  rect(root.querySelector('[aria-label="Graphical step"]')!, 200, 0, 24, 24)
  const overlaps = diagnose().filter((w: string) => w.includes('overlap:'))
  expect(overlaps).toHaveLength(2)
  expect(overlaps.some((w: string) => w.includes('step 2:') && w.includes('icon content') && w.includes('Icon next'))).toBe(true)
  expect(overlaps.some((w: string) => w.includes('step 2:') && w.includes('progress content') && w.includes('Graphical step'))).toBe(true)
  expect(overlaps.join('\n')).not.toMatch(/Allowed icon|allowed chrome|Hidden icon/)
})
it('R3 zero-size canvas warns instead of silently disappearing from diagnostics', () => {
  const canvas = document.createElement('div'); canvas.setAttribute('data-presentation-canvas', '')
  document.querySelector('main')!.append(canvas)
  rect(canvas, 0, 0, 0, 0)
  expect(diagnose()).toContain('step 2: zero-size canvas; provide a positive viewport and inspect stage fit')
  rect(canvas, 0, 0, 200, 80)
  expect(diagnose().some((warning: string) => warning.includes('zero-size canvas'))).toBe(false)
})
