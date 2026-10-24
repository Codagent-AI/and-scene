import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../../vitest.config.ts'
import { ROOT, read, readJson, stripComments, walk } from '../support/files.ts'

const KIT_ROOTS = [path.join(ROOT, 'src', 'presentation-kit')]
const TEMPLATE_KIT = path.join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap', 'src', 'presentation-kit')
if (existsSync(TEMPLATE_KIT)) KIT_ROOTS.push(TEMPLATE_KIT)
const kitFiles = KIT_ROOTS.flatMap((dir) => walk(dir))

const VISUAL_DEFAULTS: [string, RegExp][] = [
  ['hex color', /#[0-9a-fA-F]{3,8}\b/],
  ['functional color', /\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/],
  ['css variable / theme token', /var\(--|--[a-z][\w-]*\s*:/],
  ['visual property', /\b(?:color|background\w*|border\w*|font\w*|boxShadow|box-shadow|textShadow|outline(?!Width)\w*|padding\w*|margin\w*|gap|rowGap|columnGap|filter|cursor|letterSpacing|lineHeight|textTransform|textDecoration\w*|listStyle\w*|accentColor|fill|stroke\w*)\s*:/],
  ['tailwind / css-in-js', /tailwind|@apply|styled-components|@emotion|class-variance-authority/i],
]

describe('the kit ships zero visual defaults (M-10)', () => {
  it('has at least the canonical kit files to scan', () => {
    expect(kitFiles.length).toBeGreaterThan(15)
  })

  it('contains no stylesheet, CSS import or styling-framework import', () => {
    for (const file of kitFiles) {
      expect(path.extname(file), file).not.toMatch(/^\.(css|scss|sass|less|styl)$/)
      expect(stripComments(read(path.relative(ROOT, file))), file).not.toMatch(/import\s+['"][^'"]*\.(css|scss|less)['"]/)
    }
  })

  it.each(VISUAL_DEFAULTS)('contains no %s declarations', (_label, pattern) => {
    const offenders = kitFiles
      .filter((file) => /\.(tsx?|mjs|js)$/.test(file))
      .flatMap((file) =>
        stripComments(read(path.relative(ROOT, file)))
          .split('\n')
          .filter((line) => pattern.test(line))
          .map((line) => `${path.relative(ROOT, file)}: ${line.trim()}`),
      )
    expect(offenders).toEqual([])
  })
})

describe('styling frameworks stay optional (M-13)', () => {
  const manifests = ['package.json', 'skills/presentation/templates/bootstrap/package.json'].filter((f) => existsSync(path.join(ROOT, f)))

  it.each(manifests)('%s does not depend on Tailwind or another required styling framework', (file) => {
    const pkg = readJson(file)
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies })
    expect(deps.filter((d) => /tailwind|styled-components|@emotion|sass|less|postcss|unocss|windicss|bootstrap|@mui|chakra/.test(d))).toEqual([])
  })

  it('does not wire a styling plugin into the Vite config or the entry points', () => {
    const files = ['vite.config.ts', 'src/main.tsx', 'skills/presentation/templates/bootstrap/vite.config.ts'].filter((f) => existsSync(path.join(ROOT, f)))
    for (const file of files) expect(read(file), file).not.toMatch(/tailwind|postcss/i)
  })
})

describe('the kit is presentation-agnostic (C-05)', () => {
  it('imports nothing from presentations and names no sample entities', () => {
    for (const file of kitFiles.filter((f) => /\.(tsx?)$/.test(f))) {
      const code = stripComments(read(path.relative(ROOT, file)))
      expect(code, file).not.toMatch(/from\s+['"][^'"]*presentations[^'"]*['"]/)
      expect(code, file).not.toMatch(/how-to-make|scene-kit|step-card|question chip|\byou\b.*\bskill\b/)
    }
  })

  it('exports the public step contract and generic primitives', () => {
    const index = read('src/presentation-kit/index.ts')
    for (const name of ['Step', 'SceneProps', 'StepMeta', 'Presentation', 'Stage', 'Box', 'Label', 'Arrow', 'Frame', 'Emphasis', 'SymbolChip', 'Appear', 'SceneLayer', 'usePresentationNav', 'useFitScale']) {
      expect(index, name).toMatch(new RegExp(`\\b${name}\\b`))
    }
  })
})

describe('entry points (C-03)', () => {
  it('keeps StrictMode around the app root', () => {
    expect(read('src/main.tsx')).toMatch(/<StrictMode>/)
  })
})

describe('IPv4 loopback only (M-66)', () => {
  const scripts = walk(path.join(ROOT, 'scripts')).filter((f) => f.endsWith('.mjs'))

  it('has the verification scripts to scan', () => {
    expect(scripts.map((s) => path.basename(s))).toEqual(expect.arrayContaining(['verify.mjs', 'inspect-presentation.mjs', 'preview.mjs']))
  })

  it('builds every preview and browser URL from 127.0.0.1', () => {
    for (const file of scripts) {
      const code = stripComments(read(path.relative(ROOT, file)))
      expect(code, file).not.toMatch(/localhost|::1|\[::\]|0\.0\.0\.0/)
    }
    const preview = stripComments(read('scripts/lib/preview.mjs'))
    expect(preview).toMatch(/HOST\s*=\s*'127\.0\.0\.1'/)
    expect(preview).toMatch(/'--host',\s*HOST/)
    expect(preview).toMatch(/http:\/\/\$\{HOST\}:\$\{port\}/)
    expect(preview).toMatch(/server\.listen\(0,\s*HOST/)
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      const code = stripComments(read(file))
      expect(code, file).not.toMatch(/https?:\/\/(?!\$\{HOST\})/)
      expect(code, file).toMatch(/preview\.url/)
    }
  })
})

describe('npm scripts and test selection (M-76)', () => {
  const pkg = readJson('package.json')

  it('defines the documented commands', () => {
    for (const name of ['test', 'lint', 'build', 'verify', 'inspect', 'test:integration']) expect(pkg.scripts[name], name).toBeTruthy()
    expect(pkg.scripts.build).toContain('tsc -b')
    expect(pkg.scripts.build).toContain('vite build')
  })

  it('keeps npm test to the unit directory and sends slow suites to a separate script', () => {
    expect(pkg.scripts.test).not.toMatch(/integration|e2e/)
    expect(config.test?.include).toEqual(['tests/unit/**/*.test.{ts,tsx}'])
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    const integration = read('vitest.integration.config.ts')
    expect(integration).toMatch(/tests\/integration/)
    expect(integration).toMatch(/tests\/e2e/)
    expect(integration).not.toMatch(/tests\/unit/)
  })
})

describe('repository hygiene (M-78)', () => {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })

  it('tracks no build output, dependencies, screenshots or CI workflows', () => {
    const tracked = git('ls-files').split('\n').filter(Boolean)
    expect(tracked.filter((f) => /^(dist|node_modules|\.inspection|test-results)\//.test(f) || /(^|\/)(dist|node_modules)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /\.(png|jpe?g|webp)$/.test(f) && !f.startsWith('public/'))).toEqual([])
    expect(tracked.filter((f) => f.startsWith('.github/'))).toEqual([])
    expect(existsSync(path.join(ROOT, '.github', 'workflows'))).toBe(false)
  })

  it.each(['dist/index.html', 'node_modules/x/index.js', '.inspection/slug/step-01.png', 'test-results/a'])('git ignores %s', (p) => {
    expect(() => git('check-ignore', '-q', p)).not.toThrow()
  })
})
