import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps } from './helpers'

const BOOTSTRAP = 'skills/presentation/templates/bootstrap'
const KIT = 'src/presentation-kit'
const read = (p: string) => readFileSync(p, 'utf8')
const json = (p: string) => JSON.parse(read(p))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules') return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const tracked = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

describe('kit is style-neutral', () => {
  const files = walk(KIT)
  const code = files.filter((f) => /\.(ts|tsx)$/.test(f))

  it('ships only TypeScript sources: no stylesheets or style assets', () => {
    expect(files.filter((f) => !/\.(ts|tsx)$/.test(f))).toEqual([])
  })

  it('has no visual style properties, color literals, or class names in its source', () => {
    const visualProps =
      /\b(color|background\w*|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|fontStyle|padding\w*|margin\w*|gap|rowGap|columnGap|outline\w*|textDecoration\w*|filter|listStyle\w*|cursor|fill|stroke\w*)\s*[:=]/
    for (const f of code) {
      const src = stripComments(read(f))
      expect(src, f).not.toMatch(visualProps)
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(src, f).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|var)\(/)
      expect(src, f).not.toMatch(/className\s*=\s*["'{`]\s*["'`]/)
      expect(src, f).not.toMatch(/import\s+['"][^'"]*\.(css|scss|sass|less)['"]/)
    }
  })

  it('imports only react, motion, lucide-react types, and relative files', () => {
    for (const f of code) {
      for (const m of read(f).matchAll(/from\s+'([^']+)'/g)) {
        expect(m[1], `${f} imports ${m[1]}`).toMatch(/^(\.|react$|motion\/react$|lucide-react$)/)
      }
    }
  })

  it('renders unstyled: inline styles are layout geometry and motion behavior only', () => {
    const allowed = new Set([
      'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction',
      'align-items', 'justify-content', 'overflow', 'white-space', 'text-overflow', 'min-width', 'pointer-events',
      'opacity', 'transform', 'transform-origin', 'scale',
    ])
    const { container } = render(createElement(Presentation, { steps: makeSteps(4), title: 'Deck' }))
    const used = new Set<string>()
    for (const el of container.querySelectorAll<HTMLElement>('[style]')) {
      for (let i = 0; i < el.style.length; i++) used.add(el.style.item(i))
    }
    expect([...used].filter((p) => !allowed.has(p))).toEqual([])
    expect(container.querySelector('style, link[rel=stylesheet]')).toBeNull()
  })
})

describe('no styling framework is required', () => {
  const manifests = ['package.json', `${BOOTSTRAP}/package.json`, 'package-lock.json', `${BOOTSTRAP}/package-lock.json`]

  it.each(manifests)('%s lists no Tailwind packages', (file) => {
    expect(read(file)).not.toMatch(/tailwind/i)
  })

  it.each(['vite.config.ts', `${BOOTSTRAP}/vite.config.ts`])('%s has no Tailwind plugin', (file) => {
    expect(read(file)).not.toMatch(/tailwind/i)
  })

  it('keeps the bootstrap template free of presentation styling defaults', () => {
    const cssFiles = walk(BOOTSTRAP).filter((f) => f.endsWith('.css'))
    expect(cssFiles.sort()).toEqual([`${BOOTSTRAP}/src/index.css`, `${BOOTSTRAP}/src/presentations/example/styles.css`].sort())
    expect(read(`${BOOTSTRAP}/src/index.css`).replace(/\s+/g, ' ').trim()).toBe('html, body, #root { height: 100%; }')
    expect(stripComments(read(`${BOOTSTRAP}/src/presentations/example/styles.css`)).trim()).toBe('')
    expect(existsSync(`${BOOTSTRAP}/tailwind.config.js`)).toBe(false)
  })
})

describe('bootstrap template is complete', () => {
  const pkg = json(`${BOOTSTRAP}/package.json`)
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  it.each([
    'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
    '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh', 'globals', 'playwright',
  ])('declares %s and locks it', (name) => {
    expect(deps[name], name).toBeTruthy()
    const lock = json(`${BOOTSTRAP}/package-lock.json`)
    expect(lock.packages[`node_modules/${name}`], `${name} in lock`).toBeTruthy()
    expect(lock.packages[''].dependencies?.[name] ?? lock.packages[''].devDependencies?.[name]).toBe(deps[name])
  })

  it('has the three contract anchors and the scripts a presentation needs', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    for (const s of ['dev', 'lint', 'preview', 'verify', 'inspect']) expect(pkg.scripts[s], s).toBeTruthy()
    for (const f of ['vite.config.ts', 'tsconfig.json', 'index.html', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentations/index.ts', 'src/router.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'gitignore.template']) {
      expect(existsSync(`${BOOTSTRAP}/${f}`), f).toBe(true)
    }
  })

  it('verifies a route that its registry actually lists', () => {
    const registry = read(`${BOOTSTRAP}/src/presentations/index.ts`)
    for (const route of json(`${BOOTSTRAP}/verify.config.json`).routes) {
      expect(registry).toContain(`slug: '${route.slug}'`)
      expect(existsSync(`${BOOTSTRAP}/src/presentations/${route.slug}/Talk.tsx`)).toBe(true)
    }
  })
})

