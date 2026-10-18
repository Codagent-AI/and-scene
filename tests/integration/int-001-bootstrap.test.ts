import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, inject } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { listFiles, read, ROOT } from '../unit/helpers'
import { run } from './run'

const appDir = inject('appDir')
const scaffold = inject('scaffoldResult')

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('was materialized outside the source repository from a foreign cwd', () => {
    expect(path.relative(ROOT, appDir).startsWith('..')).toBe(true)
    expect(scaffold.kind).toBe('empty')
    expect(scaffold.written).toContain('src/presentation-kit/Presentation.tsx')
  })

  it('has all three anchors and the complete installed dependency set', () => {
    expect(detectAnchors(appDir)).toEqual({ build: true, kit: true, index: true })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'playwright'])
      expect(fs.existsSync(path.join(appDir, 'node_modules', dep, 'package.json')), dep).toBe(true)
  })

  it('builds', () => {
    const r = run('npm', ['run', 'build'], appDir)
    expect(r.output).toContain('built in')
    expect(r.status).toBe(0)
  })

  it('lints', () => {
    expect(run('npm', ['run', 'lint'], appDir).status).toBe(0)
  })

  it('renders its registered route through its local verification entry point on 127.0.0.1', () => {
    const r = run('npm', ['run', 'verify'], appDir)
    expect(r.status, r.output).toBe(0)
    expect(r.output).toMatch(/sample: "example" is registered/)
    expect(r.output).toMatch(/preview http:\/\/127\.0\.0\.1:\d+/)
    expect(r.output).toMatch(/step 3\/3 \(index 2\) ok/)
    expect(r.output).toMatch(/PASS verify/)
    expect(r.output).not.toMatch(/localhost/)
  })

  it('keeps the non-test scene kit and scripts aligned with the canonical sources', () => {
    for (const rel of ['src/presentation-kit', 'scripts']) {
      const canonical = path.join(ROOT, rel)
      const files = listFiles(canonical, { skipTests: true })
      expect(listFiles(path.join(appDir, rel))).toEqual(files)
      for (const f of files) expect(fs.readFileSync(path.join(appDir, rel, f)).equals(fs.readFileSync(path.join(canonical, f))), f).toBe(true)
    }
  })

  it('introduces no styling framework or kit-owned visual defaults', () => {
    const pkg = JSON.parse(read(appDir, 'package.json'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => /tailwind|styled|emotion/.test(n))).toEqual([])
    expect(fs.existsSync(path.join(appDir, 'node_modules/tailwindcss'))).toBe(false)
    expect(listFiles(path.join(appDir, 'src/presentation-kit')).filter((f) => f.endsWith('.css'))).toEqual([])
  })

  it('does not reach back into the source checkout', () => {
    const files = [...listFiles(path.join(appDir, 'src')).map((f) => `src/${f}`), ...listFiles(path.join(appDir, 'scripts')).map((f) => `scripts/${f}`), 'package.json', 'vite.config.ts', 'tsconfig.app.json']
    for (const f of files) {
      const text = read(appDir, f)
      expect(text, f).not.toContain(ROOT)
      expect(text, f).not.toMatch(/from\s+['"]\.\.\/\.\.\/\.\.\/(src|skills)/)
    }
  })
})
