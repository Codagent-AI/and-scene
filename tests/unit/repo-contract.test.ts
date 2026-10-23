import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MIRRORED } from '../../skills/presentation/scripts/sync-bootstrap.mjs'
import { parseRegistry } from '../../scripts/lib/verify-core.mjs'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import { walk } from './fs-helpers.ts'

const root = path.resolve(import.meta.dirname, '../..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const read = (rel: string, base = root) => fs.readFileSync(path.join(base, rel), 'utf8')
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

/** Every file under a path, relative to `base`, test files excluded. */
const files = (base: string, rel: string) => {
  const full = path.join(base, rel)
  if (!fs.existsSync(full)) return []
  return fs.statSync(full).isDirectory() ? walk(full).map((f) => path.relative(base, f)).filter((f) => !/\.test\.[tj]sx?$/.test(f)).sort() : [rel]
}

describe('kit, scripts and entry files stay byte-aligned with the bootstrap snapshot', () => {
  it.each(MIRRORED)('%s matches its bootstrap copy exactly, with no missing or extra files', (rel: string) => {
    const canonical = files(root, rel)
    expect(canonical.length).toBeGreaterThan(0)
    expect(files(bootstrap, rel)).toEqual(canonical)
    for (const file of canonical) expect(read(file, bootstrap), file).toBe(read(file))
  })

  it('mirrors the non-test kit tree and both root scripts', () => {
    expect(MIRRORED).toEqual(expect.arrayContaining(['src/presentation-kit', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib']))
  })
})

describe('bootstrap snapshot', () => {
  it('declares the whole dependency set in its manifest and lockfile', () => {
    const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']
    const manifest = JSON.parse(read('package.json', bootstrap))
    const lock = JSON.parse(read('package-lock.json', bootstrap))
    const declared = { ...manifest.dependencies, ...manifest.devDependencies }
    const locked = { ...lock.packages[''].dependencies, ...lock.packages[''].devDependencies }
    for (const name of required) {
      expect(declared[name], name).toBeDefined()
      expect(locked[name], `${name} in lockfile`).toBeDefined()
      expect(lock.packages[`node_modules/${name}`], `${name} resolved in lockfile`).toBeDefined()
    }
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(manifest.scripts[script], script).toBeTruthy()
  })

  it('registers a smoke-testable starter route and ships no reference outline', () => {
    expect(parseRegistry(read('src/presentations/index.ts', bootstrap)).map((e) => e.slug)).toEqual(['starter'])
    expect(JSON.parse(read('package.json', bootstrap)).andScene).toBeUndefined()
  })

  it('ships no presentation styling: its only stylesheet is a reset', () => {
    const css = walk(path.join(bootstrap, 'src')).filter((f) => f.endsWith('.css'))
    expect(css.map((f) => path.relative(bootstrap, f))).toEqual(['src/index.css'])
    const source = read('src/index.css', bootstrap).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(source).not.toMatch(/\b(color|font|background|shadow|padding)|--|#[0-9a-f]{3}/i)
  })

  it('commits no installed dependencies or build output', () => {
    expect(fs.existsSync(path.join(bootstrap, 'node_modules'))).toBe(false)
    expect(fs.existsSync(path.join(bootstrap, 'dist'))).toBe(false)
  })
})

describe('registry', () => {
  it('has a directory, a Talk.tsx and a lazy loader for every explicit entry', () => {
    const entries = parseRegistry(read('src/presentations/index.ts'))
    expect(entries.map((e) => e.slug)).toEqual(PRESENTATIONS.map((p) => p.slug))
    for (const entry of PRESENTATIONS) {
      expect(fs.existsSync(path.join(root, 'src/presentations', entry.slug, 'Talk.tsx')), entry.slug).toBe(true)
      expect(typeof entry.load).toBe('function')
      expect(read('src/presentations/index.ts')).toContain(`import('./${entry.slug}/Talk.tsx')`)
    }
  })

  it('tracks the reference sample files in git', () => {
    for (const f of ['entities.ts', 'SampleScene.tsx', 'Talk.tsx', 'how-to.css', 'steps/index.ts', 'steps/step-9.tsx']) {
      expect(tracked, f).toContain(`src/presentations/how-to-make-a-presentation/${f}`)
    }
  })
})

describe('scripts and build wiring', () => {
  const pkg = JSON.parse(read('package.json'))

  it('keeps npm test to the fast unit config and puts browser suites in separate scripts', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    const config = read('vitest.config.ts').replace(/\/\/.*$/gm, '')
    expect(config).toMatch(/include: \['tests\/unit\/\*\*/)
    expect(config).not.toMatch(/integration|e2e/)
    expect(pkg.scripts['test:integration']).toContain('tests/integration')
    expect(pkg.scripts['test:e2e']).toContain('tests/e2e')
    for (const file of walk(path.join(root, 'tests/unit')).filter((f) => !f.endsWith('repo-contract.test.ts'))) {
      expect(fs.readFileSync(file, 'utf8'), file).not.toMatch(/from 'playwright'|chromium\.launch|vite build|npm run (build|verify)/)
    }
  })

  it('type-checks every presentation before bundling and builds before rendering', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(JSON.parse(read('tsconfig.app.json').replace(/\/\*[\s\S]*?\*\//g, '')).include).toContain('src')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    const verify = read('scripts/verify.mjs')
    expect(verify.indexOf('buildPhase()\n')).toBeGreaterThan(verify.indexOf('try {'))
    expect(verify.lastIndexOf('buildPhase()')).toBeLessThan(verify.lastIndexOf('renderPhase('))
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('keeps StrictMode in both entry points', () => {
    expect(read('src/main.tsx')).toContain('<StrictMode>')
    expect(read('src/main.tsx', bootstrap)).toContain('<StrictMode>')
  })

  it('never exits non-zero for advisory warnings alone', () => {
    const inspect = read('scripts/inspect-presentation.mjs')
    expect(inspect.match(/process\.exitCode = 1/g)).toHaveLength(2)
    expect(inspect).toMatch(/if \(errors\.length\) process\.exitCode = 1/)
    expect(inspect).toContain('not a pass/fail result')
  })
})

describe('repository hygiene', () => {
  it('tracks no build output, dependencies, screenshots or CI configuration', () => {
    for (const file of tracked) {
      expect(file, file).not.toMatch(/^(dist|node_modules|\.inspection|\.github)\//)
      expect(file, file).not.toMatch(/\/(node_modules|dist|\.inspection)\//)
      expect(file, file).not.toMatch(/\.(png|jpe?g)$/)
    }
    expect(fs.existsSync(path.join(root, '.github'))).toBe(false)
  })

  it('ignores generated artifacts', () => {
    const ignore = read('.gitignore').split('\n')
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(entry)
    expect(read('skills/presentation/templates/bootstrap/.gitignore').split('\n')).toEqual(expect.arrayContaining(['node_modules', 'dist', '.inspection']))
  })
})
