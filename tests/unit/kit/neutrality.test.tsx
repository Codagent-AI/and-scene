import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../src/presentation-kit/index.ts'
import { makeSteps } from '../helpers/fixtures.tsx'
import { scanDir, scanSource, walk } from '../helpers/styleScan.ts'

vi.mock('motion/react', async () => (await import('../helpers/motionMock.tsx')).motionModule)

const KIT = 'src/presentation-kit'

/** Geometry and motion properties the kit may set inline (ruled style-neutrality boundary). */
const ALLOWED_INLINE = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'overflow', 'pointer-events',
  'transform', 'transform-origin', 'scale', 'x', 'y', 'z-index', 'display', 'opacity', 'inset',
])

describe('style neutrality (L-10)', () => {
  it('declares no look in any kit source or stylesheet', () => {
    expect(scanDir(KIT)).toEqual([])
  })

  it('the scanner flags look-supplying declarations and framework references', () => {
    const bad = scanSource('x.css', 'a { color: red; border: 1px solid; box-shadow: 0 0 3px; --accent: #fff; padding: 4px }')
    expect(bad.map((f) => f.match)).toEqual(expect.arrayContaining(['color:', 'border:', 'box-shadow:', 'padding:', '--accent:']))
    expect(scanSource('x.ts', "import 'tailwindcss'").length).toBeGreaterThan(0)
    expect(scanSource('x.css', 'a { margin: 0; color: currentColor; background: transparent; border: none }')).toEqual([])
  })

  it('imports no stylesheet and no styling framework', () => {
    for (const file of walk(KIT, (f) => /\.(ts|tsx)$/.test(f))) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
    }
  })

  it('requires no styling framework at the root', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|styled|emotion|bootstrap|unocss/.test(n))).toEqual([])
    expect(readFileSync('vite.config.ts', 'utf8')).not.toMatch(/tailwind/i)
  })

  it('renders every primitive and chrome part with geometry-only inline styles', () => {
    const { container } = render(
      <>
        <Presentation steps={makeSteps(3)} title="T" />
        <SceneLayer>
          <Box rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          <Label rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          <Frame rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          <Emphasis rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          <SymbolChip rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          <Arrow from={{ x: 0, y: 0 }} to={{ x: 1, y: 1 }} />
        </SceneLayer>
      </>,
    )
    const used = new Set<string>()
    for (const el of container.querySelectorAll<HTMLElement>('*')) {
      for (const prop of Array.from(el.style)) used.add(prop)
    }
    expect([...used].filter((p) => !ALLOWED_INLINE.has(p))).toEqual([])
  })

  it('leaves primitives without default spacing, class names or look attributes', () => {
    const { container } = render(<Box>x</Box>)
    const el = container.firstElementChild!
    expect(el.className).toBe('')
    expect(el.getAttribute('style')).toBeNull()
  })
})
