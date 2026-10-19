import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { listFiles, read, text } from '../helpers/tree.ts'

const BOOT = 'skills/presentation/templates/bootstrap'
const PRES = 'skills/presentation/templates/presentation'

describe('template drift', () => {
  it('keeps the bootstrap kit byte-identical to the canonical kit, with no extra or missing files', () => {
    const canon = listFiles('src/presentation-kit')
    expect(listFiles(join(BOOT, 'src/presentation-kit'))).toEqual(canon)
    for (const f of canon) {
      expect(read(join(BOOT, 'src/presentation-kit', f)).equals(read(join('src/presentation-kit', f))), f).toBe(true)
    }
  })

  it('keeps verify and inspect scripts (and their library) byte-identical to the bootstrap copies', () => {
    const scripts = listFiles('scripts').filter((f) => f !== 'verify-manifest.json')
    expect(scripts.sort()).toEqual(['inspect-presentation.mjs', 'lib/preview.mjs', 'verify.mjs'])
    expect(listFiles(join(BOOT, 'scripts')).filter((f) => f !== 'verify-manifest.json')).toEqual(scripts)
    for (const f of scripts) expect(read(join(BOOT, 'scripts', f)).equals(read(join('scripts', f))), f).toBe(true)
  })

  it('keeps separate manifests: the repository expects the sample, the template its starter', () => {
    const root = JSON.parse(text('scripts/verify-manifest.json'))
    const boot = JSON.parse(text(join(BOOT, 'scripts/verify-manifest.json')))
    expect(root.slug).toBe('how-to-make-a-presentation')
    expect(root.steps).toHaveLength(9)
    expect(boot.slug).toBe('starter')
    expect(boot.steps.length).toBeGreaterThan(1)
    expect(text(join(BOOT, 'src/presentations/index.ts'))).toMatch(/slug: 'starter'/)
    for (const m of [root, boot]) for (const key of ['registry', 'narration']) expect(m[key]).toMatch(/^src\//)
  })

  it('keeps the shared host files aligned (router, landing, entry point)', () => {
    for (const f of ['Router.tsx', 'Landing.tsx', 'main.tsx']) {
      expect(read(join(BOOT, 'src', f)).equals(read(join('src', f))), f).toBe(true)
    }
  })
})

describe('bootstrap template', () => {
  const pkg = JSON.parse(text(join(BOOT, 'package.json')))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const lock = JSON.parse(text(join(BOOT, 'package-lock.json')))

  it('declares the complete dependency set and a committed lock for it', () => {
    for (const d of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
      '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(deps, d).toHaveProperty(d)
      expect(lock.packages[`node_modules/${d}`], `lock has ${d}`).toBeDefined()
    }
  })

  it('has the build, lint, verify and inspect scripts', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(Object.keys(pkg.scripts)).toEqual(expect.arrayContaining(['lint', 'verify', 'inspect']))
  })

  it('has the three anchors: build setup, scene kit, presentation index', () => {
    for (const f of ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'src/main.tsx', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx', 'src/presentations/index.ts']) {
      expect(existsSync(join(BOOT, f)), f).toBe(true)
    }
  })

  it('imposes no styling framework and ships no styling defaults', () => {
    expect(Object.keys(deps).filter((d) => /tailwind|styled|emotion|sass|postcss/i.test(d))).toEqual([])
    expect(text(join(BOOT, 'vite.config.ts'))).not.toMatch(/tailwind/i)
    const declarations = /[^{}/*]+\{[^}]*:[^}]*\}/
    for (const f of listFiles(BOOT).filter((x) => x.endsWith('.css'))) {
      expect(text(join(BOOT, f)).replace(/\/\*[\s\S]*?\*\//g, ''), f).not.toMatch(declarations)
    }
    for (const f of listFiles(BOOT).filter((x) => /\.(tsx?|html)$/.test(x))) {
      expect(text(join(BOOT, f)), f).not.toMatch(/tailwind/i)
    }
  })

  it('ships a starter presentation that the starter manifest describes', () => {
    const boot = JSON.parse(text(join(BOOT, 'scripts/verify-manifest.json')))
    const src = text(join(BOOT, 'src/presentations/starter/narration.ts'))
    const steps = [...src.matchAll(/era: '([^']*)', title: '([^']*)', caption: '([^']*)'/g)].map((m) => ({ era: m[1], title: m[2], caption: m[3] }))
    expect(steps).toEqual(boot.steps)
  })
})

describe('presentation template', () => {
  it('provides the per-presentation files with the placeholders to fill', () => {
    expect(listFiles(PRES)).toEqual(['Scene.tsx', 'Talk.tsx', 'entities.ts', 'narration.ts', 'steps.ts', 'talk.css'])
    expect(text(join(PRES, 'narration.ts'))).toContain('__TITLE__')
    expect(text(join(PRES, 'entities.ts'))).toContain('__SLUG__')
  })

  it('is the source of the starter presentation (no drift)', () => {
    for (const f of listFiles(PRES)) {
      const expected = text(join(PRES, f)).replaceAll('__TITLE__', 'Starter presentation').replaceAll('__SLUG__', 'starter')
      expect(text(join(BOOT, 'src/presentations/starter', f)), f).toBe(expected)
    }
  })

  it('uses a persistent grouped scene with newcomer-only entrance', () => {
    expect(text(join(PRES, 'steps.ts'))).toMatch(/groupKey/)
    expect(text(join(PRES, 'Scene.tsx'))).toMatch(/enter=\{e\.from === payload\.stage\}/)
  })
})
