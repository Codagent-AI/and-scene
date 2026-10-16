import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const script = path.resolve(import.meta.dirname, '../../skills/presentation/scripts/scaffold.mjs')
const bootstrapDir = path.resolve(import.meta.dirname, '../../skills/presentation/templates/bootstrap')
const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  dirs.push(d)
  return d
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

const cli = (...args: string[]) => {
  const r = spawnSync('node', [script, ...args], { encoding: 'utf8', cwd: os.tmpdir() })
  return { status: r.status, out: r.stdout, err: r.stderr }
}
const detect = (dir: string) => JSON.parse(cli('detect', dir).out)
const put = (dir: string, rel: string, content: string) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), content)
}
const buildOnlyPackage = JSON.stringify({
  name: 'root',
  scripts: { build: 'vite build' },
  dependencies: { react: '^19.0.0' },
  devDependencies: { vite: '^8.0.0', typescript: '^6.0.0' },
})

describe('scaffold detect', () => {
  it('targets the root of an empty directory with all anchors missing', () => {
    const d = tmp()
    const r = detect(d)
    expect(r.target).toBe(d)
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.confirmationRequired).toBe(false)
  })

  it('skips scaffolding when all anchors are present, by contract rather than exact files', () => {
    const d = tmp()
    put(d, 'package.json', buildOnlyPackage)
    put(d, 'src/presentation-kit/index.tsx', 'export const Presentation = 1\n')
    put(d, 'src/presentations/index.tsx', "export const all = [{ slug: 'x' }]\n")
    const r = detect(d)
    expect(r.anchors).toEqual({ build: true, kit: true, index: true })
    expect(r.needsScaffold).toBe(false)
    expect(r.target).toBe(d)
  })

  it('targets presentations/ for a monorepo and requires confirmation when non-empty', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ ...JSON.parse(buildOnlyPackage), workspaces: ['packages/*'] }))
    const r = detect(d)
    expect(r.monorepo).toBe(true)
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(r.confirmationRequired).toBe(true)
  })

  it.each([['pnpm-workspace.yaml', 'packages:\n  - a\n'], ['packages/a/package.json', '{}'], ['apps/web/package.json', '{}']])(
    'recognizes the monorepo signal %s',
    (rel, content) => {
      const d = tmp()
      put(d, 'package.json', buildOnlyPackage)
      put(d, rel, content)
      expect(detect(d).target).toBe(path.join(d, 'presentations'))
    },
  )

  it('reuses an existing presentations/ app inside a monorepo', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: ['presentations'] }))
    cpSync(bootstrapDir, path.join(d, 'presentations'), { recursive: true })
    const r = detect(d)
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(r.needsScaffold).toBe(false)
  })
})

