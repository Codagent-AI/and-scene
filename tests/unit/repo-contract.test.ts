import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { listFiles, SYNCED, TEMPLATE } from '../../scripts/sync-templates.mjs'
import { ROOT } from '../helpers/spec-outline'

const read = (...p: string[]) => readFileSync(path.join(ROOT, ...p), 'utf8')
const json = (...p: string[]) => JSON.parse(read(...p))
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

describe('template parity (byte-aligned snapshot)', () => {
  it('keeps every canonical kit file identical to its bootstrap copy, with no extra or missing files', () => {
    const canonical = listFiles(path.join(ROOT, 'src/presentation-kit'))
    const snapshot = listFiles(path.join(TEMPLATE, 'src/presentation-kit'))
    expect(snapshot).toEqual(canonical)
    for (const f of canonical) {
      expect(readFileSync(path.join(TEMPLATE, 'src/presentation-kit', f)), f).toEqual(readFileSync(path.join(ROOT, 'src/presentation-kit', f)))
    }
  })

  it('keeps the verify and inspect scripts (and their libraries) identical to the template copies', () => {
    const scripts = ['verify.mjs', 'inspect-presentation.mjs', ...listFiles(path.join(ROOT, 'scripts/lib')).map((f) => path.join('lib', f))]
    expect(listFiles(path.join(TEMPLATE, 'scripts/lib'))).toEqual(listFiles(path.join(ROOT, 'scripts/lib')))
    for (const s of scripts) {
      expect(readFileSync(path.join(TEMPLATE, 'scripts', s)), s).toEqual(readFileSync(path.join(ROOT, 'scripts', s)))
    }
  })

  it('mirrors every other synced path (run `npm run sync:templates` after changing them)', () => {
    for (const rel of SYNCED) {
      const a = path.join(ROOT, rel)
      const b = path.join(TEMPLATE, rel)
      const names = listFiles(a)
      if (names.length === 0) expect(readFileSync(b), rel).toEqual(readFileSync(a))
      else for (const n of names) expect(readFileSync(path.join(b, n)), `${rel}/${n}`).toEqual(readFileSync(path.join(a, n)))
    }
  })
})

describe('no styling framework is required', () => {
  const manifests = [['package.json'], ['package-lock.json'], ['skills/presentation/templates/bootstrap/package.json'], ['skills/presentation/templates/bootstrap/package-lock.json'], ['vite.config.ts'], ['skills/presentation/templates/bootstrap/vite.config.ts']]
  it.each(manifests)('%s mentions no Tailwind or other framework', (file) => {
    expect(read(file)).not.toMatch(/tailwind|styled-components|@mui\//i)
  })

  it('ships the bootstrap template with no CSS beyond an empty host stylesheet', () => {
    const css = listFiles(TEMPLATE).filter((f) => /\.(css|scss|sass|less)$/.test(f))
    expect(css).toEqual(['src/index.css'])
    expect(read('skills/presentation/templates/bootstrap/src/index.css').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
  })

  it('keeps visual defaults out of the template app sources', () => {
    const sources = listFiles(TEMPLATE).filter((f) => /\.(tsx?|html)$/.test(f) && !f.startsWith('src/presentation-kit/'))
    for (const f of sources) {
      expect(read('skills/presentation/templates/bootstrap', f), f).not.toMatch(/\b(?:backgroundColor|fontFamily|boxShadow|borderRadius)\s*:|#[0-9a-fA-F]{6}\b|<style/)
    }
  })
})

describe('package scripts and routing decisions', () => {
  const pkg = json('package.json')
  const template = json('skills/presentation/templates/bootstrap/package.json')

  it('keeps `npm test` to unit tests and puts browser-backed suites in a separate script', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    const unit = read('vitest.config.ts')
    const integration = read('vitest.integration.config.ts')
    expect(unit).toContain("'tests/unit/**/*.test.{ts,tsx}'")
    expect(unit).not.toContain('tests/integration')
    expect(integration).toContain("'tests/integration/**/*.test.ts'")
    for (const f of tracked.filter((t) => t.startsWith('tests/integration/'))) expect(f.endsWith('.test.ts')).toBe(true)
  })

  it('has verify and inspect entry points in the root and the template', () => {
    for (const p of [pkg, template]) {
      expect(p.scripts.verify).toBe('node scripts/verify.mjs')
      expect(p.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
      expect(p.scripts.build).toBe('tsc -b && vite build')
      expect(p.scripts.lint).toBeDefined()
    }
  })

  it('declares the whole scaffold dependency set in the template', () => {
    const all = { ...template.dependencies, ...template.devDependencies }
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) {
      expect(all[dep], dep).toBeDefined()
    }
  })

  it('routes by pathname with no routing library, and keeps StrictMode', () => {
    for (const base of ['', 'skills/presentation/templates/bootstrap/']) {
      const manifest = json(`${base}package.json`)
      expect(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter((d) => /router|wouter|reach/.test(d))).toEqual([])
      const router = read(`${base}src/Router.tsx`) + read(`${base}src/router.ts`)
      expect(router).not.toMatch(/react-router|wouter/)
      expect(read(`${base}src/router.ts`)).toContain('pathname')
      expect(read(`${base}src/main.tsx`)).toMatch(/<StrictMode>[\s\S]*<Router \/>[\s\S]*<\/StrictMode>/)
    }
  })

  it('registers presentations in an explicit list rather than a glob', () => {
    expect(read('src/presentations/index.ts')).not.toContain('import.meta.glob')
    expect(read('src/presentations/index.ts')).toMatch(/\{ slug: '[^']+', title: ('[^']+'|"[^"]+"), load: \(\) => import\(/)
  })
})

describe('loopback and repository hygiene', () => {
  it('uses 127.0.0.1 and never localhost in the verification and inspection scripts', () => {
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', ...listFiles(path.join(ROOT, 'scripts/lib')).map((f) => `scripts/lib/${f}`)]) {
      expect(read(rel), rel).not.toMatch(/localhost/i)
    }
    expect(read('scripts/lib/preview.mjs')).toContain("HOST = '127.0.0.1'")
    expect(read('scripts/verify.mjs')).toContain('freePort')
  })

  it('ignores build output, dependencies and inspection screenshots at the root and in the template', () => {
    for (const ignore of ['.gitignore', 'skills/presentation/templates/bootstrap/.gitignore']) {
      const lines = read(ignore).split('\n').map((l) => l.trim())
      for (const entry of ['node_modules', 'dist', 'inspection']) expect(lines, `${ignore} ignores ${entry}`).toContain(entry)
    }
  })

  it('tracks no generated output, dependencies, screenshots or CI configuration', () => {
    expect(existsSync(path.join(ROOT, '.github/workflows'))).toBe(false)
    for (const f of tracked) {
      expect(f, f).not.toMatch(/(^|\/)(node_modules|dist|dist-ssr|inspection)\//)
      expect(f, f).not.toMatch(/^\.github\//)
      expect(f, f).not.toMatch(/\.(png|jpe?g)$/)
    }
    expect(tracked).toContain('skills/presentation/templates/bootstrap/.gitignore')
    expect(tracked).toContain('skills/presentation/templates/bootstrap/package-lock.json')
    expect(tracked).toContain('skills/presentation/templates/bootstrap/scripts/verify.mjs')
  })
})