describe('canonical sources and template copies stay aligned', () => {
  const compare = (canonical: string, copy: string) => {
    const rel = (root: string) => walk(root).map((f) => path.relative(root, f)).sort()
    expect(rel(copy)).toEqual(rel(canonical))
    for (const f of rel(canonical)) {
      expect(read(path.join(copy, f)) === read(path.join(canonical, f)), `${f} differs`).toBe(true)
    }
  }
  it('keeps src/presentation-kit byte-aligned with the bootstrap copy', () => compare(KIT, `${BOOTSTRAP}/src/presentation-kit`))
  it('keeps root scripts byte-aligned with the bootstrap copies', () => compare('scripts', `${BOOTSTRAP}/scripts`))
  it('keeps the router, landing page, and entry point aligned', () => {
    for (const f of ['router.tsx', 'routes.ts', 'Landing.tsx', 'main.tsx']) {
      expect(read(`${BOOTSTRAP}/src/${f}`) === read(`src/${f}`), f).toBe(true)
    }
  })
})

describe('loopback address', () => {
  const scriptFiles = (root: string) => walk(root).filter((f) => f.endsWith('.mjs'))
  it.each(['scripts', `${BOOTSTRAP}/scripts`])('%s never uses localhost and defines 127.0.0.1 in one place', (root) => {
    const defs: string[] = []
    for (const f of scriptFiles(root)) {
      const src = stripComments(read(f))
      expect(src, f).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
      if (src.includes('127.0.0.1')) defs.push(path.basename(f))
    }
    expect(defs).toEqual(['loopback.mjs'])
  })
  it('feeds the preview host, probe, and browser URLs from the one constant', () => {
    const preview = read('scripts/lib/preview.mjs')
    expect(preview).toMatch(/'--host',\s*LOOPBACK_HOST/)
    expect(preview).toMatch(/originOf\(chosen\)/)
    expect(preview).toMatch(/waitForReady\(`\$\{origin\}\//)
    expect(read('scripts/lib/verify-core.mjs')).toMatch(/preview\.origin/)
  })
})

describe('repository hygiene', () => {
  let files: string[]
  beforeAll(() => {
    files = tracked()
  })

  it('keeps npm test to the fast unit suite and puts slow suites behind separate scripts', () => {
    const pkg = json('package.json')
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('tests/integration')
    expect(pkg.scripts['test:e2e']).toContain('tests/e2e')
    const fast = read('vitest.config.ts')
    expect(fast).toContain("include: ['tests/unit/**/*.test.{ts,tsx}']")
    expect(fast).not.toMatch(/integration|e2e/)
    expect(read('vitest.integration.config.ts')).toMatch(/tests\/integration[\s\S]*tests\/e2e/)
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('adds no CI configuration, dependency directories, build output, or screenshots', () => {
    const banned = /(^|\/)(\.github|\.circleci|node_modules|dist|inspection-output)(\/|$)|(^|\/)(\.gitlab-ci\.yml|Jenkinsfile|azure-pipelines\.yml|\.travis\.yml|bitbucket-pipelines\.yml)$/
    expect(files.filter((f) => banned.test(f))).toEqual([])
    expect(files.filter((f) => /\.(png|jpe?g|webp)$/.test(f) && !f.startsWith('public/'))).toEqual([])
  })

  it('ignores generated output in the repository and in the bootstrap template', () => {
    for (const f of ['.gitignore', `${BOOTSTRAP}/gitignore.template`]) {
      const ignore = read(f).split('\n')
      for (const entry of ['node_modules', 'dist', 'inspection-output']) expect(ignore, `${f}: ${entry}`).toContain(entry)
    }
  })

  it('keeps StrictMode on in the app entry point', () => {
    expect(read('src/main.tsx')).toContain('<StrictMode>')
    expect(read(`${BOOTSTRAP}/src/main.tsx`)).toContain('<StrictMode>')
  })
})

describe('typed boundary has no escape hatches', () => {
  it.each([
    'src/presentations/how-to-make-a-presentation/Talk.tsx',
    'src/presentations/how-to-make-a-presentation/Scene.tsx',
    ...walk('src/presentations/how-to-make-a-presentation/steps'),
    `${BOOTSTRAP}/src/presentations/example/Talk.tsx`,
  ])('%s has no casts, any, or suppression comments', (f) => {
    const src = read(f)
    expect(src).not.toMatch(/\bas\s+(any|unknown|never|[A-Z]\w*)\b|:\s*any\b|<any>|@ts-ignore|@ts-nocheck|@ts-expect-error|eslint-disable/)
  })

  it('keeps the compile-time negative fixtures in the type-checked project', () => {
    const fixture = read('tests/types/steps.types.tsx')
    expect(fixture.match(/@ts-expect-error/g)!.length).toBeGreaterThanOrEqual(8)
    expect(json('tsconfig.json').references.map((r: { path: string }) => r.path)).toContain('./tsconfig.tests.json')
    expect(json('tsconfig.tests.json').include).toContain('tests')
  })
})

describe('sample styling is presentation-owned', () => {
  it('styles the actual active-state and attribution hooks in the sample CSS, never the kit', () => {
    const css = read('src/presentations/how-to-make-a-presentation/styles.css')
    const talk = read('src/presentations/how-to-make-a-presentation/Talk.tsx')
    expect(talk).toContain("import './styles.css'")
    for (const sel of [
      '[data-presentation-progress-item][data-presentation-active]',
      '[data-presentation-toc-item][data-presentation-active]',
      '[data-presentation-attribution]',
    ]) {
      expect(css, sel).toContain(sel)
    }
    const { container } = render(createElement(Presentation, { steps: makeSteps(4), title: 'Deck' }))
    expect(container.querySelector('[data-presentation-progress-item][data-presentation-active]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-toc-item][data-presentation-active]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-attribution]')).not.toBeNull()
    expect(walk(KIT).some((f) => f.endsWith('.css'))).toBe(false)
  })
})