describe('scaffold bootstrap', () => {
  it('refuses to write to a non-empty project before confirmation', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'], name: 'mono' }))
    put(d, 'README.md', 'keep me')
    const before = readdirSync(d).sort()
    const r = cli('bootstrap', d, '--no-install')
    expect(r.status).toBe(2)
    expect(r.err).toMatch(/confirm/)
    expect(readdirSync(d).sort()).toEqual(before)
  })

  it('scaffolds a self-contained presentations/ app in a partial monorepo and preserves root content', () => {
    const d = tmp()
    const rootPkg = JSON.stringify({ ...JSON.parse(buildOnlyPackage), workspaces: ['packages/*'] }, null, 2) + '\n'
    put(d, 'package.json', rootPkg)
    put(d, 'README.md', 'keep me')
    put(d, 'packages/a/index.ts', 'export {}\n')
    const r = cli('bootstrap', d, '--confirmed', '--no-install')
    expect(r.status).toBe(0)
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(rootPkg)
    expect(readFileSync(path.join(d, 'README.md'), 'utf8')).toBe('keep me')
    expect(existsSync(path.join(d, 'src'))).toBe(false)
    const app = path.join(d, 'presentations')
    expect(detect(d).anchors).toEqual({ build: true, kit: true, index: true })
    expect(detect(d).target).toBe(app)
    expect(existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
  })

  it('scaffolds only missing anchors in a standalone project without disturbing existing files', () => {
    const d = tmp()
    const pkg = { name: 'mine', private: true, scripts: { build: 'tsc -b && vite build', custom: 'echo hi' }, dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '^6.0.0' } }
    put(d, 'package.json', JSON.stringify(pkg))
    put(d, 'vite.config.ts', '// mine\n')
    put(d, 'src/main.tsx', '// my main\n')
    const r = cli('bootstrap', d, '--confirmed', '--no-install')
    expect(r.status).toBe(0)
    expect(readFileSync(path.join(d, 'vite.config.ts'), 'utf8')).toBe('// mine\n')
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toBe('// my main\n')
    expect(existsSync(path.join(d, 'src/presentation-kit/index.ts'))).toBe(true)
    expect(existsSync(path.join(d, 'src/presentations/index.ts'))).toBe(true)
    const merged = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(merged.name).toBe('mine')
    expect(merged.scripts.custom).toBe('echo hi')
    expect(merged.scripts.build).toBe(pkg.scripts.build)
    expect(merged.dependencies.react).toBe('^19.0.0')
    for (const dep of ['motion', 'lucide-react', 'react-dom']) expect(merged.dependencies[dep]).toBeDefined()
    expect(merged.devDependencies.playwright).toBeDefined()
    expect(Object.keys({ ...merged.dependencies, ...merged.devDependencies }).filter((k) => /tailwind/.test(k))).toEqual([])
  })

  it('does nothing when every anchor is already present', () => {
    const d = tmp()
    cpSync(bootstrapDir, d, { recursive: true })
    put(d, 'src/presentations/index.ts', readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8') + '// custom\n')
    const r = JSON.parse(cli('bootstrap', d, '--no-install').out)
    expect(r.needsScaffold).toBe(false)
    expect(r.wrote).toEqual([])
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toContain('// custom')
  })

  it('scaffolds an empty directory at its root with the complete anchor set', () => {
    const d = tmp()
    expect(cli('bootstrap', d, '--no-install').status).toBe(0)
    expect(detect(d).needsScaffold).toBe(false)
  })
})

describe('scaffold new', () => {
  const app = () => {
    const d = tmp()
    cpSync(bootstrapDir, d, { recursive: true })
    return d
  }

  it('creates a self-contained folder, registers one line, and keeps existing presentations', () => {
    const d = app()
    const starter = readFileSync(path.join(d, 'src/presentations/starter/Talk.tsx'), 'utf8')
    const r = cli('new', d, 'my-deck', 'My "Deck"')
    expect(r.status).toBe(0)
    expect(JSON.parse(r.out).route).toBe('/my-deck')
    for (const f of ['Talk.tsx', 'entities.ts', 'presentation.css', 'steps/Scene.tsx', 'steps/index.ts']) {
      expect(existsSync(path.join(d, 'src/presentations/my-deck', f)), f).toBe(true)
    }
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'starter'")
    expect(registry).toContain("slug: 'my-deck'")
    expect(registry).toContain('title: "My \\"Deck\\""')
    expect(readFileSync(path.join(d, 'src/presentations/starter/Talk.tsx'), 'utf8')).toBe(starter)
    expect(readFileSync(path.join(d, 'src/presentations/my-deck/presentation.css'), 'utf8')).toMatch(/\.my-deck /)
  })

  it('rejects duplicate and invalid slugs without changing anything', () => {
    const d = app()
    const before = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(cli('new', d, 'starter', 'Again').status).toBe(1)
    expect(cli('new', d, 'Bad Slug', 'x').status).toBe(1)
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toBe(before)
  })

  it('does not ship visual styles in the presentation templates', () => {
    const d = app()
    cli('new', d, 'plain', 'Plain')
    const css = readFileSync(path.join(d, 'src/presentations/plain/presentation.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/:\s*[^;{}\s][^;{}]*;/)
  })
})
