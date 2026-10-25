// INT-001: materialized bootstrap is complete and style-neutral.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { listFiles, materializeBootstrap, repoRoot, sh, skillDir, type Result } from '../helpers/materialize.ts'

let dir = ''
let scaffoldOut: Result
let build: Result
let lint: Result
let verify: Result

beforeAll(() => {
  const m = materializeBootstrap('and-scene-int001')
  dir = m.dir
  scaffoldOut = m.scaffold
  build = sh('npm', ['run', 'build'], dir)
  lint = sh('npm', ['run', 'lint'], dir)
  verify = sh('npm', ['run', 'verify'], dir)
})

afterAll(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

describe('INT-001 materialized bootstrap', () => {
  it('scaffolds at the target regardless of the caller working directory', () => {
    expect(JSON.parse(scaffoldOut.out.slice(scaffoldOut.out.indexOf('{'))).target).toBe(dir)
    expect(path.relative(repoRoot, dir).startsWith('..')).toBe(true)
  })

  it('has all three scaffold anchors', () => {
    const res = sh(process.execPath, [path.join(skillDir, 'scripts/detect-target.mjs'), dir], os.tmpdir())
    const plan = JSON.parse(res.out)
    expect(plan.anchors).toEqual({ build: true, kit: true, index: true })
    expect(plan.missing).toEqual([])
  })

  it('installs the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set', () => {
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', 'eslint', 'typescript-eslint', 'playwright', '@types/react', '@types/node']) {
      expect(fs.existsSync(path.join(dir, 'node_modules', name, 'package.json')), name).toBe(true)
    }
  })

  it('builds', () => {
    expect(build.code, build.out).toBe(0)
  })

  it('lints clean', () => {
    expect(lint.code, lint.out).toBe(0)
  })

  it('passes its own verification entry point (route smoke check on 127.0.0.1)', () => {
    expect(verify.code, verify.out).toBe(0)
    expect(verify.out).toContain('PASS render starter')
    expect(verify.out).toContain('VERIFY PASSED')
    expect(verify.out).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
    expect(verify.out).not.toContain('localhost')
  })

  it('keeps the non-test kit aligned with the canonical src/presentation-kit', () => {
    const canonical = listFiles(path.join(repoRoot, 'src/presentation-kit')).filter((f) => !/\.test\.tsx?$/.test(f))
    expect(listFiles(path.join(dir, 'src/presentation-kit'))).toEqual(canonical)
    for (const f of canonical) {
      expect(fs.readFileSync(path.join(dir, 'src/presentation-kit', f)).equals(fs.readFileSync(path.join(repoRoot, 'src/presentation-kit', f))), f).toBe(true)
    }
  })

  it('keeps the verification and inspection scripts aligned with the repository copies', () => {
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', 'inspection-checks.mjs', 'preview.mjs']) {
      expect(fs.readFileSync(path.join(dir, 'scripts', f)).equals(fs.readFileSync(path.join(repoRoot, 'scripts', f))), f).toBe(true)
    }
  })

  it('introduces no Tailwind and no visual defaults owned by the kit or scaffold', () => {
    const pkg = fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
    const css = listFiles(path.join(dir, 'src')).filter((f) => f.endsWith('.css'))
    expect(css.filter((f) => f.startsWith('presentation-kit'))).toEqual([])
    expect(fs.readFileSync(path.join(dir, 'src/index.css'), 'utf8')).not.toMatch(/color|font|background|border|shadow/i)
  })
})
