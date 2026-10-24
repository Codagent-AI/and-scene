import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { npm, repoRoot, type RunResult } from '../support/project'

// INT-001: the distributable bootstrap template, materialized outside the source repository.
const skillDir = path.join(repoRoot, 'skills/presentation')
const templateDir = path.resolve(skillDir, 'templates/bootstrap') // resolved from SKILL.md's directory
const elsewhere = mkdtempSync(path.join(os.tmpdir(), 'and-scene-int001-'))
const app = path.join(elsewhere, 'app')
const results: Record<string, RunResult> = {}

const tree = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? tree(full).map((f) => path.join(name, f)) : [name]
  })

beforeAll(async () => {
  expect(existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true)
  cpSync(templateDir, app, { recursive: true })
  // Every command runs from a working directory that is not inside the source repository.
  results.install = await npm(['ci'], app)
  results.build = await npm(['run', 'build'], app)
  results.lint = await npm(['run', 'lint'], app)
  results.verify = await npm(['run', 'verify'], app)
})

afterAll(() => rmSync(elsewhere, { recursive: true, force: true }))

describe('INT-001: materialized bootstrap', () => {
  it('lives outside the source repository, so nothing resolves dependencies from it', () => {
    expect(path.relative(repoRoot, app).startsWith('..')).toBe(true)
  })

  it('installs from the committed lock data, builds, and lints', () => {
    for (const step of ['install', 'build', 'lint']) {
      expect(results[step].code, `${step}\n${results[step].output}`).toBe(0)
    }
    expect(existsSync(path.join(app, 'dist/index.html'))).toBe(true)
  })

  it('verifies its registered starter route through its local verification entry point', () => {
    expect(results.verify.code, results.verify.output).toBe(0)
    expect(results.verify.output).toMatch(/PASS verify/)
    expect(results.verify.output).toContain('rendered getting-started: 3 steps')
    expect(results.verify.output).toContain('http://127.0.0.1:')
    expect(results.verify.output).not.toContain('localhost')
  })

  it('has all three scaffold anchors', () => {
    expect(JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8')).scripts.build).toBe('tsc -b && vite build')
    for (const file of ['Presentation.tsx', 'Stage.tsx', 'types.ts', 'usePresentationNav.ts', 'chrome/Toc.tsx', 'chrome/Footer.tsx']) {
      expect(existsSync(path.join(app, 'src/presentation-kit', file)), file).toBe(true)
    }
    expect(readFileSync(path.join(app, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'getting-started'")
  })

  it('installed the complete dependency set locally', () => {
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), dep).toBe(true)
    }
  })

  it('keeps the kit identical to the canonical source', () => {
    const canonical = path.join(repoRoot, 'src/presentation-kit')
    const copy = path.join(app, 'src/presentation-kit')
    expect(tree(copy).sort()).toEqual(tree(canonical).sort())
    for (const file of tree(canonical)) {
      expect(readFileSync(path.join(copy, file)), file).toEqual(readFileSync(path.join(canonical, file)))
    }
  })

  it('introduces no Tailwind and no visual defaults in the kit or scaffold', () => {
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(readFileSync(path.join(app, 'package-lock.json'), 'utf8')).not.toMatch(/tailwind/i)
    expect(tree(path.join(app, 'src/presentation-kit')).filter((f) => /\.(css|scss)$/.test(f))).toEqual([])
    const css = tree(path.join(app, 'src')).filter((f) => f.endsWith('.css'))
    for (const file of css) {
      expect(readFileSync(path.join(app, 'src', file), 'utf8').replace(/\/\*[^]*?\*\//g, ''), file).not.toMatch(/color|font|border|shadow|background|radius/)
    }
  })
})
