import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, REPO, run, sourceState, tempDir, type Result } from './support'

const SCAFFOLD = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'dist') return []
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

// INT-001: the distributable bootstrap works outside the repository that authored it.
describe('INT-001: materialized bootstrap', () => {
  let app: string
  let before: string
  let install: Result
  let build: Result
  let lint: Result
  let verify: Result
  let detect: Result

  beforeAll(async () => {
    before = sourceState()
    app = tempDir('int1-app')
    const elsewhere = tempDir('int1-cwd')
    const applied = await run(process.execPath, [SCAFFOLD, 'apply', app], elsewhere)
    expect(applied.code, applied.output).toBe(0)
    install = await run('npm', ['ci'], app)
    build = await run('npm', ['run', 'build'], app)
    lint = await run('npm', ['run', 'lint'], app)
    verify = await run('npm', ['run', 'verify'], app)
    detect = await run(process.execPath, [SCAFFOLD, 'detect', app], elsewhere)
  })
  afterAll(cleanupTempDirs)

  it('installs from the committed lock data, builds, lints and passes its route smoke check (L-66, I-40, L-38)', () => {
    expect(install.code, install.output).toBe(0)
    expect(build.code, build.output).toBe(0)
    expect(lint.code, lint.output).toBe(0)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/VERIFY PASS: build, sample, render \(2 steps\) on 127\.0\.0\.1/)
  })

  it('contains all three anchors, detected from an unrelated working directory (L-37, L-41)', () => {
    expect(JSON.parse(detect.output).anchors).toEqual({ build: true, kit: true, index: true })
  })

  it('declares the complete dependency set in package and lock data (L-66)', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const lock = JSON.parse(readFileSync(path.join(app, 'package-lock.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    const required = [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
      'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]
    for (const name of required) {
      expect(declared[name], name).toBeTruthy()
      expect(lock.packages[`node_modules/${name}`], `lock ${name}`).toBeTruthy()
    }
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts[script], script).toBeTruthy()
  })

  it('is self-contained: scripts import only local files and nothing points back at the source repository (L-66, L-65)', () => {
    for (const file of walk(path.join(app, 'scripts'))) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toContain(REPO)
      for (const m of src.matchAll(/from '(\.[^']+)'/g)) expect(statSync(path.join(path.dirname(file), m[1]!)).isFile(), `${file} -> ${m[1]}`).toBe(true)
    }
    for (const file of walk(app).filter((f) => !f.endsWith('package-lock.json'))) expect(readFileSync(file, 'utf8'), file).not.toContain(REPO)
  })

  it('keeps kit and verification scripts aligned with the canonical sources and adds no style defaults (L-67, L-10, L-40)', () => {
    const kit = (root: string) => walk(path.join(root, 'src/presentation-kit')).filter((f) => !/\.test\./.test(f)).map((f) => path.relative(root, f)).sort()
    expect(kit(app)).toEqual(kit(REPO))
    for (const rel of [...kit(REPO), 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      expect(readFileSync(path.join(app, rel), 'utf8'), rel).toBe(readFileSync(path.join(REPO, rel), 'utf8'))
    }
    const lock = readFileSync(path.join(app, 'package-lock.json'), 'utf8')
    expect(lock).not.toMatch(/tailwind/i)
    expect(readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
    const css = walk(path.join(app, 'src')).filter((f) => f.endsWith('.css') && !f.includes('/presentations/'))
    expect(css.map((f) => path.relative(app, f))).toEqual(['src/index.css'])
    expect(walk(path.join(app, 'src/presentation-kit')).filter((f) => f.endsWith('.css'))).toEqual([])
  })

  it('leaves the source checkout unchanged (C-4)', () => {
    expect(sourceState()).toBe(before)
  })
})
