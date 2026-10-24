import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { detectTarget } from '../../skills/presentation/scripts/detect-target.mjs'
import { findDrift } from '../../scripts/sync-templates.mjs'
import { REPO, run, type RunResult } from '../helpers/project'

// INT-001: the distributable bootstrap snapshot works outside the repository that authored it.
const SKILL = join(REPO, 'skills', 'presentation')
const BOOTSTRAP = join(SKILL, 'templates', 'bootstrap')
const PRESENTATION = join(SKILL, 'templates', 'presentation')

function instantiate(app: string, slug: string, title: string) {
  const out = join(app, 'src', 'presentations', slug)
  const files: Array<[string, string]> = [
    ['entities.ts.tmpl', 'entities.ts'],
    ['steps/Scene.tsx.tmpl', 'steps/Scene.tsx'],
    ['steps/steps.ts.tmpl', 'steps/steps.ts'],
    ['Talk.tsx.tmpl', 'Talk.tsx'],
    ['styles.css.tmpl', 'styles.css'],
  ]
  for (const [from, to] of files) {
    const text = readFileSync(join(PRESENTATION, from), 'utf8').replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title)
    cpSync(join(PRESENTATION, from), join(out, to), { recursive: true })
    writeFileSync(join(out, to), text)
  }
  const index = join(app, 'src', 'presentations', 'index.ts')
  writeFileSync(
    index,
    readFileSync(index, 'utf8').replace(
      /\n\]/,
      `\n  { slug: '${slug}', title: '${title}', load: () => import('./${slug}/Talk') },\n]`,
    ),
  )
}

describe('INT-001 materialized bootstrap', () => {
  let app: string
  let install: RunResult
  let verify: RunResult
  let lint: RunResult
  let outsideCwd: string

  beforeAll(async () => {
    app = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    outsideCwd = mkdtempSync(join(tmpdir(), 'and-scene-cwd-'))
    cpSync(BOOTSTRAP, app, { recursive: true })
    install = await run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], app)
    instantiate(app, 'demo', 'Demo Presentation')
    lint = await run('npm', ['run', 'lint'], app)
    verify = await run('npm', ['run', 'verify'], app)
  })
  afterAll(() => {
    rmSync(app, { recursive: true, force: true })
    rmSync(outsideCwd, { recursive: true, force: true })
  })

  it('installs from the committed lock data', () => {
    expect(install.code, install.stderr).toBe(0)
  })

  it('declares the complete dependency set', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'playwright',
    ]) {
      expect(deps, name).toHaveProperty(name)
      expect(existsSync(join(app, 'node_modules', name)), `${name} installed`).toBe(true)
    }
    expect(Object.keys(deps).filter((d) => /tailwind/i.test(d))).toEqual([])
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts).toHaveProperty(script)
  })

  it('builds, lints, and passes its own route smoke check', () => {
    expect(lint.code, lint.stdout + lint.stderr).toBe(0)
    expect(verify.code, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toMatch(/^PASS verify: build ok, 1 presentation\(s\), 2 step\(s\)/m)
    expect(verify.stdout).toContain('verify: demo rendered 2 steps')
  })

  it('provides all three scaffold anchors once a presentation is registered', () => {
    const result = detectTarget(app)
    expect(result.anchors).toEqual({ build: true, kit: true, index: true })
    expect(result.scaffold).toBe('none')
  })

  it('locates the skill and its templates independent of the caller working directory', async () => {
    const { code, stdout } = await run('node', [join(SKILL, 'scripts', 'detect-target.mjs'), app], outsideCwd)
    expect(code).toBe(0)
    expect(JSON.parse(stdout).target).toBe(app)
    expect(existsSync(join(SKILL, 'SKILL.md'))).toBe(true)
    expect(readFileSync(join(SKILL, 'SKILL.md'), 'utf8')).toContain('relative to the directory that contains this `SKILL.md`')
  })

  it('keeps the template kit and shared scripts byte-aligned with the canonical sources', () => {
    expect(findDrift()).toEqual([])
    const kit = join(BOOTSTRAP, 'src', 'presentation-kit')
    expect(readdirSync(kit).length).toBeGreaterThan(5)
  })

  it('introduces no styling framework or visual defaults in the scaffold', () => {
    const texts = [
      readFileSync(join(BOOTSTRAP, 'src', 'index.css'), 'utf8'),
      readFileSync(join(BOOTSTRAP, 'vite.config.ts'), 'utf8'),
      readFileSync(join(BOOTSTRAP, 'index.html'), 'utf8'),
    ]
    for (const text of texts) expect(text).not.toMatch(/tailwind/i)
    const css = texts[0]
    expect(css).not.toMatch(/\b(color|background\w*|font\w*|border\w*|box-shadow)\s*:/)
    const kitFiles = readdirSync(join(BOOTSTRAP, 'src', 'presentation-kit'), { recursive: true }).map(String)
    expect(kitFiles.filter((f) => /\.css$/.test(f))).toEqual([])
  })
})
