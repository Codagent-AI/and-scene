// INT-001: the distributable bootstrap works outside the repository that authored it.
import { readdirSync, readFileSync, realpathSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { exists, repoRoot, run, tmpDir } from './helpers.ts'

const skill = path.join(repoRoot, 'skills/presentation/scripts/scaffold.mjs')
const target = path.join(tmpDir('and-scene-int001-'), 'app')
let verifyOutput = ''
let inspectOutput = ''

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? filesUnder(path.join(dir, d.name)).map((f) => `${d.name}/${f}`) : [d.name],
  )
}

beforeAll(() => {
  // Materialize from a working directory that is neither the repository nor the target.
  const scaffold = run(process.execPath, [skill, 'scaffold', target, '--no-install'], os.tmpdir())
  expect(scaffold.status, scaffold.output).toBe(0)
  const install = run('npm', ['ci', '--no-audit', '--no-fund'], target)
  expect(install.status, install.output).toBe(0)
  const create = run(process.execPath, [skill, 'create', target, 'int-talk', 'Integration Talk'], os.tmpdir())
  expect(create.status, create.output).toBe(0)
  const verify = run('npm', ['run', 'verify'], target)
  verifyOutput = verify.output
  expect(verify.status, verify.output).toBe(0)
  const inspect = run('npm', ['run', 'inspect', '--', 'int-talk', '--skip-build', '--settle', '300'], target)
  inspectOutput = inspect.output
  expect(inspect.status, inspect.output).toBe(0)
})

describe('INT-001 materialized bootstrap', () => {
  it('has all three anchors and the complete dependency set', () => {
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps[d], d).toBeTruthy()
      expect(exists(target, 'node_modules', d.startsWith('@') ? d : d, 'package.json'), `installed ${d}`).toBe(true)
    }
    expect(exists(target, 'package-lock.json')).toBe(true)
  })

  it('resolves its own dependencies, not the source checkout', () => {
    for (const d of ['react', 'motion', 'vite', 'playwright']) {
      expect(realpathSync(path.join(target, 'node_modules', d)).startsWith(realpathSync(target))).toBe(true)
    }
    expect(realpathSync(target).startsWith(repoRoot)).toBe(false)
  })

  it('builds, and its verify entry point renders every registered route', () => {
    expect(exists(target, 'dist/index.html')).toBe(true)
    expect(verifyOutput).toContain('render http://127.0.0.1:')
    expect(verifyOutput).toMatch(/render http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(verifyOutput).toMatch(/render http:\/\/127\.0\.0\.1:\d+\/int-talk/)
    expect(verifyOutput).toContain('VERIFY PASSED')
  })

  it('ships a working project-local inspection helper', () => {
    expect(exists(target, 'scripts/inspect-presentation.mjs')).toBe(true)
    expect(exists(target, 'scripts/verify.mjs')).toBe(true)
    expect(JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf8')).scripts.inspect).toContain('inspect-presentation.mjs')
    expect(exists(target, 'inspection/int-talk/step-01.png')).toBe(true)
    expect(exists(target, 'inspection/int-talk/step-02.png')).toBe(true)
    expect(inspectOutput).toContain('[inspect] done')
  })

  it('keeps the canonical kit and the materialized kit aligned', () => {
    const canonical = path.join(repoRoot, 'src/presentation-kit')
    const copy = path.join(target, 'src/presentation-kit')
    const notTest = (f: string) => !/\.test\.(ts|tsx)$/.test(f) && !f.startsWith('__fixtures__/')
    const want = filesUnder(canonical).filter(notTest).sort()
    expect(filesUnder(copy).sort()).toEqual(want)
    for (const f of want) expect(readFileSync(path.join(copy, f), 'utf8'), f).toBe(readFileSync(path.join(canonical, f), 'utf8'))
  })

  it('is neutral: no styling framework installed and no visual defaults in the kit or host css', () => {
    expect(exists(target, 'node_modules/tailwindcss')).toBe(false)
    expect(exists(target, 'node_modules/@tailwindcss')).toBe(false)
    const lock = readFileSync(path.join(target, 'package-lock.json'), 'utf8')
    expect(lock).not.toMatch(/tailwind/i)
    const host = readFileSync(path.join(target, 'src/index.css'), 'utf8')
    expect(host).not.toMatch(/\b(color|background|font-family)\s*:/)
    for (const f of filesUnder(path.join(target, 'src/presentation-kit'))) {
      expect(f).not.toMatch(/\.css$/)
      expect(readFileSync(path.join(target, 'src/presentation-kit', f), 'utf8')).not.toMatch(/tailwind/i)
    }
  })

  it('creates a presentation from the templates that builds and renders in the materialized app', () => {
    expect(exists(target, 'src/presentations/int-talk/Talk.tsx')).toBe(true)
    expect(readFileSync(path.join(target, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'int-talk'")
  })
})
