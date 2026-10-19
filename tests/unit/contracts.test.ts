import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  renderTemplate, starterFiles, syncedFiles, templatePackage, templateRoot,
} from '../../scripts/sync-templates.mjs'

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const rel = (base: string, files: string[]) => files.map((f) => path.relative(base, f).split(path.sep).join('/')).sort()
const text = (file: string) => readFileSync(file, 'utf8')

const KIT = 'src/presentation-kit'
const TEMPLATE_KIT = path.join(templateRoot, 'src/presentation-kit')
const KIT_SOURCES = walk(KIT)

/** Source with comments removed so prose cannot trip (or hide from) the scan. */
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('kit ships no visual defaults', () => {
  it('has only TypeScript sources: no CSS files and no CSS imports', () => {
    expect(KIT_SOURCES.every((f) => /\.(ts|tsx)$/.test(f))).toBe(true)
    for (const file of KIT_SOURCES) expect(stripComments(text(file)), file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
  })

  const FORBIDDEN_STYLE_KEYS =
    /\b(color|background\w*|font\w*|border\w*|boxShadow|textShadow|outline\w*|filter|backdropFilter|padding\w*|margin\w*|gap|rowGap|columnGap|stroke\w*|fill\w*|accentColor|caretColor)\s*[:=]/
  it.each(KIT_SOURCES.map((f) => [f]))('%s sets no colour, font, border, shadow, outline or spacing styling', (file) => {
    expect(stripComments(text(file))).not.toMatch(FORBIDDEN_STYLE_KEYS)
  })

  it.each(KIT_SOURCES.map((f) => [f]))('%s has no colour literals or theme tokens', (file) => {
    const source = stripComments(text(file))
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(source).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|currentColor)\b/i)
    expect(source).not.toMatch(/['"`]--[a-z]/)
    expect(source).not.toMatch(/var\(--/)
  })

  it('only sets geometry and layout-plumbing style properties', () => {
    const ALLOWED = new Set([
      'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'minWidth', 'x', 'y', 'scale', 'display',
      'flex', 'flexDirection', 'flexWrap', 'alignItems', 'justifyContent', 'overflow', 'pointerEvents',
      'zIndex', 'listStyle', 'whiteSpace', 'textOverflow', 'transform',
    ])
    const used = new Set<string>()
    for (const file of KIT_SOURCES) {
      for (const block of stripComments(text(file)).matchAll(/style=\{\{([^}]*)\}\}|style:\s*\{([^}]*)\}/g)) {
        for (const key of (block[1] ?? block[2]).matchAll(/(?<![.\w])([a-zA-Z]+)\s*:(?!:)/g)) used.add(key[1])
      }
    }
    expect([...used].filter((k) => !ALLOWED.has(k))).toEqual([])
    expect(used.size).toBeGreaterThan(5)
  })

  it('is topic-agnostic: imports no presentation and mentions no sample', () => {
    for (const file of KIT_SOURCES) {
      const source = stripComments(text(file))
      expect(source, file).not.toMatch(/presentations\/|how-to-make/)
      for (const imp of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(imp[1], file).toMatch(/^(\.|react|motion\/react|lucide-react)/)
      }
    }
  })

  it('offers the generic scene contracts', () => {
    const index = text(path.join(KIT, 'index.ts'))
    for (const name of ['Presentation', 'Stage', 'Box', 'Label', 'Arrow', 'Frame', 'Emphasis', 'SymbolChip', 'Appear', 'SceneLayer', 'Step', 'SceneProps', 'StepMeta']) {
      expect(index, name).toMatch(new RegExp(`\\b${name}\\b`))
    }
    for (const file of ['chrome/Header.tsx', 'chrome/Footer.tsx', 'chrome/Toc.tsx', 'types.ts', 'constants.ts', 'usePresentationNav.ts', 'useFitScale.ts']) {
      expect(existsSync(path.join(KIT, file)), file).toBe(true)
    }
  })
})

describe('typed boundary', () => {
  it('uses no casts or suppressions in app and kit sources', () => {
    const sources = [...KIT_SOURCES, ...walk('src/presentations'), ...walk('src').filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('/presentation')) ]
    for (const file of new Set(sources.filter((f) => /\.(ts|tsx)$/.test(f)))) {
      expect(stripComments(text(file)), file).not.toMatch(/@ts-(ignore|expect-error|nocheck)|\bas (any|never|unknown)\b/)
    }
    expect(text('src/presentation-kit/Presentation.tsx')).toMatch(/PresentationProps<TPayload>/)
  })
})

