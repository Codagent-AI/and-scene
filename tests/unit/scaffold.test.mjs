import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  applyScaffold,
  createPresentation,
  detectAnchors,
  isEmptyDir,
  isMonorepo,
  planScaffold,
  resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'
import { listFiles } from '../helpers/kit-scan.mjs'

const tmp = () => mkdtempSync(path.join(tmpdir(), 'scaffold-'))
const write = (dir, rel, text = '') => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
const buildOnly = (dir, extra = {}) =>
  write(
    dir,
    'package.json',
    JSON.stringify({ name: 'host', scripts: { build: 'vite build', start: 'x' }, dependencies: { react: '^18.0.0' }, devDependencies: { vite: '^5', typescript: '^5' }, ...extra }),
  )
const copyOf = (dir, ...entries) => {
  for (const e of entries) cpSync(path.join(BOOTSTRAP_DIR, e), path.join(dir, e), { recursive: true })
}
const cli = (...args) => spawnSync(process.execPath, [path.resolve(import.meta.dirname, '../../skills/presentation/scripts/scaffold.mjs'), ...args], { encoding: 'utf8', cwd: tmpdir() })

describe('anchor detection', () => {
  it('finds none in an empty directory', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three in the bootstrap template, whatever else is present', () => {
    expect(detectAnchors(BOOTSTRAP_DIR)).toEqual({ build: true, kit: true, index: true })
  })

  it('is contract-level: renamed files, extra dependencies and formatting do not matter', () => {
    const dir = tmp()
    buildOnly(dir, { dependencies: { react: '1', lodash: '1' } })
    write(dir, 'src/engine/Deck.tsx', 'import { AnimatePresence } from "motion/react"\nexport const Presentation = () => null\nexport type Step = { id: string }\n')
    write(dir, 'src/talks.ts', 'export const all = [{ slug: "x", load: () => null }]')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not treat a bare directory or incomplete capability as an anchor', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    mkdirSync(path.join(dir, 'src/presentations'), { recursive: true })
    write(dir, 'package.json', JSON.stringify({ scripts: {}, dependencies: { react: '1' } }))
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })
})

describe('target resolution', () => {
  it('uses the root for an empty directory and for a standalone project', () => {
    const empty = tmp()
    expect(resolveTarget(empty).target).toBe(empty)
    expect(isEmptyDir(empty)).toBe(true)
    const standalone = tmp()
    buildOnly(standalone)
    expect(resolveTarget(standalone).target).toBe(standalone)
    expect(isEmptyDir(standalone)).toBe(false)
  })

  it('recognises each monorepo signal and scaffolds under presentations/', () => {
    const signals = {
      workspaces: (d) => write(d, 'package.json', JSON.stringify({ workspaces: ['a'], scripts: { build: 'x' } })),
      pnpm: (d) => write(d, 'pnpm-workspace.yaml', 'packages: []'),
      packages: (d) => mkdirSync(path.join(d, 'packages')),
      apps: (d) => mkdirSync(path.join(d, 'apps')),
    }
    for (const [name, make] of Object.entries(signals)) {
      const dir = tmp()
      make(dir)
      expect(isMonorepo(dir), name).toBe(true)
      expect(resolveTarget(dir).target, name).toBe(path.join(dir, 'presentations'))
    }
  })

  it('reuses an existing presentation app instead of the monorepo rule', () => {
    const inside = tmp()
    mkdirSync(path.join(inside, 'apps'))
    copyOf(inside, 'src', 'package.json')
    expect(resolveTarget(inside).target).toBe(inside)
    const nested = tmp()
    mkdirSync(path.join(nested, 'packages'))
    mkdirSync(path.join(nested, 'presentations'))
    copyOf(path.join(nested, 'presentations'), 'package.json')
    expect(resolveTarget(nested).target).toBe(path.join(nested, 'presentations'))
  })
})

