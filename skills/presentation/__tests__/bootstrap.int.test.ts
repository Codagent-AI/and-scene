// @vitest-environment node
// INT-001: the distributable bootstrap snapshot, materialized outside this repo, is complete,
// builds, renders its registered route, matches the canonical kit, and imposes no style system.
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repo = fileURLToPath(new URL('../../..', import.meta.url))
const skillDir = join(repo, 'skills/presentation')
const bootstrapDir = join(skillDir, 'templates/bootstrap')
const canonicalKit = join(repo, 'src/presentation-kit')

function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
    .sort()
}

const kitFiles = (dir: string) => files(dir).filter((f) => !f.startsWith('__tests__'))

function run(command: string, args: string[], cwd: string, timeout = 240_000) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout })
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}

describe('INT-001 bootstrap template', () => {
  let app: string
  const slug = 'starter-talk'

  beforeAll(() => {
    app = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    cpSync(bootstrapDir, app, { recursive: true })
    // Materialize the presentation template and register it, as the skill does.
    const target = join(app, 'src/presentations', slug)
    cpSync(join(skillDir, 'templates/presentation'), target, { recursive: true })
    renameSync(join(target, '__SLUG__.css'), join(target, `${slug}.css`))
    for (const file of files(target)) {
      const path = join(target, file)
      writeFileSync(path, readFileSync(path, 'utf8').replaceAll('__SLUG__', slug).replaceAll('__TITLE__', 'Starter Talk'))
    }
    const index = join(app, 'src/presentations/index.ts')
    writeFileSync(
      index,
      readFileSync(index, 'utf8').replace(
        '= []',
        `= [{ slug: '${slug}', title: 'Starter Talk', load: () => import('./${slug}/Talk') }]`,
      ),
    )
    const install = run('npm', ['ci'], app, 480_000)
    expect(install.status, install.output).toBe(0)
  }, 500_000)

  afterAll(() => rmSync(app, { recursive: true, force: true }))

  it('provides the three contract anchors and the full dependency set', () => {
    for (const anchor of ['package.json', 'vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts']) {
      expect(existsSync(join(app, anchor)), anchor).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.scripts.inspect).toBeTruthy()
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps, dep).toContain(dep)
    }
  })

  it('builds and lints', () => {
    const build = run('npm', ['run', 'build'], app)
    expect(build.status, build.output).toBe(0)
    const lint = run('npm', ['run', 'lint'], app)
    expect(lint.status, lint.output).toBe(0)
  }, 300_000)

  it('renders its registered route through the local verify entry from another cwd', () => {
    const verify = run('node', [join(app, 'scripts/verify.mjs')], tmpdir(), 300_000)
    expect(verify.status, verify.output).toBe(0)
    expect(verify.output).toContain('VERIFY PASS')
    expect(verify.output).toContain(`${slug} rendered 2 steps`)
  }, 320_000)

  it('provides a screenshot helper that captures every step', () => {
    const inspect = run('node', [join(app, 'scripts/inspect-presentation.mjs'), slug, '--skip-build', '--settle', '300'], tmpdir(), 120_000)
    expect(inspect.status, inspect.output).toBe(0)
    expect(existsSync(join(app, '.inspection', slug, 'step-01.png'))).toBe(true)
    expect(existsSync(join(app, '.inspection', slug, 'step-02.png'))).toBe(true)
  }, 150_000)

  it('keeps the template kit byte-aligned with the canonical kit', () => {
    const template = join(bootstrapDir, 'src/presentation-kit')
    expect(kitFiles(template)).toEqual(kitFiles(canonicalKit))
    for (const file of kitFiles(canonicalKit)) {
      expect(readFileSync(join(template, file), 'utf8'), file).toBe(readFileSync(join(canonicalKit, file), 'utf8'))
    }
  })

  it('imposes no style system and no kit-owned visual defaults', () => {
    const scaffold = files(bootstrapDir).filter((f) => f !== 'package-lock.json')
    for (const file of scaffold) {
      expect(readFileSync(join(bootstrapDir, file), 'utf8'), file).not.toMatch(/tailwind/i)
    }
    expect(readFileSync(join(bootstrapDir, 'package-lock.json'), 'utf8')).not.toMatch(/tailwind/i)
    expect(scaffold.filter((f) => f.endsWith('.css'))).toEqual(['src/index.css'])
    expect(readFileSync(join(bootstrapDir, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')

    const visual = /\b(color|background|backgroundColor|fontFamily|fontSize|fontWeight|border|borderRadius|boxShadow|padding|margin)\s*:/
    for (const file of kitFiles(join(bootstrapDir, 'src/presentation-kit'))) {
      const source = readFileSync(join(bootstrapDir, 'src/presentation-kit', file), 'utf8')
      expect(source, file).not.toMatch(visual)
      expect(source, file).not.toMatch(/import\s+['"][^'"]+\.css['"]/)
    }
  })

  it('declares templates relative to the skill directory', () => {
    const skill = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
    expect(skill).toMatch(/^---\nname: presentation\ndescription: .+/)
    expect(skill).toContain('templates/bootstrap/')
    expect(skill).toMatch(/relative to it, never the working directory/)
    expect(statSync(join(skillDir, 'templates/step/StepNN.tsx')).isFile()).toBe(true)
  })
})
