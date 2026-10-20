import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR, SKILL_DIR, createPresentation, detectAnchors, isMonorepo, listPresentations, mergePackageJson,
  resolveTarget, scaffold,
} from '../../skills/presentation/scripts/scaffold.mjs'
import { listFiles, repoRoot } from './helpers.ts'

const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'scaffold-unit-'))
const write = (dir: string, rel: string, text: string) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
/** Path -> content hash for every file, to prove nothing existing was touched. */
const snapshot = (dir: string) =>
  Object.fromEntries(
    listFiles(dir).map((f) => [f, createHash('sha1').update(readFileSync(path.join(dir, f))).digest('hex')]),
  )
const materialized = () => {
  const dir = tmp()
  cpSync(BOOTSTRAP_DIR, dir, { recursive: true })
  return dir
}
const buildPkg = (extra: object = {}) =>
  JSON.stringify({
    name: 'host',
    scripts: { build: 'vite build', start: 'node start.js' },
    dependencies: { react: '^19.0.0' },
    devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' },
    ...extra,
  })

describe('skill location', () => {
  it('resolves templates from the skill directory, not the working directory', () => {
    expect(SKILL_DIR).toBe(path.join(repoRoot, 'skills/presentation'))
    expect(BOOTSTRAP_DIR).toBe(path.join(SKILL_DIR, 'templates/bootstrap'))
    expect(existsSync(path.join(BOOTSTRAP_DIR, 'package.json'))).toBe(true)
  })

  it('scaffolds when invoked from a foreign working directory', () => {
    const project = tmp()
    const r = spawnSync(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'scaffold', project, '--no-install'], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
    })
    expect(r.status, r.stderr).toBe(0)
    expect(JSON.parse(r.stdout).status).toBe('scaffolded')
    expect(detectAnchors(project)).toEqual({ build: true, kit: true, index: true })
  })
})