describe('scaffolding', () => {
  it('plans a full scaffold for an empty directory including the lock file', () => {
    const plan = planScaffold(tmp())
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
    expect(plan.create).toContain('package-lock.json')
    expect(plan.create).toContain('src/presentation-kit/Presentation.tsx')
    expect(plan.create).toContain('src/presentations/index.ts')
    expect(plan.keep).toEqual([])
  })

  it('writes nothing when every anchor is present', () => {
    const dir = tmp()
    cpSync(BOOTSTRAP_DIR, dir, { recursive: true })
    const plan = planScaffold(dir)
    expect(plan.missing).toEqual([])
    expect(applyScaffold(dir, plan)).toEqual({ created: [], kept: [], merged: [] })
  })

  it('adds only the missing anchors and leaves existing files and dependencies untouched', () => {
    const dir = tmp()
    buildOnly(dir)
    write(dir, 'src/main.tsx', 'host main')
    write(dir, 'README.md', 'host readme')
    const before = readFileSync(path.join(dir, 'package.json'), 'utf8')
    const plan = planScaffold(dir)
    expect(plan.missing).toEqual(['kit', 'index'])
    expect(plan.create).not.toContain('package.json')
    expect(plan.create).not.toContain('vite.config.ts')
    expect(plan.keep).toContain('src/main.tsx')
    const result = applyScaffold(dir, plan)
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('host main')
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('host readme')
    expect(existsSync(path.join(dir, 'src/presentation-kit/Stage.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'vite.config.ts'))).toBe(false)
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(false)
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.scripts.start).toBe('x')
    expect(pkg.dependencies.motion).toBeTruthy()
    expect(pkg.devDependencies.playwright).toBeTruthy()
    expect(result.merged).toContain('dependencies.motion')
    expect(JSON.parse(before).dependencies.react).toBe(pkg.dependencies.react)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not overwrite a kept file in a partial scaffold when the index anchor is missing but kit exists', () => {
    const dir = tmp()
    buildOnly(dir)
    copyOf(dir, 'src/presentation-kit')
    write(dir, 'src/presentation-kit/Stage.tsx', 'customised stage')
    const plan = planScaffold(dir)
    expect(plan.missing).toEqual(['index'])
    applyScaffold(dir, plan)
    expect(readFileSync(path.join(dir, 'src/presentation-kit/Stage.tsx'), 'utf8')).toBe('customised stage')
  })

  it('scaffolds a full copy of the bootstrap in an empty directory', () => {
    const dir = tmp()
    applyScaffold(dir)
    expect(listFiles(dir)).toEqual(listFiles(BOOTSTRAP_DIR))
  })
})

describe('confirmation before writing to a non-empty project', () => {
  it('declines without --confirm and writes nothing, for a missing build setup too', () => {
    for (const make of [(d) => write(d, 'notes.txt', 'x'), (d) => buildOnly(d)]) {
      const dir = tmp()
      make(dir)
      const before = listFiles(dir)
      const out = cli('scaffold', dir)
      expect(out.status).toBe(3)
      expect(out.stdout).toMatch(/nothing written/)
      expect(listFiles(dir)).toEqual(before)
    }
  })

  it('writes after --confirm, and needs no confirmation for an empty directory', () => {
    const dir = tmp()
    buildOnly(dir)
    expect(cli('scaffold', dir, '--confirm').status).toBe(0)
    expect(existsSync(path.join(dir, 'src/presentations/index.ts'))).toBe(true)
    const empty = tmp()
    expect(cli('scaffold', empty).status).toBe(0)
    expect(existsSync(path.join(empty, 'src/presentation-kit/index.ts'))).toBe(true)
  })

  it('scaffolds a monorepo into presentations/ and leaves the root untouched', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'mono', workspaces: ['packages/*'] }))
    mkdirSync(path.join(dir, 'packages'))
    const before = readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(cli('scaffold', dir, '--confirm').status).toBe(0)
    expect(existsSync(path.join(dir, 'presentations/src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'presentations/package-lock.json'))).toBe(true)
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(before)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
  })
})

describe('creating a presentation', () => {
  it('writes a self-contained folder and appends one registry line, preserving existing entries', () => {
    const dir = tmp()
    applyScaffold(dir)
    const registry = path.join(dir, 'src/presentations/index.ts')
    const exampleBefore = readFileSync(path.join(dir, 'src/presentations/example/Talk.tsx'), 'utf8')
    createPresentation(dir, { slug: 'my-talk', title: 'My "Talk"' })
    const after = readFileSync(registry, 'utf8')
    expect(after).toContain("slug: 'example'")
    expect(after).toContain("slug: 'my-talk'")
    expect(after).toContain('title: "My \\"Talk\\""')
    expect(after.indexOf("slug: 'example'")).toBeLessThan(after.indexOf("slug: 'my-talk'"))
    expect(listFiles(path.join(dir, 'src/presentations/my-talk'))).toEqual(
      ['Talk.tsx', 'entities.ts', 'meta.ts', 'steps/MainScene.tsx', 'steps/index.ts', 'talk.css'],
    )
    expect(readFileSync(path.join(dir, 'src/presentations/example/Talk.tsx'), 'utf8')).toBe(exampleBefore)
    expect(readFileSync(path.join(dir, 'src/presentations/my-talk/talk.css'), 'utf8')).toContain('.deck-my-talk')
  })

  it('refuses a duplicate slug, a bad slug, and a registry without the marker, changing nothing', () => {
    const dir = tmp()
    applyScaffold(dir)
    const registry = path.join(dir, 'src/presentations/index.ts')
    const before = readFileSync(registry, 'utf8')
    expect(() => createPresentation(dir, { slug: 'example', title: 'x' })).toThrow(/already exists/)
    expect(() => createPresentation(dir, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    writeFileSync(registry, 'export const presentations = []\n')
    expect(() => createPresentation(dir, { slug: 'ok', title: 'x' })).toThrow(/marker/)
    expect(existsSync(path.join(dir, 'src/presentations/ok'))).toBe(false)
    expect(before).toContain('presentations:end')
  })
})
