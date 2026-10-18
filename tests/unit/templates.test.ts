import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOOTSTRAP, diffTrees, listFiles, read } from '../support/fs'

const bootstrap = (f: string) => path.join(BOOTSTRAP, f)
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'))

describe('template parity with the canonical sources', () => {
  it('keeps src/presentation-kit byte-aligned with the bootstrap copy', () => {
    expect(diffTrees('src/presentation-kit', bootstrap('src/presentation-kit'))).toEqual([])
  })

  it('keeps the verification and inspection scripts (and their shared library) byte-aligned', () => {
    expect(diffTrees('scripts', bootstrap('scripts'))).toEqual([])
    expect(existsSync(bootstrap('scripts/verify.mjs'))).toBe(true)
    expect(existsSync(bootstrap('scripts/inspect-presentation.mjs'))).toBe(true)
  })

  it.each(['src/main.tsx', 'src/Landing.tsx', 'src/router.tsx', 'src/routes.ts', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts'])(
    'keeps %s identical to the bootstrap copy',
    (f) => {
      expect(read(f).equals(read(bootstrap(f)))).toBe(true)
    },
  )
})

describe('bootstrap template contents', () => {
  const pkg = json(bootstrap('package.json'))
  const lock = json(bootstrap('package-lock.json'))

  it('declares and locks the complete dependency set', () => {
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint',
      'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(declared, dep).toHaveProperty(dep)
      expect(lock.packages, dep).toHaveProperty(`node_modules/${dep}`)
    }
  })

  it('has working build, lint, verify and inspect entry points', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.lint).toBe('eslint .')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('provides the three anchors: build setup, scene kit and a registered presentation index', () => {
    for (const f of ['vite.config.ts', 'tsconfig.app.json', 'index.html', 'src/main.tsx']) expect(existsSync(bootstrap(f)), f).toBe(true)
    for (const f of ['types.ts', 'Stage.tsx', 'Presentation.tsx', 'usePresentationNav.ts', 'useFitScale.ts', 'chrome/Toc.tsx']) {
      expect(existsSync(bootstrap(`src/presentation-kit/${f}`)), f).toBe(true)
    }
    expect(readFileSync(bootstrap('src/presentations/index.ts'), 'utf8')).toContain("slug: 'starter'")
    expect(json(bootstrap('verify.config.json')).presentations).toEqual([{ slug: 'starter', title: 'Starter presentation' }])
  })

  it('requires no styling framework and ships no visual defaults', () => {
    const banned = /tailwind|styled-components|@emotion|bootstrap|@mui|chakra|unocss/i
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => banned.test(d))).toEqual([])
    expect(Object.keys(lock.packages).filter((d) => banned.test(d))).toEqual([])
    expect(readFileSync(bootstrap('vite.config.ts'), 'utf8')).not.toMatch(banned)
    const styles = listFiles(BOOTSTRAP).filter((f) => f.endsWith('.css'))
    expect(styles.length).toBeGreaterThan(0)
    for (const f of styles) {
      const css = readFileSync(bootstrap(f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css.trim(), f).toBe('')
    }
  })

  it('is not the nine-step sample: its verify config does not require the reference presentation', () => {
    expect(readFileSync(bootstrap('verify.config.json'), 'utf8')).not.toContain('how-to-make-a-presentation')
    expect(existsSync(bootstrap('src/presentations/how-to-make-a-presentation'))).toBe(false)
  })
})

describe('presentation templates', () => {
  const dir = 'skills/presentation/templates/presentation'
  it('produce the starter presentation when filled in, so the two cannot drift', () => {
    const fill = (s: string) => s.replaceAll('__SLUG__', 'starter').replaceAll('__TITLE__', 'Starter presentation').replaceAll('__CLASS__', 'starter')
    const pairs: [string, string][] = [
      ['entities.ts.tmpl', 'entities.ts'],
      ['steps/narration.ts.tmpl', 'steps/narration.ts'],
      ['steps/Scene.tsx.tmpl', 'steps/Scene.tsx'],
      ['steps/index.ts.tmpl', 'steps/index.ts'],
      ['Talk.tsx.tmpl', 'Talk.tsx'],
      ['talk.css.tmpl', 'talk.css'],
    ]
    for (const [tmpl, out] of pairs) {
      expect(fill(readFileSync(path.join(dir, tmpl), 'utf8')), out).toBe(readFileSync(bootstrap(`src/presentations/starter/${out}`), 'utf8'))
    }
  })

  it('keeps registry-entry and CSS templates presentation-owned (no kit styling, no framework)', () => {
    expect(readFileSync(path.join(dir, 'registry-entry.txt.tmpl'), 'utf8')).toContain("import('./__SLUG__/Talk')")
    expect(readFileSync(path.join(dir, 'talk.css.tmpl'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
  })
})

describe('repository hygiene', () => {
  it('has no hosted CI configuration', () => {
    expect(existsSync('.github/workflows')).toBe(false)
  })
})
