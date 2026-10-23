import { render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip, type Step } from '../../src/presentation-kit'
import { listFiles } from '../../scripts/sync-templates.mjs'
import { setViewport } from '../helpers/fixtures'
import { ROOT } from '../helpers/spec-outline'

const KIT = path.join(ROOT, 'src/presentation-kit')
const kitFiles = listFiles(KIT)
const read = (rel: string) => readFileSync(path.join(KIT, rel), 'utf8')

describe('kit source is style-neutral', () => {
  it('has only TypeScript sources: no CSS files or stylesheet imports', () => {
    expect(kitFiles.length).toBeGreaterThan(15)
    for (const f of kitFiles) {
      expect(f, f).toMatch(/\.(ts|tsx)$/)
      expect(read(f), f).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
    }
  })

  const forbidden: [string, RegExp][] = [
    ['visual style property', /\b(?:color|backgroundColor|background|borderColor|borderWidth|borderStyle|borderRadius|border|boxShadow|textShadow|fontFamily|fontSize|fontWeight|lineHeight|padding\w*|margin\w*|gap|filter|outline)\s*:/],
    ['hex colour', /#[0-9a-fA-F]{3,8}\b/],
    ['colour function', /\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color-mix)\(/],
    ['theme token / custom property', /var\(--|['"`]--[a-z]/],
    ['styling framework', /tailwind|styled-components|@emotion|@mui|bootstrap|chakra/i],
    ['named palette colour', /['"](?:red|green|blue|black|white|gray|grey|orange|purple|yellow|pink|teal)['"]/],
  ]
  for (const [label, re] of forbidden) {
    it(`contains no ${label}`, () => {
      for (const f of kitFiles) expect(read(f).match(re), `${f}: ${label}`).toBeNull()
    })
  }

  it('only imports react, motion, lucide-react types and itself', () => {
    for (const f of kitFiles) {
      for (const m of read(f).matchAll(/from\s+'([^']+)'/g)) {
        const spec = m[1]
        expect(spec.startsWith('.') || ['react', 'motion/react', 'lucide-react'].includes(spec), `${f} imports ${spec}`).toBe(true)
        expect(spec, f).not.toMatch(/presentations/)
      }
      expect(read(f), f).not.toMatch(/htm-|how-to-make/)
    }
  })
})

describe('rendered kit output is unstyled', () => {
  const VISUAL = /^(color|background|border|box-shadow|text-shadow|font|padding|margin|outline|filter|gap|line-height)/
  const GEOMETRY = new Set(['position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'transform', 'transform-origin', 'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'justify-content', 'overflow', 'pointer-events', 'opacity', 'z-index', 'will-change'])

  it('sets no class names and only geometry in inline styles across chrome and every primitive', () => {
    setViewport(1440)
    function Everything() {
      return (
        <SceneLayer>
          <Appear key="a">
            <Box id="b" Icon={Star} x={1} y={2} width={3} height={4}>b</Box>
            <Label id="l" x={1} y={2}>l</Label>
            <Frame id="f" x={0} y={0} width={5} height={5} />
            <Emphasis id="e" x={0} y={0} width={5} height={5} />
            <SymbolChip id="s" x={0} y={0}>s</SymbolChip>
            <Arrow id="ar" from={{ x: 0, y: 0 }} to={{ x: 9, y: 9 }} bidirectional />
          </Appear>
        </SceneLayer>
      )
    }
    const steps: Step<undefined>[] = [{ id: 'x', era: 'e', title: 't', caption: 'c', Scene: Everything, payload: undefined }]
    for (const mode of ['browse', 'present'] as const) {
      const { container, unmount } = render(<Presentation steps={steps} title="t" initialMode={mode} brand={null} />)
      expect(container.querySelectorAll('[class]:not([data-presentation-icon])'), mode).toHaveLength(0)
      for (const el of container.querySelectorAll<HTMLElement>('[style]')) {
        for (let i = 0; i < el.style.length; i++) {
          const prop = el.style.item(i)
          expect(VISUAL.test(prop), `${prop} on ${el.tagName}`).toBe(false)
          expect(GEOMETRY.has(prop), `unexpected inline property ${prop}`).toBe(true)
        }
      }
      unmount()
    }
  })
})

describe('kit stays optional-framework friendly', () => {
  it('lets authors pass className and style straight through', () => {
    const { container } = render(<Box id="x" className="author" style={{ background: 'red' }} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toBe('author')
    expect(el.style.background).toBe('red')
  })
})
