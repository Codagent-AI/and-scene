import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { entities } from '../src/presentations/how-to-make-a-presentation/entities'
const font = readFileSync(new NodeURL('../src/presentations/how-to-make-a-presentation/fonts/LiberationSans-Regular.ttf', import.meta.url))
// Read the static TrueType asset's Unicode BMP map and horizontal advances.
// This tests the shipped face, not the host's canvas or installed font fallback.
function table(tag: string) {
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const entry = 12 + i * 16
    if (font.toString('ascii', entry, entry + 4) === tag) return font.readUInt32BE(entry + 8)
  }
  throw new Error(`Missing font table ${tag}`)
}
const cmap = table('cmap')
const unicodeMaps = Array.from({ length: font.readUInt16BE(cmap + 2) }, (_, i) => cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4))
const unicode = unicodeMaps.find(offset => font.readUInt16BE(offset) === 4)!
const segments = font.readUInt16BE(unicode + 6) / 2
const ends = unicode + 14, starts = ends + 2 * segments + 2, deltas = starts + 2 * segments, ranges = deltas + 2 * segments
function glyph(code: number) {
  for (let i = 0; i < segments; i++) {
    if (code < font.readUInt16BE(starts + i * 2) || code > font.readUInt16BE(ends + i * 2)) continue
    const delta = font.readInt16BE(deltas + i * 2), range = font.readUInt16BE(ranges + i * 2)
    if (!range) return (code + delta) & 0xffff
    const index = font.readUInt16BE(ranges + i * 2 + range + 2 * (code - font.readUInt16BE(starts + i * 2)))
    return index ? (index + delta) & 0xffff : 0
  }
  return 0
}
const unitsPerEm = font.readUInt16BE(table('head') + 18)
const metrics = font.readUInt16BE(table('hhea') + 34), advances = table('hmtx')
function advance(text: string, size: number) {
  return [...text].reduce((width, character) => width + font.readUInt16BE(advances + Math.min(glyph(character.codePointAt(0)!), metrics - 1) * 4), 0) * size / unitsPerEm
}
let stylesheet: HTMLStyleElement
beforeEach(() => {
  stylesheet = document.createElement('style')
  stylesheet.textContent = readFileSync(new NodeURL('../src/presentations/how-to-make-a-presentation/presentation.css', import.meta.url), 'utf8')
  document.head.append(stylesheet)
})
afterEach(() => { cleanup(); stylesheet.remove() })
it('R5 every scene glyph is present in the bundled font instead of an OS fallback', () => {
  for (const entity of entities) for (const line of [entity.label, ...('detail' in entity ? entity.detail : [])]) for (const character of line) {
    expect(glyph(character.codePointAt(0)!), `${entity.id}: ${character}`).toBeGreaterThan(0)
  }
})
it('R5 the actual scene stylesheet selects the bundled face for all text owners', () => {
  const { container } = render(<div className="skill-story"><Scene payload={{ beat: 9 }} /></div>)
  const face = [...stylesheet.sheet!.cssRules].find(rule => rule.type === 5) as CSSFontFaceRule
  expect(face.style.getPropertyValue('font-family')).toContain('And Scene Sans')
  expect(face.style.getPropertyValue('src')).toContain('fonts/LiberationSans-Regular.ttf')
  for (const owner of container.querySelectorAll('[data-entity], [data-entity] > small')) expect(getComputedStyle(owner).fontFamily).toContain('And Scene Sans')
})
it('R5 shipped font advances leave headroom in critical nowrap labels', () => {
  const { container } = render(<div className="skill-story"><Scene payload={{ beat: 9 }} /></div>)
  for (const element of container.querySelectorAll('[data-entity] > span, [data-entity] > small')) {
    const id = element.parentElement!.getAttribute('data-entity')!
    const entity = entities.find(entity => entity.id === id)!
    const size = parseFloat(getComputedStyle(element).fontSize) || parseFloat(getComputedStyle(element.parentElement!).fontSize)
    const width = advance(element.textContent!, size) + (element.querySelector('.scene-symbol') ? 24 : 0)
    const critical = id.startsWith('card-') || id === 'depth' || id === 'verify'
    expect(width, `${id}/${element.textContent}`).toBeLessThanOrEqual(critical ? (entity.w - 2) * .9 : entity.w - 4)
  }
})
