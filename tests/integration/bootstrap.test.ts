import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { SOURCE_ROOT } from '../helpers/repoCopy'

const SKILL_DIR = path.join(SOURCE_ROOT, 'skills', 'presentation')
const BOOTSTRAP = path.join(SKILL_DIR, 'templates', 'bootstrap')

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}
const rel = (base: string, f: string) => path.relative(base, f).split(path.sep).join('/')
const read = (...p: string[]) => fs.readFileSync(path.join(...p), 'utf8')

function run(cmd: string, args: string[], cwd: string, timeoutMs = 280000): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const t = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(t)
      resolve({ code, out })
    })
  })
}

describe('template alignment', () => {
  it('bootstrap kit files are byte-identical to the canonical kit', () => {
    const canonical = walk(path.join(SOURCE_ROOT, 'src', 'presentation-kit')).filter((f) => !/\.(test|spec)\./.test(f))
    const copies = walk(path.join(BOOTSTRAP, 'src', 'presentation-kit'))
    expect(copies.map((f) => rel(BOOTSTRAP, f)).sort()).toEqual(canonical.map((f) => rel(SOURCE_ROOT, f)).sort())
    for (const f of canonical) {
      const copy = path.join(BOOTSTRAP, rel(SOURCE_ROOT, f))
      expect(fs.readFileSync(copy).equals(fs.readFileSync(f)), `${rel(SOURCE_ROOT, f)} drifted; run npm run sync:templates`).toBe(true)
    }
  })

  it.each(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/main.tsx', 'src/Landing.tsx', 'src/routes.ts'])(
    '%s is aligned with the root copy',
    (file) => {
      expect(read(BOOTSTRAP, file), `${file} drifted; run npm run sync:templates`).toBe(read(SOURCE_ROOT, file))
    },
  )

  it('sync script reports no drift on an aligned tree', async () => {
    const mod = (await import(/* @vite-ignore */ path.join(SOURCE_ROOT, 'scripts', 'sync-bootstrap-templates.mjs'))) as { drift(): string[] }
    expect(mod.drift()).toEqual([])
  })
})

describe('bootstrap snapshot contents', () => {
  const pkg = JSON.parse(read(BOOTSTRAP, 'package.json'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  it('declares the full dependency set and scripts', () => {
    for (const d of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint',
      'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(deps, d).toHaveProperty(d)
    }
    for (const s of ['dev', 'build', 'lint', 'preview', 'verify', 'inspect']) expect(pkg.scripts, s).toHaveProperty(s)
    const rootPkg = JSON.parse(read(SOURCE_ROOT, 'package.json'))
    const rootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
    for (const [name, version] of Object.entries(deps)) expect(rootDeps[name], `${name} version`).toBe(version)
  })

  it('has all three anchors, lock data, and a gitignore covering outputs', () => {
    for (const f of ['package-lock.json', 'src/presentation-kit/index.ts', 'src/presentations/index.ts', 'src/main.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(fs.existsSync(path.join(BOOTSTRAP, f)), f).toBe(true)
    }
    const ignore = read(BOOTSTRAP, '.gitignore')
    expect(ignore).toMatch(/^dist$/m)
    expect(ignore).toMatch(/^\.inspection$/m)
    expect(ignore).toMatch(/^node_modules$/m)
  })

  it('registers the starter and lists it in the verification config without expectedSteps', () => {
    expect(read(BOOTSTRAP, 'src/presentations/index.ts')).toMatch(/slug: 'starter'/)
    const cfg = JSON.parse(read(BOOTSTRAP, 'scripts/verification.config.json'))
    expect(cfg.presentations).toEqual([{ slug: 'starter' }])
  })

  it('introduces no Tailwind or visual defaults', () => {
    expect(Object.keys(deps).filter((d) => /tailwind/i.test(d))).toEqual([])
    const files = walk(BOOTSTRAP).filter((f) => !/package-lock\.json$/.test(f))
    for (const f of files) {
      if (/\.(tsx?|css|json|js|html)$/.test(f)) expect(fs.readFileSync(f, 'utf8'), rel(BOOTSTRAP, f)).not.toMatch(/tailwind/i)
    }
    const css = files.filter((f) => f.endsWith('.css'))
    for (const f of css) {
      const src = fs.readFileSync(f, 'utf8')
      expect(src, rel(BOOTSTRAP, f)).not.toMatch(/\b(?:color|background\w*|font\w*|border\w*|box-shadow|padding\w*|gap)\s*:|#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(|--[a-z][\w-]*\s*:/)
    }
    expect(fs.existsSync(path.join(BOOTSTRAP, 'src', 'presentations', 'starter', 'Talk.tsx'))).toBe(true)
  })
})

describe('skill file', () => {
  const skill = read(SKILL_DIR, 'SKILL.md')
  it('has name frontmatter and the required procedure', () => {
    expect(skill).toMatch(/^---\nname: presentation\ndescription: .+\n---/)
    for (const needle of ['one at a time', 'partial detail', 'presentations/', 'verification.config.json', 'npm run verify', 'npm run inspect', '390x844', 'data-presentation-allow-overlap', 'data-presentation-attribution', 'directory that contains']) {
      expect(skill, needle).toContain(needle)
    }
  })
  it('ships the new-presentation templates', () => {
    for (const f of ['entities.ts', 'Talk.tsx', 'talk.css', 'steps/Scene.tsx', 'steps/01-first.tsx', 'steps/index.ts', 'registry-line.txt']) {
      expect(fs.existsSync(path.join(SKILL_DIR, 'templates', 'presentation', f)), f).toBe(true)
    }
  })
})

describe('INT-001 materialized bootstrap builds and renders outside the repo', () => {
  const dirs: string[] = []
  afterAll(() => dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })))

  it('installs from the lockfile, builds, and passes the route smoke check', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    dirs.push(dir)
    fs.cpSync(BOOTSTRAP, dir, { recursive: true })

    const install = await run('npm', ['ci', '--no-audit', '--no-fund'], dir)
    expect(install.code, install.out).toBe(0)
    const build = await run('npm', ['run', 'build'], dir)
    expect(build.code, build.out).toBe(0)
    const lint = await run('npm', ['run', 'lint'], dir)
    expect(lint.code, lint.out).toBe(0)
    // invoked from outside the source repository
    const verify = await run(process.execPath, [path.join(dir, 'scripts', 'verify.mjs')], os.tmpdir())
    expect(verify.out).toMatch(/PASS verify/)
    expect(verify.out).toMatch(/render: ok starter \(2 steps at http:\/\/127\.0\.0\.1:\d+\/starter\)/)
    expect(verify.code).toBe(0)
  }, 600000)
})
