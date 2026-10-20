import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { exec, gone, previewPid, removeDir, repoRoot, tempDir } from './helpers.ts'

const scaffold = path.join(repoRoot, 'skills', 'presentation', 'scripts', 'scaffold.mjs')
const template = path.join(repoRoot, 'skills', 'presentation', 'templates', 'bootstrap')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const isTest = (f: string) => /\.test\.tsx?$/.test(f) || path.basename(f).startsWith('testing.')
const inventory = (dir: string, keep: (f: string) => boolean = () => true) =>
  walk(dir).filter(keep).map((f) => path.relative(dir, f)).sort()

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  const app = tempDir('bootstrap-app')
  const elsewhere = tempDir('bootstrap-cwd')
  let applyOutput = ''
  let verifyOutput = ''

  beforeAll(async () => {
    // Invoke the scaffolder from an unrelated working directory; template lookup must not depend on it.
    const applied = await exec('node', [scaffold, 'apply', app], elsewhere)
    applyOutput = applied.output
    expect(applied.code, applied.output).toBe(0)
    const install = await exec('npm', ['ci', '--no-audit', '--no-fund'], app)
    expect(install.code, install.output).toBe(0)
  })
  afterAll(() => {
    removeDir(app)
    removeDir(elsewhere)
  })

  it('materializes all three anchors from the skill directory, independent of the caller cwd', () => {
    const report = JSON.parse(applyOutput)
    expect(report.target).toBe(app)
    expect(report.missing).toEqual(['build', 'kit', 'index'])
    expect(report.written.length).toBeGreaterThan(30)
    const after = JSON.parse(execFileSync('node', [scaffold, 'detect', app], { cwd: elsewhere, encoding: 'utf8' }))
    expect(after.missing).toEqual([])
    for (const rel of ['package.json', 'package-lock.json', 'index.html', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'src/main.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(existsSync(path.join(app, rel)), rel).toBe(true)
    }
  })

  it('declares the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dep], dep).toBeTruthy()
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'playwright']) {
      expect(pkg.devDependencies[dep], dep).toBeTruthy()
    }
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts[script], script).toBeTruthy()
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /tailwind|styled-components|emotion/.test(d))).toEqual([])
    expect(existsSync(path.join(app, 'node_modules', 'react'))).toBe(true)
  })

  it('builds, lints, and smoke-renders its registered route on 127.0.0.1 with its own verification entry', async () => {
    const lint = await exec('npm', ['run', 'lint'], app)
    expect(lint.code, lint.output).toBe(0)
    const verify = await exec('npm', ['run', 'verify'], app)
    verifyOutput = verify.output
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/render: ok \(3 steps at http:\/\/127\.0\.0\.1:\d+\/getting-started\)/)
    expect(verify.output).toMatch(/\nPASS\n/)
    const pid = previewPid(verifyOutput)
    expect(pid).not.toBeNull()
    expect(await gone(pid!)).toBe(true)
  })

  it('keeps the canonical kit and the template kit aligned, file for file', () => {
    const canonical = path.join(repoRoot, 'src', 'presentation-kit')
    const copy = path.join(app, 'src', 'presentation-kit')
    expect(inventory(copy)).toEqual(inventory(canonical, (f) => !isTest(f)))
    for (const rel of inventory(copy)) {
      expect(readFileSync(path.join(copy, rel), 'utf8'), rel).toBe(readFileSync(path.join(canonical, rel), 'utf8'))
    }
  })

  it('keeps root verification and inspection scripts aligned with the template copies', () => {
    const root = path.join(repoRoot, 'scripts')
    const copy = path.join(app, 'scripts')
    expect(inventory(copy)).toEqual(inventory(root))
    for (const rel of inventory(root)) expect(readFileSync(path.join(copy, rel), 'utf8'), rel).toBe(readFileSync(path.join(root, rel), 'utf8'))
    expect(inventory(path.join(template, 'scripts'))).toEqual(inventory(root))
  })

  it('introduces no styling framework or visual defaults in the scaffold', () => {
    const files = walk(app).filter((f) => !f.includes('node_modules') && !f.includes(`${path.sep}dist${path.sep}`) && !/package-lock\.json$/.test(f))
    for (const file of files.filter((f) => /\.(css|scss)$/.test(f))) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css, path.relative(app, file)).not.toMatch(/color|font|border|shadow|background|--[a-z]/i)
    }
    for (const file of files.filter((f) => /\.(tsx?|mjs|json|html)$/.test(f) && !/verify\.config|\.test\./.test(f))) {
      expect(readFileSync(file, 'utf8'), path.relative(app, file)).not.toMatch(/tailwind/i)
    }
    expect(files.some((f) => /tailwind/i.test(path.basename(f)))).toBe(false)
  })
})
