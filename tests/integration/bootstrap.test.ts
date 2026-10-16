import { cpSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { bootstrapTemplate, cleanupTemp, repoRoot, run, scaffoldScript, tempDir } from './helpers'

afterAll(cleanupTemp)

function walk(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p, base) : [path.relative(base, p)]
  })
}

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  const project = tempDir('bootstrap')
  const elsewhere = tempDir('cwd') // the caller's working directory is unrelated to the skill

  it('materializes from outside the repository, installs from lock data, builds, and verifies a route', () => {
    const scaffold = run('node', [scaffoldScript, 'bootstrap', project, '--no-install'], { cwd: elsewhere })
    expect(scaffold.status).toBe(0)

    const detect = JSON.parse(run('node', [scaffoldScript, 'detect', project], { cwd: elsewhere }).output)
    expect(detect.anchors).toEqual({ build: true, kit: true, index: true })
    expect(detect.target).toBe(project)

    const ci = run('npm', ['ci'], { cwd: project })
    expect(ci.status, ci.output).toBe(0)
    const build = run('npm', ['run', 'build'], { cwd: project })
    expect(build.status, build.output).toBe(0)
    const verify = run('npm', ['run', 'verify'], { cwd: project })
    expect(verify.status, verify.output).toBe(0)
    expect(verify.output).toMatch(/rendered starter: 2 steps via http:\/\/127\.0\.0\.1:\d+/)
    expect(verify.output).toContain('[verify] PASS')
    const lint = run('npm', ['run', 'lint'], { cwd: project })
    expect(lint.status, lint.output).toBe(0)
  })

  it('has the complete dependency set and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.join(project, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'playwright']) {
      expect(deps, d).toContain(d)
    }
    expect(deps.filter((d) => /tailwind/i.test(d))).toEqual([])
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts[script], script).toBeTruthy()
    expect(existsSync(path.join(project, 'package-lock.json'))).toBe(true)
  })

  it('ships no visual defaults in the scaffold CSS or config', () => {
    const css = readFileSync(path.join(project, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/(color|background|font|border|shadow)/i)
    expect(walk(path.join(project, 'src')).filter((f) => f.endsWith('.css'))).toEqual(['index.css'])
    expect(existsSync(path.join(project, 'tailwind.config.js'))).toBe(false)
  })

  it('keeps the canonical kit and the template copy byte-aligned', () => {
    const canonical = path.join(repoRoot, 'src/presentation-kit')
    const copy = path.join(bootstrapTemplate, 'src/presentation-kit')
    const files = walk(canonical).filter((f) => !/\.test\./.test(f))
    expect(files.length).toBeGreaterThan(10)
    expect(walk(copy).filter((f) => !/\.test\./.test(f)).sort()).toEqual(files.sort())
    for (const f of files) {
      expect(readFileSync(path.join(copy, f), 'utf8'), f).toBe(readFileSync(path.join(canonical, f), 'utf8'))
      expect(readFileSync(path.join(project, 'src/presentation-kit', f), 'utf8'), `materialized ${f}`).toBe(readFileSync(path.join(canonical, f), 'utf8'))
    }
  })

  it('keeps root verification and inspection scripts aligned with the template', () => {
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs']) {
      expect(readFileSync(path.join(bootstrapTemplate, 'scripts', f), 'utf8'), f).toBe(readFileSync(path.join(repoRoot, 'scripts', f), 'utf8'))
    }
  })

  it('resolves templates from the skill directory regardless of cwd', () => {
    const other = tempDir('empty-cwd')
    const copyOfSkillCaller = tempDir('caller')
    cpSync(scaffoldScript, path.join(copyOfSkillCaller, 'unrelated.mjs')) // a stray copy must not matter
    const out = run('node', [scaffoldScript, 'detect', other], { cwd: copyOfSkillCaller })
    expect(JSON.parse(out.output).target).toBe(other)
  })
})
