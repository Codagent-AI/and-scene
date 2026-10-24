import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectTarget } from '../../skills/presentation/scripts/detect-target.mjs'

const dirs: string[] = []
function project(files: Record<string, string | object>): string {
  const dir = mkdtempSync(join(tmpdir(), 'detect-target-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), typeof content === 'string' ? content : JSON.stringify(content))
  }
  return dir
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

const BUILD = {
  'package.json': {
    scripts: { build: 'tsc -b && vite build' },
    dependencies: { react: '1' },
    devDependencies: { vite: '1', typescript: '1' },
  },
  'vite.config.ts': '',
  'tsconfig.json': '{}',
}
const KIT = { 'src/presentation-kit/Presentation.tsx': '', 'src/presentation-kit/Stage.tsx': '', 'src/presentation-kit/types.ts': '' }
const INDEX = { 'src/presentations/index.ts': '' }

describe('detectTarget', () => {
  it('scaffolds everything at the root of an empty directory without confirmation', () => {
    const dir = project({})
    const r = detectTarget(dir)
    expect(r).toMatchObject({ target: dir, scaffold: 'full', empty: true, confirmRequired: false })
    expect(r.missing).toEqual(['build', 'kit', 'index'])
  })

  it('ignores .git when judging emptiness', () => {
    const dir = project({ '.git/HEAD': 'ref' })
    expect(detectTarget(dir).empty).toBe(true)
  })

  it('does nothing when all three anchors are present', () => {
    const dir = project({ ...BUILD, ...KIT, ...INDEX })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'none', missing: [], confirmRequired: false })
  })

  it('scaffolds only the missing anchors in a partial app and asks to confirm', () => {
    const dir = project({ ...BUILD, ...KIT })
    const r = detectTarget(dir)
    expect(r).toMatchObject({ target: dir, scaffold: 'partial', missing: ['index'], confirmRequired: true })
  })

  it('treats a standalone non-empty project as a root scaffold needing confirmation', () => {
    const dir = project({ 'README.md': 'hi', 'package.json': { name: 'x' } })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'full', confirmRequired: true, monorepo: false })
  })

  it.each([
    ['package.json workspaces', { 'package.json': { workspaces: ['packages/*'] } }],
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': 'packages: []', 'package.json': {} }],
    ['packages/ layout', { 'packages/a/index.js': '', 'package.json': {} }],
    ['apps/ layout', { 'apps/a/index.js': '', 'package.json': {} }],
  ])('scaffolds a self-contained presentations/ app in a monorepo (%s)', (_name, files) => {
    const dir = project({ ...files, 'README.md': 'unrelated' })
    const r = detectTarget(dir)
    expect(r.monorepo).toBe(true)
    expect(r.target).toBe(join(dir, 'presentations'))
    expect(r.scaffold).toBe('full')
    expect(r.confirmRequired).toBe(true)
  })

  it('leaves an existing root build setup alone in a monorepo and targets presentations/', () => {
    const dir = project({ ...BUILD, 'package.json': { ...BUILD['package.json'], workspaces: ['x'] } })
    const r = detectTarget(dir)
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.target).toBe(join(dir, 'presentations'))
  })

  it('reuses an existing presentations/ app in a monorepo and scaffolds only what is missing', () => {
    const dir = project({
      'package.json': { workspaces: ['x'] },
      ...Object.fromEntries(Object.entries({ ...BUILD, ...KIT }).map(([k, v]) => [`presentations/${k}`, v])),
    })
    const r = detectTarget(dir)
    expect(r.target).toBe(join(dir, 'presentations'))
    expect(r).toMatchObject({ scaffold: 'partial', missing: ['index'], existingTarget: true })
  })

  it('uses the app itself when run from inside an existing presentation app of a monorepo', () => {
    const dir = project({ ...BUILD, ...KIT, ...INDEX, 'apps/other/x': '' })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'none' })
  })

  it('detects anchors by contract, not by an exact scaffold', () => {
    const dir = project({
      ...BUILD,
      'vite.config.mjs': '',
      'src/presentation-kit/Presentation.jsx': '',
      'src/presentation-kit/Stage.jsx': '',
      'src/presentation-kit/types.js': '',
      'src/presentations/index.js': '',
      'extra.txt': 'cosmetic',
    })
    expect(detectTarget(dir).scaffold).toBe('none')
  })

  it('requires the build anchor to have a build script and core dependencies', () => {
    const dir = project({ 'package.json': { scripts: {}, dependencies: { react: '1' } }, 'vite.config.ts': '', 'tsconfig.json': '{}' })
    expect(detectTarget(dir).anchors.build).toBe(false)
  })
})
