// INT-001: the distributable bootstrap works outside the repository that authored it.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { listFiles, scanKitForStyling } from '../helpers/kit-scan.mjs'
import { repoRoot, scaffoldCli, sh, tempDir } from '../helpers/project.mjs'

const bootstrap = path.join(repoRoot, 'skills/presentation/templates/bootstrap')
let dir
const results = {}

beforeAll(() => {
  dir = tempDir('int001-')
  const cwd = tempDir('int001-cwd-') // unrelated working directory: template lookup must not depend on it
  results.scaffold = sh(process.execPath, [scaffoldCli, 'scaffold', dir, '--install'], cwd)
  results.build = sh('npm', ['run', 'build'], dir)
  results.lint = sh('npm', ['run', 'lint'], dir)
  results.verify = sh('npm', ['run', 'verify'], dir)
})

describe('INT-001 materialized bootstrap', () => {
  it('scaffolds and installs from the committed lock data', () => {
    expect(results.scaffold.status, results.scaffold.output).toBe(0)
    expect(existsSync(path.join(dir, 'node_modules/vite'))).toBe(true)
  })

  it('has all three anchors and the complete dependency set', () => {
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint',
      'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright',
    ]) {
      expect(deps[name], name).toBeTruthy()
    }
    expect(pkg.scripts.build).toBeTruthy()
    expect(existsSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'src/presentations/index.ts'))).toBe(true)
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
  })

  it('builds, lints, and passes its route smoke check', () => {
    expect(results.build.status, results.build.output).toBe(0)
    expect(results.lint.status, results.lint.output).toBe(0)
    expect(results.verify.status, results.verify.output).toBe(0)
    expect(results.verify.output).toContain('render: example ok')
    expect(results.verify.output).toContain('VERIFY PASSED')
  })

  it('keeps the distributed kit and root scripts byte-aligned with the canonical copies', () => {
    const canonical = path.join(repoRoot, 'src/presentation-kit')
    const copy = path.join(bootstrap, 'src/presentation-kit')
    expect(listFiles(copy)).toEqual(listFiles(canonical))
    for (const rel of listFiles(canonical)) {
      expect(readFileSync(path.join(copy, rel)).equals(readFileSync(path.join(canonical, rel))), rel).toBe(true)
    }
    for (const file of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      const a = readFileSync(path.join(repoRoot, 'scripts', file))
      expect(a.equals(readFileSync(path.join(bootstrap, 'scripts', file))), file).toBe(true)
    }
    expect(listFiles(path.join(dir, 'src/presentation-kit'))).toEqual(listFiles(canonical))
  })

  it('introduces no styling framework or kit visual defaults', () => {
    expect(scanKitForStyling(path.join(dir, 'src/presentation-kit'))).toEqual([])
    const pkg = readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
    expect(existsSync(path.join(dir, 'tailwind.config.js'))).toBe(false)
    expect(readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })
})
