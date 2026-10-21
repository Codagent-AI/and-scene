import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, TEST_FILE, json, text, walk } from './helpers'

const KITS = [path.join(ROOT, 'src/presentation-kit'), path.join(TEMPLATE, 'src/presentation-kit')]
const VISUAL_KEYS = /\b(color|background\w*|border\w*|font\w*|boxShadow|textShadow|padding\w*|margin\w*|gap|rowGap|columnGap|outline\w*|filter|backdropFilter|letterSpacing|lineHeight)\s*:/
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|lab|color-mix)a?\(/

async function kitSources(kit: string) {
  return (await walk(kit)).filter((f) => !TEST_FILE.test(f))
}

describe.each(KITS)('scene kit at %s', (kit) => {
  it('ships no stylesheet, theme file or CSS import', async () => {
    const files = await kitSources(kit)
    expect(files.filter((f) => /\.(css|scss|sass|less|pcss)$/.test(f))).toEqual([])
    for (const file of files) expect(await text(file), file).not.toMatch(/import\s+['"][^'"]+\.(css|scss)['"]/)
  })

  it('sets no color, font, border, shadow, radius or spacing in code', async () => {
    for (const file of await kitSources(kit)) {
      const source = await text(file)
      expect(source, file).not.toMatch(VISUAL_KEYS)
      expect(source, file).not.toMatch(COLOR_LITERAL)
      expect(source, file).not.toMatch(/className\s*=\s*\{?\s*["'`]/)
      expect(source, file).not.toMatch(/tailwind/i)
    }
  })

  it('imports only React, Motion and Lucide', async () => {
    for (const file of await kitSources(kit)) {
      for (const match of (await text(file)).matchAll(/from\s+'([^']+)'/g)) {
        const spec = match[1]
        expect(spec.startsWith('.') || ['react', 'motion/react', 'lucide-react'].includes(spec), `${file}: ${spec}`).toBe(true)
      }
    }
  })
})

describe('styling frameworks stay optional', () => {
  it.each([ROOT, TEMPLATE])('declares no Tailwind or CSS-framework dependency in %s', async (dir) => {
    const pkg = await json(path.join(dir, 'package.json'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|bootstrap|bulma|styled-components|emotion|@mui|chakra/i.test(n))).toEqual([])
  })

  it('keeps the bootstrap host free of default presentation styling', async () => {
    const files = (await walk(TEMPLATE)).filter((f) => !f.endsWith('package-lock.json'))
    const css = files.filter((f) => f.endsWith('.css'))
    expect(css.map((f) => path.relative(TEMPLATE, f))).toEqual(['src/index.css'])
    const host = await text(css[0])
    expect(host).not.toMatch(/(color|background|font|border|shadow|radius|padding|gap)[\w-]*\s*:/)
    expect(host).not.toMatch(COLOR_LITERAL)
    for (const file of files.filter((f) => /\.(tsx?|mjs|json)$/.test(f))) {
      expect(await text(file), file).not.toMatch(COLOR_LITERAL)
    }
  })
})

describe('entry point', () => {
  it('keeps React StrictMode enabled', async () => {
    const main = await text(path.join(ROOT, 'src/main.tsx'))
    expect(main).toMatch(/<StrictMode>/)
  })
})
