import { cleanup, render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

afterEach(cleanup)
const root = path.resolve(import.meta.dirname, '../..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const kitFiles = walk(path.join(root, 'src/presentation-kit'))

describe('style ownership boundary', () => {
  it('ships no stylesheets and imports no CSS', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
    for (const f of kitFiles) expect(readFileSync(f, 'utf8')).not.toMatch(/import\s+['"][^'"]+\.css['"]/)
  })

  it('sets no visual style properties inline', () => {
    const visual = /\b(color|background(Color|Image)?|border(Radius|Color|Width)?|boxShadow|textShadow|fontFamily|fontSize|fontWeight|filter|outline)\s*:/
    for (const f of kitFiles) {
      const code = readFileSync(f, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n')
      expect(code, f).not.toMatch(visual)
    }
  })

  it('depends on no styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled-components|emotion|@mui|chakra|stitches/.test(d))).toEqual([])
    for (const f of kitFiles) expect(readFileSync(f, 'utf8')).not.toMatch(/tailwind|className=["'`]/i)
  })
})

describe('primitive hooks', () => {
  it('expose stable identity and data hooks, with caller class/data/style passed through', () => {
    const { container } = render(
      <SceneLayer>
        <Box key="b" id="b1" at={{ x: 10, y: 20, w: 30, h: 40 }} Icon={Star} className="mine" data-kind="k" style={{ zIndex: 3 }}>
          hi
        </Box>
        <Label key="l" id="l1">label</Label>
        <Frame key="f" id="f1" at={{ x: 0, y: 0, w: 5, h: 5 }} label="lbl" />
        <Emphasis key="e" id="e1" at={{ x: 0, y: 0, w: 5, h: 5 }} />
        <SymbolChip key="s" id="s1" symbol="?" />
        <Arrow key="a" id="a1" from={{ x: 0, y: 0 }} to={{ x: 10, y: 10 }} bidirectional />
      </SceneLayer>,
    )
    const box = container.querySelector<HTMLElement>('[data-presentation-id="b1"]')!
    expect(box.getAttribute('data-presentation-node')).toBe('box')
    expect(box.className).toBe('mine')
    expect(box.getAttribute('data-kind')).toBe('k')
    expect(box.style.left).toBe('10px')
    expect(box.style.width).toBe('30px')
    expect(box.style.zIndex).toBe('3')
    expect(box.querySelector('[data-presentation-glyph]')).not.toBeNull()
    const kinds = [...container.querySelectorAll('[data-presentation-node]')].map((n) => n.getAttribute('data-presentation-node'))
    expect(kinds.sort()).toEqual(['arrow', 'box', 'emphasis', 'frame', 'label', 'symbol-chip'])
    expect(container.querySelector('[data-presentation-frame-label]')?.textContent).toBe('lbl')
    expect(container.querySelector('[data-presentation-symbol]')?.textContent).toBe('?')
  })

  it('supports coordinate-heavy diagrams with raw elements alongside primitives', () => {
    const { container } = render(
      <SceneLayer>
        <Appear key="x">
          <Box id="x" at={{ x: 1, y: 2 }} />
        </Appear>
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-appear] [data-presentation-id="x"]')).not.toBeNull()
  })

  it('draws no unstyled fallbacks for color, border or shadow', () => {
    const { container } = render(<Box id="plain" at={{ x: 0, y: 0, w: 10, h: 10 }}>x</Box>)
    const s = container.querySelector<HTMLElement>('[data-presentation-id="plain"]')!.style
    for (const p of ['color', 'background', 'border', 'boxShadow', 'fontFamily']) {
      expect(s.getPropertyValue(p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))).toBe('')
    }
  })
})
