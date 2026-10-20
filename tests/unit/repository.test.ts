import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SYNCED } from '../../scripts/sync-template.mjs'
import integrationConfig from '../../vitest.integration.config.ts'
import unitConfig from '../../vitest.config.ts'
import { isTestFile, listFiles, repoRoot } from './helpers.ts'

const bootstrap = path.join(repoRoot, 'skills/presentation/templates/bootstrap')
const read = (...p: string[]) => readFileSync(path.join(...p), 'utf8')

describe('template parity', () => {
  it('keeps every non-test kit file byte-identical to its bootstrap copy, in both directions', () => {
    const canonical = listFiles(path.join(repoRoot, 'src/presentation-kit')).filter((f) => !isTestFile(f)).sort()
    const template = listFiles(path.join(bootstrap, 'src/presentation-kit')).sort()
    expect(template).toEqual(canonical)
    for (const f of canonical) {
      expect(read(bootstrap, 'src/presentation-kit', f), f).toBe(read(repoRoot, 'src/presentation-kit', f))
    }
  })

  it('keeps the root verify and inspect scripts identical to the template copies', () => {
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(read(bootstrap, f), f).toBe(read(repoRoot, f))
    }
  })

  it('keeps every synced file (sample, host app, configuration) in step with its source', () => {
    for (const entry of SYNCED) {
      const src = path.join(repoRoot, entry)
      expect(existsSync(src), entry).toBe(true)
      const files = listFilesOf(entry)
      for (const f of files) {
        expect(read(bootstrap, f), f).toBe(read(repoRoot, f))
      }
    }
  })
})

function listFilesOf(entry: string): string[] {
  const abs = path.join(repoRoot, entry)
  return listFiles(path.dirname(abs), repoRoot)
    .filter((f) => f === entry || f.startsWith(entry + '/'))
    .filter((f) => !isTestFile(f))
}

describe('bootstrap manifest', () => {
  const pkg = JSON.parse(read(bootstrap, 'package.json'))
  const lock = JSON.parse(read(bootstrap, 'package-lock.json'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const required = [
    'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
    '@types/react', '@types/react-dom', '@types/node', 'playwright',
  ]

  it('declares the full runtime and build dependency set, plus the ESLint stack its config imports', () => {
    for (const d of required) expect(deps[d], d).toBeTruthy()
    const config = read(bootstrap, 'eslint.config.js')
    const imported = [...config.matchAll(/from '([^'.][^']*)'/g)].map((m) => m[1]).filter((m) => !m.startsWith('eslint/'))
    expect(imported.length).toBeGreaterThan(3)
    for (const d of imported) expect(deps[d], d).toBeTruthy()
    expect(deps.eslint).toBeTruthy()
  })

  it('commits lock data that resolves every declared dependency', () => {
    expect(lock.packages[''].dependencies).toEqual(pkg.dependencies)
    expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies)
    for (const d of Object.keys(deps)) expect(lock.packages[`node_modules/${d}`], d).toBeTruthy()
  })

  it('exposes verify and inspect scripts and excludes the repository-only test tooling', () => {
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.scripts.inspect).toBeTruthy()
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    for (const d of ['vitest', 'jsdom']) expect(deps[d]).toBeUndefined()
  })
})

describe('style neutrality of the scaffold', () => {
  const infra = listFiles(bootstrap).filter((f) => !f.startsWith('src/presentations/') && f !== 'package-lock.json')

  it('requires no styling framework', () => {
    for (const f of infra) {
      const text = read(bootstrap, f)
      expect(text, f).not.toMatch(/tailwind|styled-components|@emotion|postcss/i)
    }
  })

  it('ships no colors, fonts, themes, or visual tokens outside presentation folders', () => {
    const styled = infra.filter((f) => /\.(css|html|tsx|ts)$/.test(f))
    for (const f of styled) {
      const text = read(bootstrap, f).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(text, f).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|font-family|fontFamily|box-shadow|border-radius|--[a-z][\w-]*\s*:/i)
    }
    expect(read(bootstrap, 'src/index.css')).not.toMatch(/\b(color|background|font)[\w-]*\s*:/)
  })
})

describe('repository hygiene and test separation', () => {
  const git = (...args: string[]) => spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).stdout

  it('tracks no build output, dependency directories, or inspection screenshots', () => {
    const tracked = git('ls-files').split('\n').filter(Boolean)
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|inspection)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /\.(png|jpe?g)$/.test(f) && /inspection|screenshot/.test(f))).toEqual([])
  })

  it('ignores build output, dependencies, and inspection screenshots (root and nested)', () => {
    for (const p of ['dist/x', 'node_modules/x', 'inspection/a/step-01.png', 'skills/presentation/templates/bootstrap/dist/x', 'skills/presentation/templates/bootstrap/node_modules/x']) {
      expect(spawnSync('git', ['check-ignore', '-q', p], { cwd: repoRoot }).status, p).toBe(0)
    }
    expect(git('ls-files', '--others', '--exclude-standard')).not.toMatch(/inspection\/|dist\//)
  })

  it('has no hosted CI configuration', () => {
    for (const p of ['.github/workflows', '.gitlab-ci.yml', '.circleci', 'azure-pipelines.yml', 'Jenkinsfile']) {
      expect(existsSync(path.join(repoRoot, p)), p).toBe(false)
    }
  })

  it('keeps npm test to unit tests and the integration suite in its own script', () => {
    const pkg = JSON.parse(read(repoRoot, 'package.json'))
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    const unit = unitConfig.test!.include!
    expect(unit.some((p) => p.includes('integration'))).toBe(false)
    expect(integrationConfig.test!.include).toEqual(['tests/integration/**/*.test.ts'])
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })
})
