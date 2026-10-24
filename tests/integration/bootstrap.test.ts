import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ROOT, walk } from '../support/files.ts'
import { remove, run } from '../support/repoCopy.ts'

/**
 * INT-001: the distributable bootstrap snapshot, materialized into fresh locations with the
 * skill's own helper (invoked from an unrelated working directory) and exercised through its
 * package scripts.
 */
const TOOL = path.join(ROOT, 'skills', 'presentation', 'scripts', 'presentation-tool.mjs')
const dirs: string[] = []
const tmp = (prefix: string) => {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(dir)
  return dir
}
afterAll(() => dirs.forEach(remove))

const outside = tmp('int001-cwd-')
const tool = (...args: string[]) => run('node', [TOOL, ...args], outside) // cwd is not the repository
const json = (output: string) => JSON.parse(output.slice(output.indexOf('{')))

let standalone = ''
let monorepo = ''
let monorepoApp = ''
const monorepoRootPackage = JSON.stringify({ name: 'big-repo', private: true, workspaces: ['packages/*'] }, null, 2)

beforeAll(async () => {
  standalone = path.join(tmp('int001-standalone-'), 'app')
  monorepo = tmp('int001-monorepo-')
  writeFileSync(path.join(monorepo, 'package.json'), `${monorepoRootPackage}\n`)
  writeFileSync(path.join(monorepo, 'README.md'), 'unrelated monorepo content\n')
  mkdirSync(path.join(monorepo, 'packages'))
  const detected = json((await tool('detect', monorepo)).output)
  monorepoApp = detected.target
  // The two installs are independent, so run them side by side.
  const [first, second] = await Promise.all([tool('scaffold', standalone, '--install'), tool('scaffold', monorepoApp, '--install')])
  expect(first.code, first.output).toBe(0)
  expect(second.code, second.output).toBe(0)
}, 900000)

describe('materialized standalone bootstrap', () => {
  it('has all three anchors and the complete dependency set installed from the lock data', () => {
    const pkg = JSON.parse(readFileSync(path.join(standalone, 'package.json'), 'utf8'))
    const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(declared).toEqual(expect.arrayContaining(['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']))
    for (const name of declared) expect(existsSync(path.join(standalone, 'node_modules', name, 'package.json')), name).toBe(true)
    const anchors = JSON.parse(execFileSync('node', [TOOL, 'detect', standalone], { cwd: outside, encoding: 'utf8' }))
    expect(anchors.anchors).toEqual({ build: true, kit: true, index: true })
    expect(anchors.missing).toEqual([])
    expect(existsSync(path.join(standalone, 'package-lock.json'))).toBe(true)
  })

  it('passes lint, builds, and its verification entry point renders the registered route', async () => {
    const lint = await run('npm', ['run', 'lint'], standalone)
    expect(lint.code, lint.output).toBe(0)
    const build = await run('npm', ['run', 'build'], standalone)
    expect(build.code, build.output).toBe(0)
    const verify = await run('npm', ['run', 'verify'], standalone)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/PASS verify: .*starter/)
    expect(verify.output).toMatch(/step 1 ok \(Then grow it\)/)
    expect(verify.output).toMatch(/http:\/\/127\.0\.0\.1:\d+\/starter/)
  })

  it('keeps the kit identical to the canonical source and the scripts identical to the root ones', () => {
    const rel = (base: string) => walk(base).map((f) => path.relative(base, f)).sort()
    const canonicalKit = path.join(ROOT, 'src', 'presentation-kit')
    const copy = path.join(standalone, 'src', 'presentation-kit')
    expect(rel(copy)).toEqual(rel(canonicalKit))
    for (const f of rel(canonicalKit)) expect(readFileSync(path.join(copy, f), 'utf8'), f).toBe(readFileSync(path.join(canonicalKit, f), 'utf8'))
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', ...rel(path.join(ROOT, 'scripts', 'lib')).map((l) => `lib/${l}`)]) {
      expect(readFileSync(path.join(standalone, 'scripts', f), 'utf8'), f).toBe(readFileSync(path.join(ROOT, 'scripts', f), 'utf8'))
    }
  })

  it('is style-neutral: no styling framework installed and no visual defaults in the scaffold', () => {
    expect(existsSync(path.join(standalone, 'node_modules', 'tailwindcss'))).toBe(false)
    const sources = walk(path.join(standalone, 'src')).filter((f) => /\.(css|tsx?)$/.test(f))
    for (const file of sources.filter((f) => f.endsWith('.css'))) {
      expect(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), file).not.toMatch(/color|font|background|border|shadow|--/)
    }
    expect(readFileSync(path.join(standalone, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('compiles and registers a presentation created from the skill template, from any working directory', async () => {
    const title = 'Created "From" Template */ with `ticks`'
    const created = await tool('new', standalone, 'created-from-template', '--title', title)
    expect(created.code, created.output).toBe(0)
    expect(json(created.output).route).toBe('/created-from-template')
    expect(readFileSync(path.join(standalone, 'src/presentations/index.ts'), 'utf8')).toContain("import('./created-from-template/Talk.tsx')")
    expect(existsSync(path.join(standalone, 'src/presentations/starter/Talk.tsx'))).toBe(true) // existing presentation preserved
    const build = await run('npm', ['run', 'build'], standalone)
    expect(build.code, build.output).toBe(0)
    const lint = await run('npm', ['run', 'lint'], standalone)
    expect(lint.code, lint.output).toBe(0)
  })
})

describe('materialized monorepo bootstrap', () => {
  it('lands in a self-contained presentations/ app and leaves the monorepo root alone', () => {
    expect(monorepoApp).toBe(path.join(monorepo, 'presentations'))
    expect(readFileSync(path.join(monorepo, 'package.json'), 'utf8')).toBe(`${monorepoRootPackage}\n`)
    expect(readFileSync(path.join(monorepo, 'README.md'), 'utf8')).toBe('unrelated monorepo content\n')
    expect(readdirSync(monorepo).sort()).toEqual(['README.md', 'package.json', 'packages', 'presentations'])
    expect(existsSync(path.join(monorepoApp, 'node_modules', 'react', 'package.json'))).toBe(true)
  })

  it('builds and renders on its own', async () => {
    const build = await run('npm', ['run', 'build'], monorepoApp)
    expect(build.code, build.output).toBe(0)
    const verify = await run('npm', ['run', 'verify'], monorepoApp)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/PASS verify/)
  })
})