describe('anchor detection', () => {
  it('finds all three anchors in a materialized app and none in an empty directory', () => {
    expect(detectAnchors(materialized())).toEqual({ build: true, kit: true, index: true })
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it.each([
    ['build setup', (d: string) => rmSync(path.join(d, 'vite.config.ts')), { build: false, kit: true, index: true }],
    ['scene kit', (d: string) => rmSync(path.join(d, 'src/presentation-kit'), { recursive: true }), { build: true, kit: false, index: true }],
    ['presentation index', (d: string) => rmSync(path.join(d, 'src/presentations/index.ts')), { build: true, kit: true, index: false }],
  ])('reports exactly the missing %s', (_n, remove, expected) => {
    const d = materialized()
    remove(d)
    expect(detectAnchors(d)).toEqual(expected)
  })

  it('needs every part of the kit contract, not just one file', () => {
    const d = materialized()
    rmSync(path.join(d, 'src/presentation-kit/Stage.tsx'))
    expect(detectAnchors(d).kit).toBe(false)
  })

  it('ignores cosmetic differences: other file names, directories, and extra dependencies', () => {
    const d = materialized()
    renameSync(path.join(d, 'src/presentation-kit'), path.join(d, 'src/engine'))
    renameSync(path.join(d, 'src/engine/Presentation.tsx'), path.join(d, 'src/engine/Deck.tsx'))
    mkdirSync(path.join(d, 'src/talks'))
    renameSync(path.join(d, 'src/presentations/index.ts'), path.join(d, 'src/talks/registry.ts'))
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    pkg.dependencies['left-pad'] = '1.0.0'
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    renameSync(path.join(d, 'vite.config.ts'), path.join(d, 'vite.config.mts'))
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('requires a working build script and the core build dependencies', () => {
    const d = tmp()
    write(d, 'vite.config.ts', 'export default {}')
    write(d, 'package.json', buildPkg())
    expect(detectAnchors(d).build).toBe(true)
    write(d, 'package.json', buildPkg({ scripts: { start: 'x' } }))
    expect(detectAnchors(d).build).toBe(false)
    write(d, 'package.json', buildPkg({ devDependencies: { vite: '1' } }))
    expect(detectAnchors(d).build).toBe(false)
  })
})

describe('target resolution', () => {
  it.each([
    ['a workspaces field', (d: string) => write(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['a packages/ directory', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['an apps/ directory', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('treats %s as a monorepo signal on its own', (_n, setup) => {
    const d = tmp()
    expect(isMonorepo(d)).toBe(false)
    setup(d)
    expect(isMonorepo(d)).toBe(true)
    expect(resolveTarget(d).target).toBe(path.join(d, 'presentations'))
  })

  it('uses the root for empty and standalone projects', () => {
    const empty = tmp()
    expect(resolveTarget(empty).target).toBe(empty)
    const standalone = tmp()
    write(standalone, 'package.json', buildPkg())
    expect(resolveTarget(standalone).target).toBe(standalone)
  })

  it('uses an existing presentation app as the target even when it sits in a monorepo layout', () => {
    const d = materialized()
    mkdirSync(path.join(d, 'packages'))
    expect(resolveTarget(d).target).toBe(d)
  })
})

describe('scaffolding', () => {
  it('fully scaffolds an empty directory without asking for confirmation', () => {
    const d = tmp()
    const r = scaffold(d, { install: false })
    expect(r.status).toBe('scaffolded')
    expect(r.target).toBe(d)
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    for (const f of ['package-lock.json', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/Router.tsx']) {
      expect(existsSync(path.join(d, f)), f).toBe(true)
    }
    expect(JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8')).dependencies.motion).toBeTruthy()
  })

  it('skips an already scaffolded app and leaves every file untouched', () => {
    const d = materialized()
    const before = snapshot(d)
    const r = scaffold(d, { install: false, confirmed: true })
    expect(r.status).toBe('already-scaffolded')
    expect(r.missing).toEqual([])
    expect(snapshot(d)).toEqual(before)
  })

  it('scaffolds only the missing anchor in a partial app, after confirmation, without disturbing the rest', () => {
    const d = materialized()
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    rmSync(path.join(d, 'scripts'), { recursive: true })
    write(d, 'src/presentations/mine/Talk.tsx', '// custom\n')
    write(d, 'src/main.tsx', '// customized entry\n')
    const before = snapshot(d)
    const pending = scaffold(d, { install: false })
    expect(pending.status).toBe('needs-confirmation')
    expect(pending.missing).toEqual(['kit'])
    expect(snapshot(d)).toEqual(before) // nothing written until confirmed
    const done = scaffold(d, { install: false, confirmed: true })
    expect(done.status).toBe('scaffolded')
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    const after = snapshot(d)
    for (const [f, hash] of Object.entries(before)) expect(after[f], f).toBe(hash)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('src/presentation-kit/') || f.startsWith('scripts/'))).toBe(true)
  })

  it('never overwrites existing files and reports when route wiring is left to the user', () => {
    const d = tmp()
    write(d, 'package.json', buildPkg())
    write(d, 'vite.config.ts', '// mine\nexport default {}\n')
    write(d, 'index.html', '<!-- mine -->')
    write(d, 'src/main.tsx', '// mine\n')
    const r = scaffold(d, { install: false, confirmed: true })
    expect(r.status).toBe('scaffolded')
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toBe('// mine\n')
    expect(readFileSync(path.join(d, 'index.html'), 'utf8')).toBe('<!-- mine -->')
    expect(r.skipped).toContain('src/main.tsx')
    expect(r.needsRouteWiring).toBe(true)
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('vite build')
    expect(pkg.scripts.start).toBe('node start.js')
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.dependencies.react).toBe('^19.0.0')
    expect(pkg.dependencies.motion).toBeTruthy()
  })

  it('asks for confirmation before writing to a non-empty project that lacks the kit or index', () => {
    const d = tmp()
    write(d, 'README.md', 'hello')
    const before = snapshot(d)
    const r = scaffold(d, { install: false })
    expect(r.status).toBe('needs-confirmation')
    expect(r.target).toBe(d)
    expect(r.created.length).toBeGreaterThan(0)
    expect(snapshot(d)).toEqual(before)
    expect(scaffold(d, { install: false, confirmed: true }).status).toBe('scaffolded')
  })

  it('puts a self-contained app in presentations/ for a monorepo and leaves the root untouched', () => {
    const d = tmp()
    write(d, 'package.json', buildPkg({ workspaces: ['apps/*'] }))
    write(d, 'vite.config.ts', '// root build\nexport default {}\n')
    write(d, 'README.md', 'monorepo')
    write(d, 'apps/web/index.ts', 'export {}\n')
    expect(detectAnchors(d).build).toBe(true)
    const before = snapshot(d)
    const pending = scaffold(d, { install: false })
    expect(pending.status).toBe('needs-confirmation')
    expect(pending.target).toBe(path.join(d, 'presentations'))
    expect(snapshot(d)).toEqual(before)
    const done = scaffold(d, { install: false, confirmed: true })
    expect(done.status).toBe('scaffolded')
    const after = snapshot(d)
    for (const [f, hash] of Object.entries(before)) expect(after[f], f).toBe(hash)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detectAnchors(path.join(d, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(d, 'presentations/package.json'))).toBe(true)
    expect(existsSync(path.join(d, 'src'))).toBe(false)
  })

  it('reuses an existing presentations/ app inside a monorepo', () => {
    const d = tmp()
    write(d, 'package.json', JSON.stringify({ workspaces: ['presentations'] }))
    cpSync(BOOTSTRAP_DIR, path.join(d, 'presentations'), { recursive: true })
    const before = snapshot(d)
    const r = scaffold(d, { install: false, confirmed: true })
    expect(r.status).toBe('already-scaffolded')
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(snapshot(d)).toEqual(before)
  })

  it('merges only missing dependencies and scripts into an existing manifest', () => {
    const merged = mergePackageJson(
      { name: 'x', scripts: { build: 'mine' }, dependencies: { react: '1' } },
      { scripts: { build: 'theirs', verify: 'v' }, dependencies: { react: '2', motion: 'm' }, devDependencies: { vite: 'v' } },
    )
    expect(merged).toEqual({
      name: 'x',
      scripts: { build: 'mine', verify: 'v' },
      dependencies: { react: '1', motion: 'm' },
      devDependencies: { vite: 'v' },
    })
  })
})

describe('creating a presentation', () => {
  const addFixture = (d: string) => {
    write(d, 'src/presentations/existing/Talk.tsx', 'export default function Talk() { return null }\n')
    const reg = path.join(d, 'src/presentations/index.ts')
    writeFileSync(
      reg,
      readFileSync(reg, 'utf8').replace(/\n\]/, "\n  { slug: 'existing', title: 'Existing', load: () => import('./existing/Talk.tsx') },\n]"),
    )
  }

  it('adds its own folder, registers it, and leaves every existing file and entry intact', () => {
    const d = materialized()
    addFixture(d)
    const before = snapshot(d)
    const r = createPresentation(d, { slug: 'my-talk', title: 'My "Great" Talk' })
    expect(r.written.sort()).toEqual(
      ['Scene.tsx', 'Talk.tsx', 'entities.ts', 'steps/index.ts', 'steps/meta.ts', 'talk.css'].map((f) => `src/presentations/my-talk/${f}`).sort(),
    )
    const after = snapshot(d)
    const changed = Object.keys(before).filter((f) => before[f] !== after[f])
    expect(changed).toEqual(['src/presentations/index.ts'])
    expect(Object.keys(before).every((f) => f in after)).toBe(true)
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    for (const slug of ['how-to-make-a-presentation', 'existing', 'my-talk']) expect(registry).toContain(`slug: '${slug}'`)
    expect(listPresentations(d).map((p) => p.slug)).toEqual(['how-to-make-a-presentation', 'existing', 'my-talk'])
    expect(readFileSync(path.join(d, 'src/presentations/my-talk/Talk.tsx'), 'utf8')).toContain('title="My \\"Great\\" Talk"')
    expect(readFileSync(path.join(d, 'src/presentations/my-talk/steps/index.ts'), 'utf8')).toContain("groupKey: 'my-talk'")
  })

  it('refuses an existing slug or an invalid one and writes nothing', () => {
    const d = materialized()
    const before = snapshot(d)
    expect(() => createPresentation(d, { slug: 'how-to-make-a-presentation', title: 'x' })).toThrow(/already exists/)
    expect(() => createPresentation(d, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => createPresentation(tmp(), { slug: 'ok', title: 'x' })).toThrow(/scaffold first/)
    expect(snapshot(d)).toEqual(before)
  })

  it('finds the presentation template relative to the skill when run from another directory', () => {
    const d = materialized()
    const r = spawnSync(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'create', d, 'cli-talk', 'CLI Talk'], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
    })
    expect(r.status, r.stderr).toBe(0)
    expect(existsSync(path.join(d, 'src/presentations/cli-talk/Talk.tsx'))).toBe(true)
    const list = spawnSync(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'list', d], { cwd: os.tmpdir(), encoding: 'utf8' })
    expect(JSON.parse(list.stdout).map((p: { slug: string }) => p.slug)).toContain('cli-talk')
  })

  it('lists nothing for an app without an index', () => {
    expect(listPresentations(tmp())).toEqual([])
  })
})
