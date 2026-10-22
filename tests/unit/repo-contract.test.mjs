// @vitest-environment node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..', '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8')
const json = (...p) => JSON.parse(read(...p))

function tree(dir, skip = () => false) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => fs.statSync(path.join(dir, f)).isFile() && !skip(f))
    .sort()
}
const isTest = (f) => /(^|[\\/])__tests__[\\/]|\.test\.[tj]sx?$/.test(f)

describe('template parity with the canonical sources', () => {
  it('has the same non-test kit file set and bytes as src/presentation-kit', () => {
    const canonical = tree(path.join(root, 'src/presentation-kit'), isTest)
    const copy = tree(path.join(bootstrap, 'src/presentation-kit'), isTest)
    expect(copy).toEqual(canonical)
    expect(canonical.length).toBeGreaterThan(10)
    for (const f of canonical) {
      expect(fs.readFileSync(path.join(bootstrap, 'src/presentation-kit', f)).equals(fs.readFileSync(path.join(root, 'src/presentation-kit', f))), f).toBe(true)
    }
  })

  it('byte-matches verify, inspect, their libraries and the shared app shell', () => {
    const libs = tree(path.join(root, 'scripts/lib')).map((f) => `scripts/lib/${f}`)
    expect(tree(path.join(bootstrap, 'scripts/lib')).map((f) => `scripts/lib/${f}`)).toEqual(libs)
    const shared = [
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
      ...libs,
      'src/main.tsx',
      'src/Router.tsx',
      'src/Landing.tsx',
      'src/index.css',
      'src/presentations/registry.ts',
      'src/presentations/lazyPresentation.ts',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'index.html',
    ]
    for (const rel of shared) {
      expect(fs.readFileSync(path.join(bootstrap, rel)).equals(fs.readFileSync(path.join(root, rel))), rel).toBe(true)
    }
  })

  it('ships an empty registry so a fresh scaffold has no sample', () => {
    const index = fs.readFileSync(path.join(bootstrap, 'src/presentations/index.ts'), 'utf8')
    expect(index).toMatch(/PresentationEntry/)
    expect(index).not.toMatch(/slug:\s*['"]/)
  })
})

describe('manifests', () => {
  const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']

  it.each([
    ['repository', '.'],
    ['bootstrap template', 'skills/presentation/templates/bootstrap'],
  ])('%s declares the complete dependency set', (_name, dir) => {
    const pkg = json(dir, 'package.json')
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const name of required) expect(names, name).toContain(name)
  })

  it('keeps the bootstrap lock file consistent with its manifest', () => {
    const pkg = json('skills/presentation/templates/bootstrap/package.json')
    const lock = json('skills/presentation/templates/bootstrap/package-lock.json')
    const root0 = lock.packages['']
    expect(root0.dependencies).toEqual(pkg.dependencies)
    expect(root0.devDependencies).toEqual(pkg.devDependencies)
    for (const name of required) expect(lock.packages[`node_modules/${name}`], name).toBeDefined()
  })

  it('keeps the root lock file consistent with its manifest', () => {
    const pkg = json('package.json')
    const lock = json('package-lock.json')
    expect(lock.packages[''].dependencies).toEqual(pkg.dependencies)
    expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies)
  })

  it('adds no routing library (minimal pathname router)', () => {
    const banned = /react-router|@tanstack\/(react-)?router|wouter|navigo|page$/
    for (const dir of ['.', 'skills/presentation/templates/bootstrap']) {
      const pkg = json(dir, 'package.json')
      expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => banned.test(n))).toEqual([])
    }
    for (const rel of ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx']) expect(read(rel)).not.toMatch(banned)
    expect(read('src/Router.tsx')).toMatch(/Suspense/)
    expect(read('src/presentations/lazyPresentation.ts')).toMatch(/\blazy\(/)
  })
})