describe('no styling framework is required', () => {
  const manifests = [
    ['root package.json', 'package.json'],
    ['template package.json', path.join(templateRoot, 'package.json')],
    ['root lock', 'package-lock.json'],
    ['template lock', path.join(templateRoot, 'package-lock.json')],
  ] as const
  it.each(manifests)('%s lists no tailwind package', (_name, file) => {
    expect(text(file)).not.toMatch(/tailwind/i)
  })

  it.each([['vite.config.ts'], [path.join(templateRoot, 'vite.config.ts')], [path.join(templateRoot, 'src/index.css')], ['src/index.css']])(
    '%s has no tailwind plugin or directives',
    (file) => {
      expect(text(file)).not.toMatch(/tailwind|@apply|@theme/i)
    },
  )

  it('the bootstrap template defines no presentation colours, fonts or themes outside the starter presentation', () => {
    const css = rel(templateRoot, walk(templateRoot).filter((f) => /\.css$/.test(f)))
    expect(css).toEqual(['src/index.css', 'src/presentations/starter/style.css'])
    const host = stripComments(text(path.join(templateRoot, 'src/index.css')))
    expect(host).not.toMatch(/(^|[;{\s])(color|background\w*)\s*:|--[a-z]|font-family\s*:\s*Inter/)
    expect(text(path.join(templateRoot, 'tsconfig.app.json'))).not.toMatch(/tailwind/)
  })
})

describe('template snapshot stays aligned with the canonical sources', () => {
  it('has the same kit file inventory in both directions', () => {
    expect(rel(TEMPLATE_KIT, walk(TEMPLATE_KIT))).toEqual(rel(KIT, KIT_SOURCES))
  })

  it('has byte-identical kit, scripts and shared app files', () => {
    for (const [src, dest] of syncedFiles()) {
      expect(existsSync(dest), `${dest} missing`).toBe(true)
      expect(readFileSync(dest).equals(readFileSync(src)), `${path.relative('.', dest)} differs from ${path.relative('.', src)}`).toBe(true)
    }
  })

  it('has no extra or missing script files in the template', () => {
    const root = rel('scripts', walk('scripts')).filter((f) => !['sync-templates.mjs', 'verify.expectations.mjs'].includes(f))
    const tpl = rel(path.join(templateRoot, 'scripts'), walk(path.join(templateRoot, 'scripts'))).filter((f) => f !== 'verify.expectations.mjs')
    expect(tpl).toEqual(root)
  })

  it('renders the starter presentation from the presentation templates', () => {
    for (const [dest, content] of starterFiles()) expect(text(dest)).toBe(content)
    expect(renderTemplate('a __SLUG__ b __TITLE__', { slug: 's', title: 'T' })).toBe('a s b T')
  })

  it('keeps the template manifest in step with the repository dependencies', () => {
    expect(JSON.parse(text(path.join(templateRoot, 'package.json')))).toEqual(templatePackage())
    const devDeps = Object.keys(templatePackage().devDependencies)
    expect(devDeps).not.toContain('vitest')
    expect(devDeps).toEqual(expect.arrayContaining(['playwright', 'vite', 'typescript']))
  })

  it('keeps StrictMode in the template entry', () => {
    expect(text(path.join(templateRoot, 'src/main.tsx'))).toMatch(/<StrictMode>/)
  })
})

describe('repository gates', () => {
  const pkg = JSON.parse(text('package.json'))

  it('keeps npm test fast and unit-only, with browser suites in their own script', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(text('vitest.config.ts')).toMatch(/tests\/unit\/\*\*/)
    expect(text('vitest.config.ts')).not.toMatch(/tests\/browser/)
    expect(pkg.scripts['test:browser']).toMatch(/vitest\.browser\.config\.ts/)
    expect(text('vitest.browser.config.ts')).toMatch(/tests\/browser\/\*\*/)
  })

  it('defines build, lint, verify and inspect gates', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.lint).toBe('eslint .')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('adds no hosted CI configuration', () => {
    expect(existsSync('.github/workflows')).toBe(false)
    expect(existsSync('.github')).toBe(false)
  })

  it('does not track build output, dependency directories or inspection screenshots', () => {
    const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
    const bad = tracked.filter((f) => /(^|\/)(dist|node_modules|artifacts)\//.test(f) || /\.png$/.test(f) && /inspection/.test(f))
    expect(bad).toEqual([])
    const ignore = text('.gitignore')
    for (const entry of ['node_modules', 'dist', 'artifacts']) expect(ignore).toMatch(new RegExp(`^${entry}$`, 'm'))
  })
})
