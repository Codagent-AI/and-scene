import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, repo, runNpm, tempDir } from './helpers'

afterAll(cleanupTempDirs)

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name !== 'node_modules' && e.name !== 'dist')
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const rel = (base: string, files: string[]) => files.map((f) => path.relative(base, f).split(path.sep).join('/')).sort()

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let app: string
  let install: { code: number; output: string }
  let build: { code: number; output: string }
  let lint: { code: number; output: string }
  let verify: { code: number; output: string }

  beforeAll(async () => {
    app = tempDir('int1-app-')
    const elsewhere = tempDir('int1-cwd-')
    const cli = path.join(repo, 'skills/presentation/scripts/bootstrap.mjs')
    const applied = spawnSync(process.execPath, [cli, 'apply', '--dir', app, '--no-install'], { cwd: elsewhere, encoding: 'utf8' })
    expect(applied.status, applied.stderr).toBe(0)
    install = await runNpm(app, ['ci'], 400_000)
    build = await runNpm(app, ['run', 'build'])
    lint = await runNpm(app, ['run', 'lint'])
    verify = await runNpm(app, ['run', 'verify'])
  })

  it('installs from the committed lock data and builds', () => {
    expect(existsSync(path.join(app, 'package-lock.json'))).toBe(true)
    expect(install.code, install.output).toBe(0)
    expect(build.code, build.output).toBe(0)
  })

  it('lints cleanly with its own ESLint setup', () => {
    expect(lint.code, lint.output).toBe(0)
  })

  it('opens its registered route through the local verification entry point', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/PASS verify: build, sample, render \(1 presentation\(s\), 2 step\(s\)\)/)
    expect(verify.output).toContain('/starter')
    expect(verify.output).toMatch(/opening http:\/\/127\.0\.0\.1:\d+\/starter/)
  })

  it('has all three scaffold anchors and the complete dependency set', () => {
    const cli = path.join(repo, 'skills/presentation/scripts/bootstrap.mjs')
    const detect = spawnSync(process.execPath, [cli, 'detect', '--dir', app], { cwd: tempDir('int1-cwd2-'), encoding: 'utf8' })
    expect(JSON.parse(detect.stdout).anchors).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps).toEqual(expect.arrayContaining([
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'playwright',
    ]))
    for (const name of deps) expect(existsSync(path.join(app, 'node_modules', name)), name).toBe(true)
  })

  it('stays aligned with the canonical scene kit and root scripts', () => {
    const kit = (base: string) => rel(path.join(base, 'src/presentation-kit'), walk(path.join(base, 'src/presentation-kit')))
    expect(kit(app)).toEqual(kit(repo))
    for (const file of kit(repo)) {
      const a = readFileSync(path.join(repo, 'src/presentation-kit', file))
      const b = readFileSync(path.join(app, 'src/presentation-kit', file))
      expect(a.equals(b), file).toBe(true)
    }
    for (const file of ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs', 'lib/diagnostics.mjs', 'lib/inspect-run.mjs', 'lib/inspect-args.mjs', 'lib/sample-check.mjs']) {
      expect(readFileSync(path.join(app, 'scripts', file)).equals(readFileSync(path.join(repo, 'scripts', file))), file).toBe(true)
    }
  })

  it('introduces no styling framework and no visual defaults in the kit or host css', () => {
    const files = rel(app, walk(app).filter((f) => !f.includes('package-lock')))
    expect(files.filter((f) => /tailwind/i.test(f))).toEqual([])
    for (const file of files.filter((f) => /\.(json|ts|tsx|js|mjs|css)$/.test(f))) {
      expect(readFileSync(path.join(app, file), 'utf8'), file).not.toMatch(/tailwind/i)
    }
    expect(files.filter((f) => f.endsWith('.css') && f.startsWith('src/presentation-kit'))).toEqual([])
    expect(readFileSync(path.join(app, 'src/index.css'), 'utf8')).not.toMatch(/(^|[;{\s])(color|background)\s*:/)
  })
})
