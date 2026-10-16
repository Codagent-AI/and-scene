// INT-001: the bootstrap snapshot, materialized outside the repo, builds and renders a template-made presentation.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES = path.join(SKILL_DIR, 'templates')
const SLUG = 'int-throwaway'
let app = ''
let outside = ''

function sh(args: string[], cwd: string) {
  const r = spawnSync('npm', args, { cwd, encoding: 'utf8', env: { ...process.env, CI: '1' }, timeout: 300_000 })
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` }
}

describe('INT-001 materialized bootstrap', () => {
  beforeAll(() => {
    outside = mkdtempSync(path.join(os.tmpdir(), 'and-scene-int-'))
    app = path.join(outside, 'app')
    cpSync(path.join(TEMPLATES, 'bootstrap'), app, {
      recursive: true,
      filter: (s) => !/[\\/](node_modules|dist|\.inspection)$/.test(s),
    })
    const dest = path.join(app, 'src/presentations', SLUG)
    cpSync(path.join(TEMPLATES, 'presentation'), dest, { recursive: true })
    rmSync(path.join(dest, 'registry-entry.txt'))
    // Re-fill placeholders in copied files (names and contents).
    const files = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of files(dest)) {
      writeFileSync(f, readFileSync(f, 'utf8').replaceAll('__SLUG__', SLUG).replaceAll('__TITLE__', 'Throwaway'))
    }
    cpSync(path.join(dest, '__SLUG__.css'), path.join(dest, `${SLUG}.css`))
    rmSync(path.join(dest, '__SLUG__.css'))
    const entry = readFileSync(path.join(TEMPLATES, 'presentation/registry-entry.txt'), 'utf8')
      .replaceAll('__SLUG__', SLUG)
      .replaceAll('__TITLE__', 'Throwaway')
      .trimEnd()
    const idx = path.join(app, 'src/presentations/index.ts')
    const registrySource = readFileSync(idx, 'utf8')
    const registryAnchor = /(presentations: PresentationEntry\[\] = \[\n)/
    if (!registryAnchor.test(registrySource)) {
      throw new Error('bootstrap registry no longer matches the entry-splice anchor in src/presentations/index.ts')
    }
    writeFileSync(idx, registrySource.replace(registryAnchor, `$1${entry}\n`))
  })

  afterAll(() => {
    if (outside) rmSync(outside, { recursive: true, force: true })
  })

  it('installs, builds, lints, and passes verify/inspect from outside the repo', () => {
    expect(path.relative(SKILL_DIR, app).startsWith('..')).toBe(true)
    const install = sh(['ci', '--no-audit', '--no-fund'], app)
    expect(install.code, install.out).toBe(0)
    const pw = spawnSync('npx', ['playwright', 'install', 'chromium'], { cwd: app, encoding: 'utf8', timeout: 300_000 })
    expect(pw.status, pw.stderr).toBe(0)

    for (const script of [['run', 'build'], ['run', 'lint'], ['run', 'verify', '--', '--slug', SLUG]]) {
      const r = sh(script, app)
      expect(r.code, `${script.join(' ')}\n${r.out}`).toBe(0)
    }
    const insp = sh(['run', 'inspect', '--', SLUG, '--no-build'], app)
    expect(insp.code, insp.out).toBe(0)
    expect(existsSync(path.join(app, '.inspection', SLUG, 'step-01.png'))).toBe(true)
  })

  it('keeps anchors, dependency set, and style neutrality', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies).toHaveProperty(d)
    for (const d of ['vite', '@vitejs/plugin-react', 'typescript', 'eslint', 'playwright']) expect(pkg.devDependencies).toHaveProperty(d)
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
    for (const p of ['src/presentation-kit/index.ts', 'src/presentations/index.ts', 'vite.config.ts'])
      expect(existsSync(path.join(app, p)), p).toBe(true)
    expect(readFileSync(path.join(app, 'src/index.css'), 'utf8')).not.toMatch(/color|font|background/)
  })
})
