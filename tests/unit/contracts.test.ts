import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ES module
import { MIRRORED_FILES, STARTER, renderPresentation } from '../../tools/sync-bootstrap-template.mjs'
import { exists, read, tree, walk } from '../support/files'

const BOOTSTRAP = 'skills/presentation/templates/bootstrap'
const KIT = 'src/presentation-kit'
const kitFiles = () => walk(KIT)
const templateKitFiles = () => walk(path.join(BOOTSTRAP, KIT))

describe('style neutrality of the kit and the scaffold', () => {
  const FORBIDDEN_PROPS = /\b(color|background\w*|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|lineHeight|padding\w*|margin\w*|gap|outline\w*|filter|cursor|letterSpacing|stroke\w*|fill)\s*:/
  const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\b(red|blue|green|black|white|gray|grey|orange|purple)\b['"]/

  it.each([['canonical kit', KIT], ['bootstrap kit', path.join(BOOTSTRAP, KIT)]])('%s declares no visual defaults, colors, or stylesheets', (_n, dir) => {
    const files = walk(dir)
    expect(files.length).toBeGreaterThan(10)
    for (const f of files) {
      expect(f, 'kit ships no CSS').not.toMatch(/\.(css|scss|less|sass)$/)
      const src = read(f)
      expect(src, `${f} imports a stylesheet`).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
      expect(src, `${f} visual property`).not.toMatch(FORBIDDEN_PROPS)
      expect(src, `${f} color literal`).not.toMatch(COLOR_LITERAL)
      expect(src, `${f} styling framework`).not.toMatch(/tailwind|styled-components|@emotion|className=["'`][^"'`]+["'`]/i)
    }
  })

  it('the kit imports nothing presentation-specific', () => {
    for (const f of kitFiles()) expect(read(f), f).not.toMatch(/from ['"]\.\.\/(\.\.\/)?(presentations|Landing|router)/)
  })

  it('no manifest, lock root, or config in the app or scaffold requires Tailwind or another styling framework', () => {
    const STYLE_SYSTEM = /tailwind|styled-components|@emotion|@vanilla-extract|stylex|sass|less|postcss/i
    for (const dir of ['.', BOOTSTRAP]) {
      const pkg = JSON.parse(read(path.join(dir, 'package.json')))
      const lockRoot = JSON.parse(read(path.join(dir, 'package-lock.json'))).packages['']
      const declared = [pkg.dependencies, pkg.devDependencies, lockRoot.dependencies, lockRoot.devDependencies].flatMap((d) => Object.keys(d ?? {}))
      expect(declared.filter((d) => STYLE_SYSTEM.test(d)), dir).toEqual([])
      expect(read(path.join(dir, 'vite.config.ts')), dir).not.toMatch(STYLE_SYSTEM)
    }
  })

  it('the scaffold stylesheet is geometry only', () => {
    const css = read(`${BOOTSTRAP}/src/index.css`)
    expect(css).not.toMatch(/color|font|background|border|shadow|padding/)
    expect(walk(path.join(BOOTSTRAP, 'src/presentations')).filter((f) => f.endsWith('.css'))).toHaveLength(1)
    expect(read(`${BOOTSTRAP}/src/presentations/starter/styles.css`).replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
  })
})

describe('template and canonical source alignment', () => {
  it('kit files are byte-identical in the same relative layout', () => {
    expect(tree(path.join(BOOTSTRAP, KIT))).toEqual(tree(KIT))
    expect(templateKitFiles().length).toBe(kitFiles().length)
  })

  it('mirrored routing, config, and verification scripts are byte-identical', () => {
    for (const rel of MIRRORED_FILES as string[]) expect(read(path.join(BOOTSTRAP, rel)), rel).toBe(read(rel))
    expect(Object.keys(tree(path.join(BOOTSTRAP, 'scripts'))).sort()).toEqual(['inspect-presentation.mjs', 'lib/preview.mjs', 'verify.mjs'])
  })

  it('the starter presentation is the rendered presentation template', () => {
    const rendered = renderPresentation(STARTER) as Record<string, string>
    expect(tree(path.join(BOOTSTRAP, 'src/presentations/starter'))).toEqual(rendered)
  })

  it('the starter is registered with at least two steps', () => {
    expect(read(`${BOOTSTRAP}/src/presentations/index.ts`)).toContain("slug: 'starter'")
    expect(walk(path.join(BOOTSTRAP, 'src/presentations/starter/steps')).filter((f) => /step\d+\.ts$/.test(f)).length).toBeGreaterThanOrEqual(2)
  })
})

describe('bootstrap manifest', () => {
  const pkg = JSON.parse(read(`${BOOTSTRAP}/package.json`))
  const lock = JSON.parse(read(`${BOOTSTRAP}/package-lock.json`))
  const all = { ...pkg.dependencies, ...pkg.devDependencies }

  it('declares the complete runtime, build, lint, and browser-verification dependency set', () => {
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) {
      expect(all, dep).toHaveProperty(dep)
    }
    expect(all.react).toMatch(/\^?19\./)
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    for (const s of ['verify', 'inspect', 'lint', 'preview']) expect(pkg.scripts).toHaveProperty(s)
  })

  it('the lock file matches the manifest and resolves every declared dependency', () => {
    const root = lock.packages['']
    expect({ ...root.dependencies, ...root.devDependencies }).toEqual(all)
    for (const dep of Object.keys(all)) expect(lock.packages, dep).toHaveProperty(`node_modules/${dep}`)
  })

  it('matches the root app on shared dependency ranges', () => {
    const rootPkg = JSON.parse(read('package.json'))
    const rootAll = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
    for (const [dep, range] of Object.entries(all)) if (dep in rootAll && dep !== 'playwright') expect(rootAll[dep], dep).toBe(range)
  })
})

describe('type safety at the presentation boundary', () => {
  it('kit, sample, and template contain no casts, suppressions, or erased payload types', () => {
    const files = [...kitFiles(), ...walk('src/presentations'), ...walk('skills/presentation/templates/presentation')].filter((f) => /\.tsx?$/.test(f))
    for (const f of files) {
      const src = read(f)
      expect(src, f).not.toMatch(/\bas\s+any\b|\bas\s+unknown\s+as\b|@ts-ignore|@ts-nocheck|@ts-expect-error|:\s*any\b|<any>/)
    }
  })

  it('the typed-boundary fixture lives inside the type-checked project', () => {
    expect(read('tsconfig.app.json')).toMatch(/"include":\s*\["src"\]/)
    expect(exists('src/type-fixtures/typed-boundary.tsx')).toBe(true)
    expect(read('src/type-fixtures/typed-boundary.tsx').match(/@ts-expect-error/g)?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('npm scripts and test layout', () => {
  const pkg = JSON.parse(read('package.json'))

  it('keeps npm test to the fast unit config and puts slower suites behind their own scripts', () => {
    expect(pkg.scripts.test).toBe('vitest run --config vitest.config.ts')
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(pkg.scripts['test:e2e']).toContain('vitest.e2e.config.ts')
    expect(read('vitest.config.ts')).toContain("'tests/unit/**/*.test.{ts,tsx}'")
    expect(read('vitest.integration.config.ts')).toContain("'tests/integration/**/*.test.ts'")
    expect(read('vitest.e2e.config.ts')).toContain("'tests/e2e/**/*.test.ts'")
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs --reference-sample')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('unit tests launch no browser, build, install, or long-lived subprocess', () => {
    for (const f of walk('tests/unit').filter((x) => x !== 'tests/unit/contracts.test.ts')) {
      expect(read(f), f).not.toMatch(/chromium\.launch|from 'playwright'|spawnSync|execSync|\bspawn\(|['"`]npm['"`]|vite build/)
    }
  })

  it('the integration and end-to-end suites hold exactly the named tests', () => {
    const names = (dir: string) => walk(dir).map((f) => path.basename(f)).sort()
    expect(names('tests/integration')).toEqual(['int-001-bootstrap.test.ts', 'int-002-inspection.test.ts'])
    expect(names('tests/e2e')).toEqual(['e2e-001-verify.test.ts', 'e2e-002-failures.test.ts'])
  })
})

describe('repository hygiene', () => {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' })

  it('ignores build output, dependencies, and inspection screenshots', () => {
    const ignored = git('check-ignore', 'dist/index.html', 'node_modules/x/index.js', '.inspection/demo/step-01.png', `${BOOTSTRAP}/node_modules/x`).trim().split('\n')
    expect(ignored).toHaveLength(4)
    const tplIgnore = read(`${BOOTSTRAP}/.gitignore`)
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(tplIgnore).toContain(entry)
  })

  it('tracks no generated artifacts or dependencies, and no hosted CI configuration', () => {
    const tracked = git('ls-files').split('\n').filter(Boolean)
    expect(tracked.filter((f) => /(^|\/)(node_modules|dist|\.inspection)\//.test(f) || (/\.(png|jpe?g)$/.test(f) && !f.startsWith('src/assets/')))).toEqual([])
    expect(tracked.filter((f) => /^\.github\/|\.gitlab-ci|\.circleci|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
    expect(exists('.github')).toBe(false)
  })
})
