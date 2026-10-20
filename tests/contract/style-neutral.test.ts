import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, listFiles, isTestFile, read, readJson } from '../helpers/repo.ts'

const kitSources = (base: string) => listFiles(join(base, 'src/presentation-kit')).filter((f) => !isTestFile(f))

describe.each([['canonical kit', ROOT], ['template kit', TEMPLATE]])('%s', (_name, base) => {
  const files = kitSources(base)

  it('contains no CSS files and no styling-framework references', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less|pcss)$/.test(f))).toEqual([])
    for (const file of files) expect(read(file), file).not.toMatch(/tailwind|styled-components|@emotion|@apply|from ['"][^'"]+\.css['"]/i)
  })

  it('defines no colors, theme tokens, fonts, or visual properties in source', () => {
    for (const file of files) {
      const source = read(file)
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|var\(--|--[a-z-]+:|fontFamily|fontSize|fontWeight|boxShadow|borderRadius|backgroundColor|background:|border:|padding|margin|gap:|listStyle/)
    }
  })

  it('names no presentation topic, so the primitives stay topic-agnostic', () => {
    for (const file of files) expect(read(file), file).not.toMatch(/how-to-make|you-and|\bprompt\b|scene-kit|verify/i)
  })
})

describe('the scaffold imposes no style system', () => {
  it('declares no Tailwind or other styling framework dependency in the app or template', () => {
    for (const base of [ROOT, TEMPLATE]) {
      const pkg = readJson(join(base, 'package.json'))
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(names.filter((n) => /tailwind|styled|emotion|bootstrap|sass|less|postcss|unocss|windi/i.test(n))).toEqual([])
    }
  })

  it('has no Tailwind plugin or config in the template build setup', () => {
    expect(read(join(TEMPLATE, 'vite.config.ts'))).not.toMatch(/tailwind/i)
    expect(listFiles(TEMPLATE).filter((f) => /tailwind|postcss/i.test(f))).toEqual([])
  })

  it('ships no stylesheet with declarations: no palette, fonts, spacing, cards, buttons, borders, shadows or tokens', () => {
    const sheets = listFiles(TEMPLATE).filter((f) => /\.(css|scss)$/.test(f))
    expect(sheets.length).toBeGreaterThan(0)
    for (const sheet of sheets) expect(read(sheet).replace(/\/\*[\s\S]*?\*\//g, '').trim(), sheet).toBe('')
  })

  it('has no inline visual styles or colors in the template sources outside the kit', () => {
    const own = listFiles(join(TEMPLATE, 'src')).filter((f) => !f.includes('presentation-kit') && /\.(tsx?|html)$/.test(f))
    for (const file of own) {
      expect(read(file), file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|fontFamily|boxShadow|borderRadius|backgroundColor|color:/)
    }
    expect(read(join(TEMPLATE, 'index.html'))).not.toMatch(/<style|stylesheet/)
  })
})
