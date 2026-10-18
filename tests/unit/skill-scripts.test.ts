import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ES modules
import { detect, detectAnchors, monorepoSignals } from '../../skills/presentation/scripts/detect.mjs'
// @ts-expect-error plain ES modules
import { ANCHOR_PATHS, TEMPLATE_ROOT, mergePackageJson, scaffold } from '../../skills/presentation/scripts/scaffold.mjs'
import { tree, walk } from '../support/files'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'skill-'))
  dirs.push(d)
  return d
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

const put = (root: string, rel: string, text = '') => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  writeFileSync(path.join(root, rel), text)
}
const APP_PKG = JSON.stringify({
  scripts: { build: 'node build.js' },
  dependencies: { react: '^19' },
  devDependencies: { vite: '^8', typescript: '^6' },
})

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    const r = detect(tmp())
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.nonEmpty).toBe(false)
    expect(r.needsConfirmation).toBe(false)
    expect(r.target).toBe(r.projectDir)
    expect(r.monorepo).toBe(false)
  })

  it('detects all anchors in a scaffold, and in a cosmetically different app', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    expect(detect(d)).toMatchObject({ anchors: { build: true, kit: true, index: true }, missing: [], needsConfirmation: false })

  })

  it('tolerates renamed files inside src/presentation-kit and extra dependencies', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ scripts: { build: 'node build.js' }, devDependencies: { vite: '1', react: '1', typescript: '1', extra: '9' } }))
    put(d, 'src/presentation-kit/Presentation.jsx', '')
    put(d, 'src/presentation-kit/Stage.js', '')
    put(d, 'src/presentations/index.js', '')
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('reports exactly the genuinely missing anchors', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'README.md', 'x')
    expect(detect(d)).toMatchObject({ missing: ['kit', 'index'], needsConfirmation: true })
    const noBuildScript = tmp()
    put(noBuildScript, 'package.json', JSON.stringify({ dependencies: { react: '1', vite: '1', typescript: '1' } }))
    expect(detectAnchors(noBuildScript).build).toBe(false)
    const noVite = tmp()
    put(noVite, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' } }))
    expect(detectAnchors(noVite).build).toBe(false)
  })

  it('requires a Stage next to the Presentation to count the kit', () => {
    const d = tmp()
    put(d, 'src/presentation-kit/Presentation.tsx', '')
    expect(detectAnchors(d).kit).toBe(false)
  })
})

describe('target resolution', () => {
  it.each([
    ['package.json workspaces', (d: string) => put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => put(d, 'pnpm-workspace.yaml', 'packages:\n  - x\n')],
    ['packages/ directory', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ directory', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('a %s alone makes the target a self-contained presentations/ app', (_n, arrange) => {
    const d = tmp()
    arrange(d)
    const r = detect(d)
    expect(r.monorepo).toBe(true)
    expect(r.target).toBe(path.join(r.projectDir, 'presentations'))
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.needsConfirmation).toBe(true)
  })

  it('does not count a monorepo root build setup as the app build anchor', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'], scripts: { build: 'tsc -b' }, devDependencies: { vite: '1', react: '1', typescript: '1' } }))
    put(d, 'README.md', 'keep me')
    const r = detect(d)
    expect(r.target).toBe(path.join(r.projectDir, 'presentations'))
    expect(r.anchors.build).toBe(false)
    expect(monorepoSignals(d)).toEqual(['package.json workspaces'])
  })

  it('uses an existing presentation app as is, even inside a monorepo', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    mkdirSync(path.join(d, 'packages'))
    const r = detect(d)
    expect(r.target).toBe(r.projectDir)
    expect(r.missing).toEqual([])
  })

  it('checks anchors at presentations/ inside a monorepo and keeps an existing build there', () => {
    const d = tmp()
    put(d, 'pnpm-workspace.yaml', '')
    put(d, 'presentations/package.json', APP_PKG)
    const r = detect(d)
    expect(r.anchors).toEqual({ build: true, kit: false, index: false })
  })

  it('a standalone non-empty project is scaffolded at its root', () => {
    const d = tmp()
    put(d, 'README.md', 'x')
    const r = detect(d)
    expect(r.target).toBe(r.projectDir)
    expect(r.needsConfirmation).toBe(true)
  })

  it('never writes to the project while detecting', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: [] }))
    const before = tree(d)
    detect(d)
    expect(tree(d)).toEqual(before)
  })
})

