import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, renameSync, symlinkSync, writeFileSync } from 'node:fs'
import { REPO, SKILL_CLI, cleanupTmp, exists, materialize, run, tmpDir } from '../helpers'

afterAll(cleanupTmp)

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : [p]
  })

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('installs from the lock, builds, and renders its registered route outside the source repo', () => {
    const app = materialize({ install: 'ci' })
    for (const anchor of ['package.json', 'src/presentation-kit/index.ts', 'src/presentations/index.ts', 'vite.config.ts']) {
      expect(exists(app, anchor), anchor).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const d of ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright']) {
      expect(deps, d).toContain(d)
    }
    expect(deps.some((d) => /tailwind/i.test(d))).toBe(false)

    const lint = run('npm', ['run', 'lint'], app)
    expect(lint.status, lint.out).toBe(0)
    const verify = run('npm', ['run', 'verify'], app)
    expect(verify.status, verify.out).toBe(0)
    expect(verify.out).toContain('PASS')
    expect(verify.out).toContain('starter')
  })

  it('keeps the template kit aligned with the canonical kit and introduces no visual defaults', () => {
    const app = materialize()
    const canon = path.join(REPO, 'src/presentation-kit')
    for (const f of walk(canon).filter((p) => !/\.test\.tsx?$/.test(p))) {
      const rel = path.relative(canon, f)
      expect(readFileSync(path.join(app, 'src/presentation-kit', rel), 'utf8'), rel).toBe(readFileSync(f, 'utf8'))
    }
    for (const f of walk(app).filter((p) => /\.(css|tsx?)$/.test(p))) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/tailwind/i)
      if (f.endsWith('.css')) expect(src, f).not.toMatch(/(^|[;{\s])(color|background|font-family|border)\s*:/m)
    }
  })

  it('wires a partially scaffolded existing app and tolerates a renamed registry', () => {
    const app = tmpDir('partial-')
    expect(run('node', [SKILL_CLI, 'scaffold', app, '--only', 'build'], app).status).toBe(0)
    symlinkSync(path.join(REPO, 'node_modules'), path.join(app, 'node_modules'), 'dir')
    // An existing working entry point that knows nothing about presentations.
    mkdirSync(path.join(app, 'src'), { recursive: true })
    writeFileSync(
      path.join(app, 'src/main.tsx'),
      "import { createRoot } from 'react-dom/client'\n\ncreateRoot(document.getElementById('root')!).render(<p>Existing working app</p>)\n",
    )
    const res = run('node', [SKILL_CLI, 'scaffold', app], app)
    expect(res.status, res.out).toBe(0)
    expect(res.out).toContain('src/main.tsx (routes registered presentations')
    renameSync(path.join(app, 'src/presentations/index.ts'), path.join(app, 'src/presentations/index.tsx'))
    const verify = run('npm', ['run', 'verify'], app)
    expect(verify.status, verify.out).toBe(0)
    expect(verify.out).toContain('starter: 2 steps rendered cleanly')
  })
})
