import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip } from '../../src/presentation-kit/index.ts'
import { makeSteps } from './helpers.tsx'

const ROOT = path.resolve(__dirname, '../..')
const KIT = path.join(ROOT, 'src/presentation-kit')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const kitFiles = walk(KIT)
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('style-neutral kit (source contract)', () => {
  it('ships only TypeScript sources: no CSS, no stylesheet imports', () => {
    expect(kitFiles.filter((f) => !/\.tsx?$/.test(f))).toEqual([])
    for (const file of kitFiles) expect(readFileSync(file, 'utf8'), file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
  })

  it('declares no visual defaults: colours, fonts, borders, shadows, spacing, themes, classes', () => {
    const visualProps = /\b(color|backgroundColor|background|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|fontStyle|lineHeight|letterSpacing|padding\w*|margin\w*|gap|rowGap|columnGap|textDecoration\w*|textTransform|outline\w*|filter|cursor|listStyle\w*)\s*:/
    for (const file of kitFiles) {
      const source = stripComments(readFileSync(file, 'utf8'))
      const rel = path.relative(ROOT, file)
      expect(source, rel).not.toMatch(visualProps)
      expect(source, rel).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(source, rel).not.toMatch(/\b(rgba?|hsla?|oklch|color-mix)\(/)
      expect(source, rel).not.toMatch(/var\(--|['"`]--[a-z]/)
      expect(source, rel).not.toMatch(/className\s*=\s*(["'`]|\{\s*["'`])/)
    }
  })

  it('depends on nothing but React, Motion, Lucide, and itself', () => {
    const allowed = /^(react|motion\/react|lucide-react|\.\.?\/.*)$/
    for (const file of kitFiles) {
      for (const [, spec] of readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(spec, `${path.relative(ROOT, file)}: ${spec}`).toMatch(allowed)
      }
    }
  })

  it('requires no styling framework in root or bootstrap manifests and Vite configs', () => {
    const roots = [ROOT, path.join(ROOT, 'skills/presentation/templates/bootstrap')]
    for (const dir of roots) {
      const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(names.filter((n) => /tailwind|styled-components|emotion|bootstrap|bulma|unocss|windicss|chakra|mantine/i.test(n)), dir).toEqual([])
      const vite = readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')
      expect(vite).not.toMatch(/tailwind/i)
    }
  })
})

const ALLOWED_INLINE = new Set([
  'flex-grow', 'flex-shrink', 'flex-basis', 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'min-width', 'min-height', 'display', 'flex', 'flex-direction',
  'align-items', 'justify-content', 'overflow', 'box-sizing', 'white-space', 'text-overflow', 'pointer-events', 'opacity',
  'transform', 'transform-origin', 'scale', 'will-change', 'z-index',
])

describe('unstyled kit output (rendered)', () => {
  it('sets only geometry/behaviour inline styles and no classes when the author supplies none', () => {
    render(
      <>
        <Presentation steps={makeSteps(3)} title="T" />
        <SceneLayer>
          <Appear>
            <Box id="b" x={1} y={2} width={3} height={4} icon={Check}>b</Box>
            <Label id="l" x={1} y={2}>l</Label>
            <Frame id="f" x={1} y={2} label="f" />
            <Emphasis id="e" x={1} y={2} />
            <SymbolChip id="s" x={1} y={2} symbol="s" />
            <Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} bidirectional bend={10} />
          </Appear>
        </SceneLayer>
      </>,
    )
    const offenders: string[] = []
    for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
      if (el.closest('[data-presentation-icon]')) continue // third-party Lucide markup
      for (let i = 0; i < el.style.length; i++) {
        const prop = el.style.item(i)
        if (!ALLOWED_INLINE.has(prop)) offenders.push(`${el.tagName}.${prop}`)
      }
      expect(el.getAttribute('class'), el.tagName).toBeNull()
      expect(el.getAttribute('fill') === null || el.getAttribute('fill') === 'none').toBe(true)
      expect(['currentColor', null]).toContain(el.getAttribute('stroke'))
    }
    expect(offenders).toEqual([])
  })
})
