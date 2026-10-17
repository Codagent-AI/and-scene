import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { BOOTSTRAP, cleanup, ROOT, run, tempDir, TOOL } from './helpers.ts'

afterAll(cleanup)

// INT-001: the distributable bootstrap works outside the repository that authored it.
describe('materialized bootstrap', () => {
  const app = tempDir('and-scene-bootstrap-')
  const elsewhere = tempDir('and-scene-cwd-')

  it('is scaffolded from a working directory outside the source repository', () => {
    const result = run('node', [TOOL, 'bootstrap', app, '--no-install'], elsewhere)
    expect(result.status, result.output).toBe(0)
    expect(JSON.parse(result.output.trim()).scaffolded).toEqual(['build', 'kit', 'index'])
    expect(run('node', [TOOL, 'detect', app], elsewhere).output).toContain('"missing": []')
    // Titles with quotes, backslashes, comment terminators and braces must still generate buildable code.
    const created = run('node', [TOOL, 'new', app, 'quoted-title', 'Say "hi" \\ */ {x} <b>'], elsewhere)
    expect(created.status, created.output).toBe(0)
  })

  it('installs from the committed lock data, builds, lints and passes the route smoke check', () => {
    for (const [args, label] of [[['ci'], 'npm ci'], [['run', 'build'], 'build'], [['run', 'lint'], 'lint'], [['run', 'verify'], 'verify']] as const) {
      const result = run('npm', [...args], app)
      expect(result.status, `${label}\n${result.output}`).toBe(0)
      if (label === 'verify') {
        expect(result.output).toContain('PASS')
        expect(result.output).toContain('starter: rendered 2 steps')
        expect(result.output).toContain('quoted-title: rendered 2 steps')
      }
    }
  })

  it('has all three anchors and the complete dependency set', () => {
    for (const file of ['package.json', 'vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/types.ts', 'src/presentations/index.ts', 'package-lock.json']) {
      expect(existsSync(path.join(app, file)), file).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const lock = readFileSync(path.join(app, 'package-lock.json'), 'utf8')
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect({ [dep]: { ...pkg.dependencies, ...pkg.devDependencies }[dep] !== undefined }).toEqual({ [dep]: true })
      expect(lock).toContain(`"node_modules/${dep}"`)
    }
    expect(Object.keys(pkg.dependencies)).not.toContain('tailwindcss')
    expect(readdirSync(path.join(app, 'node_modules')).some((n) => n.includes('tailwind'))).toBe(false)
  })

  it('stays byte-aligned with the canonical kit and scripts', () => {
    const files = [...readdirSync(path.join(ROOT, 'src/presentation-kit'), { recursive: true }).map(String).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.')).map((f) => `src/presentation-kit/${f}`), 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']
    for (const file of files) {
      expect(readFileSync(path.join(app, file)).equals(readFileSync(path.join(ROOT, file))), file).toBe(true)
      expect(readFileSync(path.join(BOOTSTRAP, file)).equals(readFileSync(path.join(ROOT, file))), file).toBe(true)
    }
  })
})