describe('package scripts and test split', () => {
  const scripts = json('package.json').scripts

  it('exposes the documented commands, each separately', () => {
    for (const name of ['test', 'lint', 'build', 'verify', 'inspect', 'test:integration', 'test:e2e']) expect(scripts[name], name).toBeTruthy()
    expect(scripts.build).toBe('tsc -b && vite build')
    expect(scripts.verify).toMatch(/scripts\/verify\.mjs/)
    expect(scripts.inspect).toMatch(/scripts\/inspect-presentation\.mjs/)
  })

  it('keeps slow suites out of npm test', () => {
    expect(scripts.test).toBe('vitest run')
    const unit = read('vitest.config.ts')
    expect(unit).not.toMatch(/tests\/(integration|e2e)/)
    const slow = read('vitest.integration.config.ts')
    expect(slow).toMatch(/tests\/integration/)
    expect(slow).toMatch(/tests\/e2e/)
    expect(scripts['test:integration']).toMatch(/integration/)
    expect(scripts['test:e2e']).toMatch(/e2e/)
  })

  it('ships verify and inspect entries in the bootstrap package.json', () => {
    const boot = json('skills/presentation/templates/bootstrap/package.json').scripts
    expect(boot.build).toBe('tsc -b && vite build')
    expect(boot.verify).toMatch(/scripts\/verify\.mjs/)
    expect(boot.inspect).toMatch(/scripts\/inspect-presentation\.mjs/)
    expect(boot.lint).toBeTruthy()
  })
})

describe('application shell', () => {
  it('keeps StrictMode in the app and the bootstrap entry', () => {
    for (const file of ['src/main.tsx', 'skills/presentation/templates/bootstrap/src/main.tsx']) {
      expect(read(file)).toMatch(/<StrictMode>/)
    }
  })

  it('has no casts or type erasure at the Presentation boundary', () => {
    for (const file of ['src/presentation-kit/Presentation.tsx', 'src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentations/how-to-make-a-presentation/Talk.tsx']) {
      expect(read(file), file).not.toMatch(/\bas\s+(any|unknown|never)\b|:\s*any\b|<any>/)
    }
  })

  it('takes Box icons as a typed component with no hard-coded glyphs in the kit', () => {
    expect(read('src/presentation-kit/nodes/Box.tsx')).toMatch(/import type \{ LucideIcon \} from 'lucide-react'/)
    expect(read('src/presentation-kit/nodes/Box.tsx')).toMatch(/icon\?: LucideIcon/)
    for (const f of tree(path.join(root, 'src/presentation-kit'), isTest)) {
      expect(read('src/presentation-kit', f), f).not.toMatch(/import \{[^}]*\} from 'lucide-react'/)
    }
  })

  it('keeps the sample styles in presentation-owned plain CSS', () => {
    expect(fs.existsSync(path.join(root, 'src/presentations/how-to-make-a-presentation/talk.css'))).toBe(true)
    expect(read('src/presentations/how-to-make-a-presentation/Talk.tsx')).toMatch(/import '\.\/talk\.css'/)
  })

  it('compiles every presentation: tsconfig covers all of src and the registry imports the sample', () => {
    expect(read('tsconfig.app.json')).toMatch(/"include": \["src"\]/)
    expect(read('src/presentations/index.ts')).toMatch(/import\('\.\/how-to-make-a-presentation\/Talk\.tsx'\)/)
  })
})

describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('tracks no hosted CI configuration, build output, dependencies or inspection screenshots', () => {
    expect(tracked.filter((f) => /^\.github\/workflows\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|inspection)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /step-\d+\.png$/.test(f))).toEqual([])
  })

  it('gitignores build output, dependencies and inspection output, here and in the bootstrap', () => {
    for (const file of ['.gitignore', 'skills/presentation/templates/bootstrap/.gitignore']) {
      const ignore = read(file)
      for (const entry of ['node_modules', 'dist', 'inspection']) expect(ignore, `${file}: ${entry}`).toMatch(new RegExp(`^${entry}$`, 'm'))
    }
  })
})