describe('scaffolding', () => {
  it('resolves its templates from the skill directory, not the caller cwd', () => {
    const cwd = process.cwd()
    const elsewhere = tmp()
    process.chdir(elsewhere)
    try {
      const target = tmp()
      scaffold(target, ['build', 'kit', 'index'])
      expect(detect(target).missing).toEqual([])
    } finally {
      process.chdir(cwd)
    }
    expect(path.isAbsolute(TEMPLATE_ROOT)).toBe(true)
    expect(TEMPLATE_ROOT).toBe(path.resolve('skills/presentation/templates/bootstrap'))
  })

  it('a full scaffold writes the manifest with lock data and every anchor path', () => {
    const d = tmp()
    const { copied } = scaffold(d, ['build', 'kit', 'index'])
    expect(copied).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/presentations/index.ts', 'src/presentation-kit/Presentation.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']))
    const files = Object.keys(tree(d))
    for (const paths of Object.values(ANCHOR_PATHS) as string[][]) {
      for (const p of paths) expect(files.some((f) => f === p || f.startsWith(p + '/')), p).toBe(true)
    }
    expect(JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8')).devDependencies).toHaveProperty('playwright')
  })

  it('a partial scaffold adds only the missing anchors and never overwrites existing content', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'src/presentations/index.ts', 'SENTINEL registry')
    put(d, 'README.md', 'SENTINEL readme')
    put(d, 'tsconfig.json', 'SENTINEL tsconfig')
    const { copied, skipped } = scaffold(d, ['build', 'kit'])
    expect(tree(d)['src/presentations/index.ts']).toBe('SENTINEL registry')
    expect(tree(d)['README.md']).toBe('SENTINEL readme')
    expect(tree(d)['tsconfig.json']).toBe('SENTINEL tsconfig')
    expect(skipped).toContain('tsconfig.json')
    expect(copied).toContain('src/presentation-kit/Presentation.tsx')
    expect(copied).not.toContain('package-lock.json')
    expect(walk(path.join(d, 'src/presentation-kit')).length).toBeGreaterThan(10)
  })

  it('scaffolding only the kit leaves build setup and index files untouched', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    scaffold(d, ['kit'])
    const files = Object.keys(tree(d))
    expect(files.filter((f) => !f.startsWith('src/presentation-kit/') && f !== '.gitignore')).toEqual(['package.json'])
  })

  it('merges only missing dependencies and scripts into an existing package.json', () => {
    const template = { type: 'module', scripts: { build: 'B', verify: 'V' }, dependencies: { react: '^19', motion: '^12' }, devDependencies: { vite: '^8', playwright: '^1' } }
    const existing = { scripts: { build: 'mine' }, dependencies: { react: '^18' }, devDependencies: { vite: '^7' } }
    const { merged, added } = mergePackageJson(template, existing)
    expect(merged.scripts).toEqual({ build: 'mine', verify: 'V' })
    expect(merged.dependencies).toEqual({ react: '^18', motion: '^12' })
    expect(merged.devDependencies).toEqual({ vite: '^7', playwright: '^1' })
    expect(added.sort()).toEqual(['dependencies.motion', 'devDependencies.playwright', 'scripts.verify'])
    expect(existing.dependencies).toEqual({ react: '^18' })
  })

  it('appends missing gitignore lines without duplicating existing ones', () => {
    const d = tmp()
    put(d, '.gitignore', 'node_modules\ncustom\n')
    scaffold(d, [])
    const lines = readFileSync(path.join(d, '.gitignore'), 'utf8').split('\n').filter(Boolean)
    expect(lines).toEqual(['node_modules', 'custom', 'dist', 'dist-ssr', '.inspection', '*.local'])
  })

  it('scaffolding into a monorepo target leaves the monorepo root untouched', () => {
    const root = tmp()
    put(root, 'package.json', JSON.stringify({ workspaces: ['packages/*'], name: 'root' }))
    put(root, 'packages/a/index.ts', 'a')
    const before = tree(root)
    const { target } = detect(root)
    scaffold(target, ['build', 'kit', 'index'])
    const after = tree(root)
    for (const [file, text] of Object.entries(before)) expect(after[file], file).toBe(text)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detect(root).missing).toEqual([])
  })
})
