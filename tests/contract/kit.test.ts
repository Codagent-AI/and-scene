import { describe, expect, it } from 'vitest'
import { BOOTSTRAP, read, ROOT, walk } from './helpers.ts'
import path from 'node:path'

const KIT = path.join(ROOT, 'src/presentation-kit')
const kitSources = walk(KIT, (f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f))

/** Properties that would give the kit a visual identity. Geometry (position, size, flex) is allowed. */
const VISUAL_PROPERTIES = [
  'color', 'background', 'backgroundColor', 'border', 'borderRadius', 'boxShadow', 'textShadow', 'fontFamily',
  'fontSize', 'fontWeight', 'fontStyle', 'padding', 'margin', 'outline', 'filter', 'fill', 'stroke', 'strokeWidth',
]

describe('style-neutral kit', () => {
  it('ships no stylesheets and imports no CSS', () => {
    expect(kitSources.filter((f) => f.endsWith('.css'))).toEqual([])
    for (const file of kitSources) expect(read('src/presentation-kit', file)).not.toMatch(/import\s+['"][^'"]+\.css['"]/)
  })

  it('sets no visual inline style properties', () => {
    const pattern = new RegExp(`\\b(${VISUAL_PROPERTIES.join('|')})\\s*:`)
    for (const file of kitSources) {
      const styleBlocks = [...read('src/presentation-kit', file).matchAll(/style=\{\{([\s\S]*?)\}\}/g)].map((m) => m[1])
      for (const block of styleBlocks) expect(block, file).not.toMatch(pattern)
    }
  })

  it('uses no colour literals, theme tokens, font declarations or Tailwind', () => {
    for (const file of kitSources) {
      const source = read('src/presentation-kit', file)
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|var\(--|font-family|tailwind/i)
    }
  })

  it('does not depend on a styling framework or presentation-local code', () => {
    for (const manifest of [read('package.json'), read('skills/presentation/templates/bootstrap/package.json')]) {
      expect(manifest).not.toMatch(/tailwind|styled-components|emotion|@mui|bootstrap"/i)
    }
    expect(read('vite.config.ts')).not.toMatch(/tailwind/i)
    expect(read('skills/presentation/templates/bootstrap/vite.config.ts')).not.toMatch(/tailwind/i)
    for (const file of kitSources) expect(read('src/presentation-kit', file), file).not.toMatch(/presentations\//)
  })

  it('has zero visual defaults in the bootstrap host and presentation CSS', () => {
    const css = walk(BOOTSTRAP, (f) => f.endsWith('.css') && !f.includes('node_modules'))
    for (const file of css) {
      const source = path.join(BOOTSTRAP, file)
      expect(read(path.relative(ROOT, source)), file).not.toMatch(/(^|[;{\s])(color|background(-color)?|font-family|border(-radius)?|box-shadow)\s*:/)
    }
  })
})

describe('app contracts', () => {
  it('keeps StrictMode and lazy-loaded routes in both app entry points', () => {
    for (const main of [read('src/main.tsx'), read('skills/presentation/templates/bootstrap/src/main.tsx')]) {
      expect(main).toContain('StrictMode')
      expect(main).toMatch(/lazy\(/)
      expect(main).toContain('Suspense')
    }
  })

  it('adds no router dependency', () => {
    expect(read('package.json')).not.toMatch(/react-router|@tanstack\/(react-)?router|wouter/)
  })

  it('declares the required runtime and build dependencies in the bootstrap template', () => {
    const pkg = JSON.parse(read('skills/presentation/templates/bootstrap/package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps[name], name).toBeDefined()
    }
    expect(Object.keys(pkg.scripts)).toEqual(expect.arrayContaining(['build', 'lint', 'verify', 'inspect']))
  })
})

describe('verification scripts', () => {
  it('use the IPv4 loopback address and never localhost', () => {
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      expect(read(file), file).not.toMatch(/localhost/)
    }
    expect(read('scripts/lib/preview.mjs')).toContain("HOST = '127.0.0.1'")
  })

  it('only the data file differs between the root and template verification setups', () => {
    expect(JSON.parse(read('skills/presentation/templates/bootstrap/scripts/verify.config.json')).referenceSample).toBeNull()
    expect(JSON.parse(read('scripts/verify.config.json')).referenceSample.steps).toHaveLength(9)
  })
})
