// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')
const BOOTSTRAP = join(ROOT, 'skills/presentation/templates/bootstrap')
const read = (path: string) => readFileSync(path, 'utf8')
const json = (path: string) => JSON.parse(read(path))

function walk(dir: string, skip: (rel: string) => boolean = () => false, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    const rel = relative(base, path)
    if (skip(rel)) return []
    return statSync(path).isDirectory() ? walk(path, skip, base) : [rel]
  })
}

const isTest = (rel: string) => /(^|\/)__tests__(\/|$)|\.test\.[tj]sx?$/.test(rel)

describe('template <-> canonical parity', () => {
  it('scene kit: same non-test file set, byte for byte', () => {
    const canonical = walk(join(ROOT, 'src/presentation-kit'), isTest).sort()
    const template = walk(join(BOOTSTRAP, 'src/presentation-kit')).sort()
    expect(template).toEqual(canonical)
    expect(canonical.length).toBeGreaterThan(20)
    for (const file of canonical) {
      expect(read(join(BOOTSTRAP, 'src/presentation-kit', file)) === read(join(ROOT, 'src/presentation-kit', file)), file).toBe(true)
    }
  })

  it('scripts: same file set, byte for byte', () => {
    const canonical = walk(join(ROOT, 'scripts')).sort()
    const template = walk(join(BOOTSTRAP, 'scripts')).sort()
    expect(template).toEqual(canonical)
    expect(canonical).toEqual(expect.arrayContaining(['verify.mjs', 'inspect-presentation.mjs']))
    for (const file of canonical) {
      expect(read(join(BOOTSTRAP, 'scripts', file)) === read(join(ROOT, 'scripts', file)), file).toBe(true)
    }
  })

  it('host files shared with the app are identical', () => {
    for (const file of [
      'src/main.tsx', 'src/Router.tsx', 'src/resolveSlug.ts', 'src/Landing.tsx', 'src/index.css',
      'src/presentations/types.ts', 'index.html', 'eslint.config.js', 'tsconfig.json', 'vite.config.ts', 'public/favicon.svg',
    ]) {
      expect(read(join(BOOTSTRAP, file)) === read(join(ROOT, file)), file).toBe(true)
    }
  })

  it('the starter presentation is the presentation template', () => {
    const template = walk(join(ROOT, 'skills/presentation/templates/presentation')).sort()
    const starter = walk(join(BOOTSTRAP, 'src/presentations/starter')).sort()
    expect(starter).toEqual(template)
    for (const file of template) {
      expect(read(join(BOOTSTRAP, 'src/presentations/starter', file)) === read(join(ROOT, 'skills/presentation/templates/presentation', file)), file).toBe(true)
    }
    expect(template).toEqual(expect.arrayContaining(['entities.ts', 'Talk.tsx', 'Scene.tsx', 'presentation.css', 'steps/index.ts']))
  })

  it('the bootstrap registry registers the starter, and its package scripts do not require the sample', () => {
    expect(read(join(BOOTSTRAP, 'src/presentations/index.ts'))).toMatch(/slug: 'starter'/)
    const scripts = json(join(BOOTSTRAP, 'package.json')).scripts
    expect(scripts.verify).toBe('node scripts/verify.mjs')
    expect(scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    expect(json(join(ROOT, 'package.json')).scripts.verify).toBe('node scripts/verify.mjs --require-sample how-to-make-a-presentation')
    expect(json(join(ROOT, 'package.json')).scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })
})

describe('manifests', () => {
  const required = {
    dependencies: ['react', 'react-dom', 'motion', 'lucide-react'],
    devDependencies: [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
      'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ],
  }
  for (const [name, dir] of [['bootstrap', BOOTSTRAP], ['root', ROOT]] as const) {
    it(`${name} declares the full dependency set and no styling framework`, () => {
      const pkg = json(join(dir, 'package.json'))
      for (const dep of required.dependencies) expect(pkg.dependencies, dep).toHaveProperty(dep)
      for (const dep of required.devDependencies) expect(pkg.devDependencies, dep).toHaveProperty(dep)
      expect(JSON.stringify(pkg)).not.toMatch(/tailwind|styled-components|emotion/i)
      expect(pkg.scripts.build).toBe('tsc -b && vite build')
      expect(pkg.scripts.lint).toBe('eslint .')
    })
    it(`${name} CSS and config mention no styling framework`, () => {
      for (const rel of walk(dir, (r) => /node_modules|dist|\.inspection|package-lock/.test(r))) {
        if (/\.(css|ts|tsx|mjs|js|json)$/.test(rel) && !isTest(rel) && !/^(tests|openspec|skills)\//.test(rel)) {
          expect(read(join(dir, rel)), rel).not.toMatch(/tailwind/i)
        }
      }
    })
  }

  it('the bootstrap ships a committed lock file matching its manifest', () => {
    const lock = json(join(BOOTSTRAP, 'package-lock.json'))
    const pkg = json(join(BOOTSTRAP, 'package.json'))
    expect(lock.packages[''].dependencies).toEqual(pkg.dependencies)
    expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies)
  })

  it('the bootstrap ships no default presentation theme', () => {
    expect(read(join(BOOTSTRAP, 'src/index.css'))).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|rgb\(|background/i)
    expect(read(join(BOOTSTRAP, 'src/presentations/starter/presentation.css'))).not.toMatch(/\{/)
  })

  it('keeps StrictMode in both entry points', () => {
    expect(read(join(ROOT, 'src/main.tsx'))).toMatch(/<StrictMode>/)
    expect(read(join(BOOTSTRAP, 'src/main.tsx'))).toMatch(/<StrictMode>/)
  })
})

describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('has no CI configuration', () => {
    expect(tracked.filter((f) => /^\.github\/|\.gitlab-ci|\.circleci|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
    expect(existsSync(join(ROOT, '.github/workflows'))).toBe(false)
  })

  it('commits no build output, dependencies, or inspection screenshots', () => {
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.inspection)\//.test(f) || /\.png$/.test(f))).toEqual([])
    for (const gitignore of [join(ROOT, '.gitignore'), join(BOOTSTRAP, '.gitignore')]) {
      const lines = read(gitignore).split('\n').map((l) => l.trim())
      expect(lines).toEqual(expect.arrayContaining(['node_modules', 'dist', '.inspection']))
    }
  })

  it('splits fast and slow test scripts', () => {
    const scripts = json(join(ROOT, 'package.json')).scripts
    expect(scripts.test).toBe('vitest run')
    expect(scripts['test:integration']).toMatch(/SCENE_SLOW_SUITE=integration/)
    expect(scripts['test:e2e']).toMatch(/SCENE_SLOW_SUITE=e2e/)
    for (const name of ['lint', 'build', 'verify', 'inspect']) expect(scripts).toHaveProperty(name)
    expect(read(join(ROOT, 'vitest.config.ts'))).not.toMatch(/tests\/(integration|e2e)/)
  })

  it('ships the skill and both template roots', () => {
    for (const rel of ['skills/presentation/SKILL.md', 'skills/presentation/templates/bootstrap/package.json', 'skills/presentation/templates/presentation/Talk.tsx']) {
      expect(existsSync(join(ROOT, rel)), rel).toBe(true)
    }
  })
})
