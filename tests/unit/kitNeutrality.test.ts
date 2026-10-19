import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { listFiles, text } from '../helpers/tree.ts'

const KIT = 'src/presentation-kit'
const files = listFiles(KIT)
const code = files.filter((f) => /\.(ts|tsx)$/.test(f))

// Visual properties the kit must never set. Layout geometry (position, inset, size, transform)
// and behavioral animation (opacity) are allowed.
const VISUAL = /\b(color|background|backgroundColor|backgroundImage|font|fontFamily|fontSize|fontWeight|border|borderColor|borderRadius|borderWidth|boxShadow|textShadow|outline|filter|letterSpacing|lineHeight|padding|margin|gap|cursor|textDecoration)\s*:/

describe('scene kit carries no visual defaults', () => {
  it('contains no stylesheets and imports none', () => {
    expect(files.filter((f) => /\.(css|scss|less|sass|pcss)$/.test(f))).toEqual([])
    for (const f of code) expect(text(join(KIT, f)), f).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
  })

  it('sets no visual style properties inline', () => {
    for (const f of code) {
      const src = text(join(KIT, f)).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(src, f).not.toMatch(VISUAL)
    }
  })

  it('hard-codes no colors, fonts or theme tokens', () => {
    for (const f of code) {
      const src = text(join(KIT, f)).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|var\(--|--[a-z-]+\s*:|font-family|sans-serif|@theme/i)
      for (const m of src.matchAll(/(?:fill|stroke)="([^"]+)"/g)) expect(['none', 'currentColor']).toContain(m[1])
    }
  })

  it('does not inject styles at runtime or depend on a styling framework', () => {
    for (const f of code) {
      const src = text(join(KIT, f))
      expect(src, f).not.toMatch(/createElement\(['"]style['"]|<style[\s>]|insertRule|adoptedStyleSheets|tailwind|styled-components|@emotion|classnames?['"]/i)
    }
  })

  it('keeps tailwind out of the host package and its Vite config', () => {
    const pkg = JSON.parse(text('package.json'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /tailwind/i.test(d))).toEqual([])
    expect(text('vite.config.ts')).not.toMatch(/tailwind/i)
  })

  it('stays topic-agnostic: no sample-specific copy or imports', () => {
    for (const f of code) {
      const src = text(join(KIT, f))
      expect(src, f).not.toMatch(/how-to|presentations\/|skill|made by(?!\s+and-scene)/i)
    }
  })

  it('exports the full primitive set, hooks and step contract', async () => {
    const kit = await import('../../src/presentation-kit/index.ts')
    for (const name of ['Box', 'Label', 'Arrow', 'Frame', 'Emphasis', 'SymbolChip', 'Appear', 'SceneLayer', 'Presentation', 'Stage', 'usePresentationNav', 'useFitScale']) {
      expect(kit, name).toHaveProperty(name)
    }
    expect(kit.DESIGN_W).toBe(880)
  })

  it('keeps StrictMode on in the app entry point', () => {
    expect(text('src/main.tsx')).toMatch(/<StrictMode>/)
  })
})
