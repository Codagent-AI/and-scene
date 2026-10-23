import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupDirs, repoRoot, run, tempDir } from './helpers'

afterAll(cleanupDirs)

const cli = path.join(repoRoot, 'skills/presentation/scripts/presentation-scaffold.mjs')
let app: string
let elsewhere: string

beforeAll(() => {
  app = path.join(tempDir('bootstrap-'), 'project')
  elsewhere = tempDir('elsewhere-')
})

describe('INT: materialized bootstrap is complete and style-neutral', () => {
  it('scaffolds an empty directory from outside the repository and installs from the lock data', () => {
    const scaffold = run('node', [cli, 'scaffold', app], elsewhere)
    expect(scaffold.status, scaffold.output).toBe(0)
    const info = JSON.parse(scaffold.stdout.slice(scaffold.stdout.indexOf('{\n  "root"')))
    expect(info.anchors).toEqual({ build: false, kit: false, index: false })
    expect(info.installed).toBe(true)
    expect(JSON.parse(run('node', [cli, 'detect', app], elsewhere).stdout).missing).toEqual([])
  })

  it('has the full dependency set installed and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'vite', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright']) {
      expect(declared, dep).toContain(dep)
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), `${dep} installed`).toBe(true)
    }
    expect(declared.filter((d) => /tailwind/.test(d))).toEqual([])
    expect(existsSync(path.join(app, 'node_modules', 'tailwindcss'))).toBe(false)
  })

  it('keeps the scene kit byte-aligned with the canonical source', () => {
    const drift = run('node', ['scripts/sync-template.mjs', '--check'], repoRoot)
    expect(drift.status, drift.output).toBe(0)
    for (const file of ['Presentation.tsx', 'Stage.tsx', 'constants.ts', 'nodes/Entity.tsx']) {
      expect(readFileSync(path.join(app, 'src/presentation-kit', file))).toEqual(
        readFileSync(path.join(repoRoot, 'src/presentation-kit', file)),
      )
    }
  })

  it('builds, lints, and passes the route smoke check through its own verify entry point', () => {
    const add = run('node', [cli, 'add', app, '--slug', 'smoke', '--title', 'Smoke "Test" */ it\'s'], elsewhere)
    expect(add.status, add.output).toBe(0)
    const lint = run('npm', ['run', 'lint'], app)
    expect(lint.status, lint.output).toBe(0)
    const verify = run('npm', ['run', 'verify'], app)
    expect(verify.status, verify.output).toBe(0)
    expect(verify.stdout).toMatch(/PASS verify: build ok, 1 presentation\(s\), 2 step\(s\) rendered/)
    expect(verify.stdout).toContain('127.0.0.1')
  })

  it('introduces no visual defaults of its own in the scaffolded app', () => {
    const css = readFileSync(path.join(app, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/(color|font|background|border|shadow)/i)
    expect(readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })
})
