import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/detect-target.mjs'
import { REPO, hasLeakedProcess, run, type RunResult } from '../helpers/project-copy'

// INT-001: the distributable bootstrap template, materialized outside this repository.
const SKILL_DIR = join(REPO, 'skills', 'presentation')
const SLUG = 'demo-talk'

let app: string
let verify: RunResult
let lint: RunResult
let install: RunResult

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)).map((f) => join(d.name, f)) : [d.name]))

beforeAll(() => {
  app = mkdtempSync(join(tmpdir(), 'and-scene-int1-'))
  // Template lookup is relative to SKILL.md's directory, never to the caller's cwd.
  cpSync(join(SKILL_DIR, 'templates', 'bootstrap'), app, { recursive: true })
  install = run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], app)

  // Instantiate the presentation template the way the skill does, then register it.
  const dest = join(app, 'src', 'presentations', SLUG)
  cpSync(join(SKILL_DIR, 'templates', 'presentation'), dest, { recursive: true })
  for (const file of walk(dest)) {
    const path = join(dest, file)
    writeFileSync(path, readFileSync(path, 'utf8').replaceAll('{{TITLE}}', 'Demo Talk').replaceAll('{{SLUG}}', SLUG))
  }
  const index = join(app, 'src', 'presentations', 'index.ts')
  writeFileSync(
    index,
    readFileSync(index, 'utf8').replace(
      /= \[[\s\S]*\]\s*$/,
      `= [\n  { slug: '${SLUG}', title: 'Demo Talk', load: () => import('./${SLUG}/Talk') },\n]\n`,
    ),
  )
  lint = run('npm', ['run', 'lint'], app)
  // Invoked from a working directory outside the materialized app and the source repo.
  verify = run(process.execPath, [join(app, 'scripts', 'verify.mjs')], tmpdir())
})

afterAll(() => {
  if (app) rmSync(app, { recursive: true, force: true })
})

describe('INT-001 materialized bootstrap', () => {
  it('installs from the committed lock data', () => {
    expect(install.status, install.stderr).toBe(0)
    expect(existsSync(join(app, 'node_modules', 'vite'))).toBe(true)
  })

  it('has all three anchors', () => {
    expect(detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
  })

  it('installs the complete dependency set', () => {
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(existsSync(join(app, 'node_modules', name, 'package.json')), name).toBe(true)
    }
  })

  it('lints and builds the instantiated presentation, then renders its registered route', () => {
    expect(lint.status, lint.stdout + lint.stderr).toBe(0)
    expect(verify.status, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toContain('ok build')
    expect(verify.stdout).toMatch(new RegExp(`ok render http://127\\.0\\.0\\.1:\\d+/${SLUG} steps 0,1`))
    expect(verify.stdout).toContain('PASS verify')
    expect(existsSync(join(app, 'dist', 'index.html'))).toBe(true)
    expect(hasLeakedProcess(app)).toBe(false)
  })

  it('stays style-neutral: no Tailwind and no visual defaults owned by the kit or scaffold', () => {
    const files = walk(app).filter((f) => !f.startsWith('node_modules') && !f.startsWith('dist') && f !== 'package-lock.json')
    for (const file of files) expect(readFileSync(join(app, file), 'utf8'), file).not.toMatch(/tailwind/i)
    expect(files.filter((f) => f.startsWith(join('src', 'presentation-kit')) && f.endsWith('.css'))).toEqual([])
    const css = readFileSync(join(app, 'src', 'index.css'), 'utf8')
    expect(css).not.toMatch(/\b(color|background|font[\w-]*|box-shadow)\s*:/)
  })

  it('keeps the canonical kit and the materialized kit aligned', () => {
    const canonical = join(REPO, 'src', 'presentation-kit')
    const copy = join(app, 'src', 'presentation-kit')
    expect(walk(copy).sort()).toEqual(walk(canonical).sort())
    for (const file of walk(canonical)) expect(readFileSync(join(copy, file)).equals(readFileSync(join(canonical, file))), file).toBe(true)
  })
})
