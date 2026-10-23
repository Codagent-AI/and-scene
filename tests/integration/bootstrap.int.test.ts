import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { cleanupTmpDirs, repoRoot, run, tmpDir } from './helpers.ts'

afterAll(cleanupTmpDirs)

const scaffold = path.join(repoRoot, 'skills/presentation/scripts/scaffold.mjs')
let app: string
let scaffolded: ReturnType<typeof run>
let install: ReturnType<typeof run>
let build: ReturnType<typeof run>
let lint: ReturnType<typeof run>
let verify: ReturnType<typeof run>

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listFiles(path.join(dir, e.name)).map((f) => path.join(e.name, f)) : [e.name]))

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  beforeAll(() => {
    app = path.join(tmpDir('bootstrap-app'), 'app')
    fs.mkdirSync(app)
    const elsewhere = tmpDir('bootstrap-cwd') // run from a directory outside the source repository
    scaffolded = run(process.execPath, [scaffold, '--dir', app, '--apply', '--no-install'], { cwd: elsewhere })
    install = run('npm', ['ci'], { cwd: app })
    build = run('npm', ['run', 'build'], { cwd: app })
    lint = run('npm', ['run', 'lint'], { cwd: app })
    verify = run('npm', ['run', 'verify'], { cwd: app })
  })

  it('materializes all three anchors from the skill directory, independent of the working directory', () => {
    expect(scaffolded.status, scaffolded.output).toBe(0)
    expect(JSON.parse(scaffolded.stdout).target).toBe(app)
    expect(detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
  })

  it('installs from the committed lock data and declares the whole dependency set', () => {
    expect(install.status, install.output).toBe(0)
    const manifest = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
    const names = new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)])
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(names.has(name), name).toBe(true)
      expect(fs.existsSync(path.join(app, 'node_modules', name)), `${name} installed`).toBe(true)
    }
  })

  it('builds and lints', () => {
    expect(build.status, build.output).toBe(0)
    expect(lint.status, lint.output).toBe(0)
  })

  it('passes the route smoke check through its own verification entry point', () => {
    expect(verify.status, verify.output).toBe(0)
    expect(verify.output).toMatch(/VERIFY PASS: build, sample, render \(1 presentation\(s\), 3 step\(s\)\)/)
    expect(verify.output).toContain('render: http://127.0.0.1:')
    expect(verify.output).toContain('no reference sample configured')
  })

  it('keeps the scene kit and verification scripts identical to the canonical source', () => {
    for (const rel of ['src/presentation-kit', 'scripts/lib']) {
      expect(listFiles(path.join(app, rel)).sort()).toEqual(listFiles(path.join(repoRoot, rel)).sort())
      for (const file of listFiles(path.join(repoRoot, rel))) {
        expect(fs.readFileSync(path.join(app, rel, file), 'utf8'), `${rel}/${file}`).toBe(fs.readFileSync(path.join(repoRoot, rel, file), 'utf8'))
      }
    }
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(fs.readFileSync(path.join(app, rel), 'utf8')).toBe(fs.readFileSync(path.join(repoRoot, rel), 'utf8'))
    }
  })

  it('adds no styling framework and no visual defaults', () => {
    const manifest = fs.readFileSync(path.join(app, 'package.json'), 'utf8') + fs.readFileSync(path.join(app, 'vite.config.ts'), 'utf8')
    expect(manifest).not.toMatch(/tailwind|styled-components|@emotion|unocss/i)
    expect(fs.existsSync(path.join(app, 'node_modules', 'tailwindcss'))).toBe(false)
    const css = listFiles(path.join(app, 'src')).filter((f) => f.endsWith('.css'))
    expect(css).toEqual(['index.css'])
    expect(fs.readFileSync(path.join(app, 'src/index.css'), 'utf8')).not.toMatch(/\b(color|font|background|shadow)\b|#[0-9a-f]{3}/i)
  })
})
