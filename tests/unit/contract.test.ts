// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../..')
const BOOTSTRAP = path.join(ROOT, 'skills/presentation/templates/bootstrap')
const read = (...p: string[]) => readFileSync(path.join(ROOT, ...p), 'utf8')
const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))],
  )
const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })

const KIT = 'src/presentation-kit'
const kitFiles = walk(path.join(ROOT, KIT))

/** Visual style properties the kit must never set; layout geometry is allowed. */
const VISUAL_PROPS = [
  'color', 'background', 'backgroundColor', 'backgroundImage', 'border', 'borderColor', 'borderWidth', 'borderStyle',
  'borderRadius', 'boxShadow', 'textShadow', 'filter', 'backdropFilter', 'fontFamily', 'fontSize', 'fontWeight',
  'fontStyle', 'letterSpacing', 'lineHeight', 'textDecoration', 'textTransform', 'outline', 'padding', 'margin',
  'gap', 'cursor', 'accentColor', 'fill', 'stroke', 'strokeWidth',
]
const VISUAL_RE = new RegExp(`(?:^|[\\s{,'"])(?:${VISUAL_PROPS.join('|')})\\s*:`, 'm')
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(|var\(--|\bcolor-mix\(/

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('scene kit is style-neutral', () => {
  it('ships only TypeScript sources: no stylesheets, CSS imports, or framework imports', () => {
    expect(kitFiles.length).toBeGreaterThan(10)
    for (const f of kitFiles) {
      expect(f, f).toMatch(/\.(ts|tsx)$/)
      const src = read(KIT, f)
      expect(src, f).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
      expect(src, f).not.toMatch(/tailwind|styled-components|@emotion|class-variance-authority|clsx/i)
    }
  })

  it('sets no palette, font, border, shadow, spacing, card or button style, nor theme tokens', () => {
    for (const f of kitFiles) {
      const src = stripComments(read(KIT, f))
      expect(src, `${f}: visual property`).not.toMatch(VISUAL_RE)
      expect(src, `${f}: color or theme token`).not.toMatch(COLOR_RE)
    }
  })

  it('only uses geometry/behavior style properties inline', () => {
    const allowed = new Set([
      'position', 'top', 'left', 'right', 'bottom', 'inset', 'width', 'height', 'display', 'flexDirection',
      'alignItems', 'justifyContent', 'overflow', 'pointerEvents', 'originX', 'originY', 'scale',
    ])
    const used = new Set<string>()
    for (const f of kitFiles) {
      for (const m of stripComments(read(KIT, f)).matchAll(/style=\{\{([^}]*)\}\}/g)) {
        for (const k of m[1].matchAll(/(?:^|,)\s*(\w+)\s*[:,]/g)) used.add(k[1])
      }
    }
    expect(used.size).toBeGreaterThan(5)
    for (const k of used) expect(allowed.has(k), `style property ${k}`).toBe(true)
  })

  it('declares no styling-framework dependency, in the repo or the bootstrap', () => {
    for (const pkgPath of ['package.json', 'skills/presentation/templates/bootstrap/package.json']) {
      const pkg = JSON.parse(read(pkgPath))
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(names.filter((n) => /tailwind|styled|emotion|bootstrap|bulma|chakra|mui|antd/i.test(n)), pkgPath).toEqual([])
    }
    const lock = read('skills/presentation/templates/bootstrap/package-lock.json')
    expect(lock).not.toMatch(/tailwind/i)
  })

  it('keeps the bootstrap free of Tailwind, themes and visual defaults', () => {
    const files = walk(BOOTSTRAP).filter((f) => !f.startsWith('node_modules') && f !== 'package-lock.json')
    for (const f of files) {
      const src = readFileSync(path.join(BOOTSTRAP, f), 'utf8')
      expect(src, f).not.toMatch(/tailwind/i)
      if (f.endsWith('.css')) {
        const css = stripComments(src)
        expect(css, `${f}: color/theme`).not.toMatch(COLOR_RE)
        // Only reset-style geometry is allowed in bootstrap CSS.
        const props = [...css.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
        expect(props.filter((p) => !['box-sizing', 'margin'].includes(p)), f).toEqual([])
      }
    }
    expect(files.some((f) => f.endsWith('.css'))).toBe(true)
  })

  it('keeps the presentation template stylesheet declaration-free (the skill fills in the look)', () => {
    const css = stripComments(read('skills/presentation/templates/presentation/talk.css'))
    expect(css.trim()).toBe('')
  })
})

describe('bootstrap snapshot parity', () => {
  it('mirrors src/presentation-kit file-for-file, byte-for-byte, in both directions', () => {
    const tpl = walk(path.join(BOOTSTRAP, KIT)).sort()
    expect(tpl).toEqual([...kitFiles].sort())
    for (const f of kitFiles) {
      expect(readFileSync(path.join(BOOTSTRAP, KIT, f)).equals(readFileSync(path.join(ROOT, KIT, f))), f).toBe(true)
    }
  })

  it.each(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/main.tsx', 'src/Router.tsx', 'src/route.ts', 'src/Landing.tsx'])(
    'keeps %s identical to its bootstrap copy',
    (f) => {
      expect(readFileSync(path.join(BOOTSTRAP, f)).equals(readFileSync(path.join(ROOT, f)))).toBe(true)
    },
  )

  it('ships a bootstrap with the full dependency set in package.json and committed lock data', () => {
    const pkg = JSON.parse(read('skills/presentation/templates/bootstrap/package.json'))
    const lock = JSON.parse(read('skills/presentation/templates/bootstrap/package-lock.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const required = [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]
    for (const d of required) {
      expect(deps[d], `package.json ${d}`).toBeTruthy()
      expect(lock.packages[`node_modules/${d}`], `lock ${d}`).toBeTruthy()
    }
    for (const s of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts[s], s).toBeTruthy()
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('keeps the bootstrap dependency ranges in step with the repository', () => {
    const root = JSON.parse(read('package.json'))
    const tpl = JSON.parse(read('skills/presentation/templates/bootstrap/package.json'))
    const rootDeps = { ...root.dependencies, ...root.devDependencies }
    for (const [name, range] of Object.entries({ ...tpl.dependencies, ...tpl.devDependencies })) {
      expect(rootDeps[name], name).toBe(range)
    }
  })

  it('starts with an empty registry and the registration marker', () => {
    const reg = readFileSync(path.join(BOOTSTRAP, 'src/presentations/index.ts'), 'utf8')
    expect(reg).toContain('// new presentations are registered above this line')
    expect(reg).not.toMatch(/slug:\s*['"]/)
  })
})

describe('repository scripts and hygiene', () => {
  const pkg = JSON.parse(read('package.json'))

  it('keeps npm test to the fast unit config and puts browser-backed suites in separate scripts', () => {
    expect(pkg.scripts.test).toBe('vitest run --config vitest.config.ts')
    for (const s of ['lint', 'build', 'verify', 'inspect', 'test:integration', 'test:e2e']) expect(pkg.scripts[s], s).toBeTruthy()
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
    expect(pkg.scripts.inspect).toContain('scripts/inspect-presentation.mjs')
    const fast = read('vitest.config.ts')
    expect(fast).toContain('tests/unit/')
    expect(fast).not.toMatch(/integration|e2e/)
    expect(read('vitest.integration.config.ts')).toContain('tests/integration/')
    expect(read('vitest.e2e.config.ts')).toContain('tests/e2e/')
  })

  it('includes the whole app in the TypeScript build', () => {
    expect(read('tsconfig.app.json')).toMatch(/"include":\s*\["src"\]/)
    const refs = JSON.parse(read('tsconfig.json')).references.map((r: { path: string }) => r.path)
    expect(refs).toEqual(expect.arrayContaining(['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json']))
  })

  it('keeps StrictMode at the app root', () => {
    expect(read('src/main.tsx')).toMatch(/<StrictMode>/)
  })

  it('declares the reference sample for verification', () => {
    expect(pkg.andScene).toEqual({
      reference: 'how-to-make-a-presentation',
      outline: 'src/presentations/how-to-make-a-presentation/outline.json',
    })
  })

  it('adds no hosted CI configuration', () => {
    expect(existsSync(path.join(ROOT, '.github/workflows'))).toBe(false)
    expect(existsSync(path.join(ROOT, '.gitlab-ci.yml'))).toBe(false)
    expect(existsSync(path.join(ROOT, '.circleci'))).toBe(false)
  })

  it('does not track build output, dependencies or inspection screenshots, and ignores them', () => {
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /^(dist|node_modules|inspection)\//.test(f) || /(^|\/)(dist|node_modules)\//.test(f) || /\.png$/.test(f))).toEqual([])
    for (const p of ['dist/index.html', 'node_modules/x/y.js', 'inspection/how-to-make-a-presentation/step-01.png', 'inspection/x/report.json']) {
      expect(() => git('check-ignore', '-q', p), p).not.toThrow()
    }
  })

  it('writes inspection artifacts to the ignored project-local path', () => {
    const src = read('scripts/inspect-presentation.mjs')
    expect(src).toContain("'inspection'")
    expect(statSync(path.join(ROOT, 'scripts')).isDirectory()).toBe(true)
  })
})
