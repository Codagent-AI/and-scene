// INT-001: the distributable bootstrap works outside the repository that authored it.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { repoRoot, run, tempDir } from '../helpers/process.mjs'

const skillDir = path.join(repoRoot, 'skills', 'presentation')
const cli = path.join(skillDir, 'scripts', 'cli.mjs')

let work
let app
let elsewhere
let scaffoldOut
let verifyOut

const files = (dir, skip = () => false) =>
  fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => fs.statSync(path.join(dir, f)).isFile() && !skip(f))
    .sort()
const isTest = (f) => /(^|[\\/])__tests__[\\/]|\.test\.[tj]sx?$/.test(f)

beforeAll(() => {
  work = tempDir('int-001')
  app = path.join(work, 'fresh-app')
  elsewhere = path.join(work, 'unrelated-cwd')
  fs.mkdirSync(app)
  fs.mkdirSync(elsewhere)
  // Everything runs from a working directory that is not the source repository or the app.
  scaffoldOut = run('node', [cli, 'scaffold', '--project', app], { cwd: elsewhere })
  const created = run('node', [cli, 'create', '--project', app, '--slug', 'smoke', '--title', 'Smoke Test'], { cwd: elsewhere })
  expect(created.status, created.out).toBe(0)
  // A title full of quote characters must still produce a presentation that builds.
  const quoted = run('node', [cli, 'create', '--project', app, '--slug', 'quoted', '--title', 'A "quoted" \\ topic, it\'s fine'], { cwd: elsewhere })
  expect(quoted.status, quoted.out).toBe(0)
  const install = run('npm', ['ci'], { cwd: app })
  expect(install.status, install.out).toBe(0)
  verifyOut = run('npm', ['run', 'verify'], { cwd: app })
})

afterAll(() => fs.rmSync(work, { recursive: true, force: true }))

describe('INT-001 materialized bootstrap', () => {
  it('scaffolds into an empty directory from a different working directory', () => {
    expect(scaffoldOut.status, scaffoldOut.out).toBe(0)
    const result = run('node', [cli, 'detect', '--project', app], { cwd: elsewhere })
    const detected = JSON.parse(result.out)
    expect(detected.anchors).toEqual({ build: true, kit: true, index: true })
    expect(detected.kind).toBe('existing-app')
    expect(detected.missing).toEqual([])
  })

  it('locates its templates from the skill directory, not the caller cwd or the source tree', () => {
    for (const f of files(app, (f) => f.startsWith('node_modules'))) {
      if (!/\.(ts|tsx|mjs|json|css|html)$/.test(f) || f.startsWith('package-lock')) continue
      expect(fs.readFileSync(path.join(app, f), 'utf8'), f).not.toContain(repoRoot)
    }
  })

  it('declares the complete dependency set and installs it from the committed lock data', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
    const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(declared, name).toContain(name)
      expect(fs.existsSync(path.join(app, 'node_modules', name)), `${name} installed`).toBe(true)
    }
    expect(fs.existsSync(path.join(app, 'package-lock.json'))).toBe(true)
  })

  it('provides the local verification and screenshot helpers as package scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.scripts.inspect).toBeTruthy()
    expect(fs.existsSync(path.join(app, 'scripts', 'verify.mjs'))).toBe(true)
    expect(fs.existsSync(path.join(app, 'scripts', 'inspect-presentation.mjs'))).toBe(true)
  })

  it('builds the materialized app and passes its local route smoke check on 127.0.0.1', () => {
    expect(verifyOut.status, verifyOut.out).toBe(0)
    expect(verifyOut.out).toMatch(/PASS verify/)
    expect(verifyOut.out).toMatch(/render: http:\/\/127\.0\.0\.1:\d+\/smoke/)
    expect(verifyOut.out).toMatch(/render: http:\/\/127\.0\.0\.1:\d+\/quoted/)
    expect(fs.existsSync(path.join(app, 'dist', 'index.html'))).toBe(true)
  })

  it('lints cleanly', () => {
    const lint = run('npm', ['run', 'lint'], { cwd: app })
    expect(lint.status, lint.out).toBe(0)
  })

  it('has all three anchors: build setup, scene kit, presentation index', () => {
    expect(fs.existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(app, 'src/presentations/index.ts'))).toBe(true)
    expect(fs.readFileSync(path.join(app, 'src/presentations/index.ts'), 'utf8')).toMatch(/slug: 'smoke'/)
  })

  it('keeps the materialized kit byte-aligned with the canonical kit', () => {
    const canonical = files(path.join(repoRoot, 'src/presentation-kit'), isTest)
    const copied = files(path.join(app, 'src/presentation-kit'), isTest)
    expect(copied).toEqual(canonical)
    for (const f of canonical) {
      expect(fs.readFileSync(path.join(app, 'src/presentation-kit', f)).equals(fs.readFileSync(path.join(repoRoot, 'src/presentation-kit', f))), f).toBe(true)
    }
  })

  it('imposes no styling framework and no visual defaults', () => {
    expect(fs.existsSync(path.join(app, 'node_modules', 'tailwindcss'))).toBe(false)
    const pkg = fs.readFileSync(path.join(app, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind|postcss/i)
    expect(fs.readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
    expect(files(path.join(app, 'src/presentation-kit')).filter((f) => f.endsWith('.css'))).toEqual([])
    // Only the host shell and the presentation's own stylesheet exist; the latter has no declarations.
    const css = files(path.join(app, 'src')).filter((f) => f.endsWith('.css'))
    expect(css.sort()).toEqual(['index.css', 'presentations/quoted/quoted.css', 'presentations/smoke/smoke.css'])
    const own = fs.readFileSync(path.join(app, 'src/presentations/smoke/smoke.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(own.trim()).toBe('')
    // The host stylesheet is a reset: no colours, fonts, spacing scale, borders or shadows.
    const host = fs.readFileSync(path.join(app, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace('box-sizing: border-box', '')
    expect(host).not.toMatch(/color|background|font|padding|gap|border|shadow|radius|--[a-z]/i)
  })
})
