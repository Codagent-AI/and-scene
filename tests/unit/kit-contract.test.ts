import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const KIT = join(ROOT, 'src', 'presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const kitFiles = walk(KIT)
const read = (file: string) => readFileSync(file, 'utf8')

const FORBIDDEN_PROPS =
  /\b(color|backgroundColor|background|border\w*|outline\w*|boxShadow|textShadow|filter|font\w*|margin\w*|padding\w*|gap|rowGap|columnGap|borderRadius)\s*:/

describe('scene kit stays style-neutral', () => {
  it('ships no CSS or style files', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
  })

  it('imports no styling framework or stylesheet', () => {
    for (const file of kitFiles) {
      const imports = [...read(file).matchAll(/from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2])
      for (const spec of imports) {
        expect(spec, relative(ROOT, file)).not.toMatch(/tailwind|styled|emotion|\.css$|stylex|vanilla-extract/)
      }
    }
  })

  it('sets no visual properties, colors or theme tokens in source', () => {
    for (const file of kitFiles) {
      const src = read(file)
      const where = relative(ROOT, file)
      expect(src.match(FORBIDDEN_PROPS), `${where} visual property`).toBeNull()
      expect(src.match(/#[0-9a-fA-F]{3,8}\b/), `${where} hex color`).toBeNull()
      expect(src.match(/\b(rgb|rgba|hsl|hsla|oklch)\(/), `${where} color function`).toBeNull()
      expect(src.match(/['"`]--[a-z]/), `${where} css custom property`).toBeNull()
    }
  })

  it('does not require Tailwind in the app dependencies or configuration', () => {
    const pkg = JSON.parse(read(join(ROOT, 'package.json')))
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(all.filter((d) => /tailwind/.test(d))).toEqual([])
    expect(read(join(ROOT, 'vite.config.ts'))).not.toMatch(/tailwind/)
    expect(readdirSync(ROOT).filter((f) => /^tailwind\./.test(f))).toEqual([])
  })

  it('exports the documented public surface', async () => {
    const kit = await import('../../src/presentation-kit')
    for (const name of [
      'Presentation', 'Stage', 'usePresentationNav', 'useFitScale', 'Box', 'Label', 'Arrow', 'Frame', 'Emphasis',
      'SymbolChip', 'Appear', 'SceneLayer', 'Header', 'Footer', 'Toc', 'DESIGN_W', 'DESIGN_H', 'LAYOUT_T',
    ]) {
      expect(kit, name).toHaveProperty(name)
    }
  })
})
