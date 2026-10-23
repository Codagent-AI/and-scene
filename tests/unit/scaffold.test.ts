import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  detectAnchors,
  isMonorepo,
  missingDependencies,
  resolveTarget,
  scaffoldInto,
  TEMPLATE_ROOT,
} from '../../skills/presentation/scripts/scaffold.mjs'

const SCRIPT = join(import.meta.dirname, '..', '..', 'skills', 'presentation', 'scripts', 'scaffold.mjs')

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'scaffold-unit-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function write(rel: string, content = '') {
  const path = join(dir, rel)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, content)
}

/** Every file under a directory, relative to it. */
function listAll(root: string, rel = ''): string[] {
  return readdirSync(join(root, rel), { withFileTypes: true }).flatMap((entry) => {
    const next = join(rel, entry.name)
    return entry.isDirectory() ? listAll(root, next) : [next]
  })
}

/** Minimal build setup: a manifest with a build script and React and Vite, plus a Vite config. */
function writeBuildSetup(root = dir) {
  write(join(root === dir ? '' : relative(dir, root), 'package.json'), JSON.stringify({
    scripts: { build: 'tsc -b && vite build' },
    dependencies: { react: '1' },
    devDependencies: { vite: '1' },
  }))
  write(join(relative(dir, root), 'vite.config.ts'), 'export default {}')
}

import { relative } from 'node:path'

/** Kit contract under a file name the bootstrap does not use. */
function writeKitUnderOtherName(root = dir) {
  write(join(relative(dir, root), 'src/engine/scene.tsx'), [
    'export function Presentation() { return null }',
    'export function Stage() { return null }',
    'export function usePresentationNav() { return null }',
    'export interface Step<T> { id: string; payload: T }',
    'export interface SceneProps<T> { payload: T }',
  ].join('\n'))
}

/** Presentation index under a file name the bootstrap does not use. */
function writeIndexUnderOtherName(root = dir) {
  write(join(relative(dir, root), 'src/registry/decks.ts'), [
    "export const decks = [",
    "  { slug: 'intro', title: 'Intro', load: () => import('./intro/Talk') },",
    ']',
  ].join('\n'))
}

describe('contract anchor detection', () => {
  it('reports no anchors in an empty directory', async () => {
    expect(await detectAnchors(dir)).toEqual({ build: false, kit: false, index: false, complete: false })
  })

  it('detects a contract-equivalent kit and index under different file names as present', async () => {
    writeBuildSetup()
    writeKitUnderOtherName()
    writeIndexUnderOtherName()
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true, complete: true })
  })

  it('does not count empty exports as a kit', async () => {
    write('src/presentation-kit/index.ts', 'export {}')
    write('src/presentation-kit/types.ts', 'export {}')
    write('src/presentations/index.ts', 'export {}')
    expect((await detectAnchors(dir)).kit).toBe(false)
    expect((await detectAnchors(dir)).index).toBe(false)
  })

  it('a manifest without a build script or Vite config is not a build setup', async () => {
    write('package.json', JSON.stringify({ dependencies: { react: '1' } }))
    expect((await detectAnchors(dir)).build).toBe(false)
  })

  it('a partial scaffold reports only the anchors that are present', async () => {
    writeBuildSetup()
    expect(await detectAnchors(dir)).toMatchObject({ build: true, kit: false, index: false, complete: false })
  })
})

describe('monorepo signals', () => {
  it.each([
    ['workspaces in package.json', () => write('package.json', JSON.stringify({ workspaces: ['a'] }))],
    ['pnpm-workspace.yaml', () => write('pnpm-workspace.yaml', 'packages: []')],
    ['a packages/ directory', () => mkdirSync(join(dir, 'packages'))],
    ['an apps/ directory', () => mkdirSync(join(dir, 'apps'))],
  ])('%s marks a monorepo', async (_name, setup) => {
    setup()
    expect(await isMonorepo(dir)).toBe(true)
  })

  it('a plain project is not a monorepo', async () => {
    write('package.json', JSON.stringify({ name: 'plain' }))
    expect(await isMonorepo(dir)).toBe(false)
  })
})

describe('target resolution', () => {
  it('an empty directory scaffolds at the root without confirmation', async () => {
    expect(await resolveTarget(dir)).toEqual({ target: dir, action: 'scaffold', monorepo: false, confirmationRequired: false })
  })

  it('a non-empty standalone project scaffolds at the root and requires confirmation', async () => {
    write('README.md', 'hi')
    expect(await resolveTarget(dir)).toMatchObject({ target: dir, action: 'scaffold', monorepo: false, confirmationRequired: true })
  })

  it('a monorepo scaffolds into presentations/ and requires confirmation', async () => {
    write('package.json', JSON.stringify({ workspaces: ['packages/*'] }))
    expect(await resolveTarget(dir)).toMatchObject({ target: join(dir, 'presentations'), monorepo: true, confirmationRequired: true })
  })

  it('a project with all three anchors is reused as-is', async () => {
    writeBuildSetup()
    writeKitUnderOtherName()
    writeIndexUnderOtherName()
    expect(await resolveTarget(dir)).toMatchObject({ target: dir, action: 'reuse', confirmationRequired: false })
  })

  it('a monorepo whose presentations/ app is complete reuses that app', async () => {
    write('package.json', JSON.stringify({ workspaces: ['x'] }))
    const app = join(dir, 'presentations')
    writeBuildSetup(app)
    writeKitUnderOtherName(app)
    writeIndexUnderOtherName(app)
    expect(await resolveTarget(dir)).toMatchObject({ target: app, action: 'reuse', monorepo: true })
  })
})

describe('scaffolding', () => {
  it('copies every bootstrap file into an empty directory, and it becomes complete', async () => {
    const result = await scaffoldInto(dir)
    expect(result.skipped).toEqual([])
    expect(await detectAnchors(dir)).toMatchObject({ complete: true })
    expect(existsSync(join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(join(TEMPLATE_ROOT, 'package.json'))).toBe(true)
  })

  it('never overwrites an existing file, and leaves unrelated files untouched', async () => {
    write('package.json', '{"name":"mine"}')
    write('src/presentation-kit/index.ts', 'export const mine = 1\n')
    write('notes/keep.md', 'unrelated')
    const before = readFileSync(join(dir, 'src/presentation-kit/index.ts'), 'utf8')
    const result = await scaffoldInto(dir)
    expect(readFileSync(join(dir, 'src/presentation-kit/index.ts'), 'utf8')).toBe(before)
    expect(readFileSync(join(dir, 'notes/keep.md'), 'utf8')).toBe('unrelated')
    expect(result.skipped).toContain('src/presentation-kit/index.ts')
    expect(result.skipped).toContain('package-lock.json')
  })

  it('a complete project is reused and every existing file stays byte-identical', async () => {
    await scaffoldInto(dir)
    const snapshot = listAll(dir).map((rel) => [rel, readFileSync(join(dir, rel), 'utf8')])
    const stdout = execFileSync('node', [SCRIPT, 'scaffold', dir], { encoding: 'utf8' })
    expect(JSON.parse(stdout)).toMatchObject({ action: 'reuse', created: [], skipped: [] })
    expect(listAll(dir).map((rel) => [rel, readFileSync(join(dir, rel), 'utf8')])).toEqual(snapshot)
  })

  it('with a present kit, adds no kit files, and adds the missing build and index anchors', async () => {
    writeKitUnderOtherName()
    const result = await scaffoldInto(dir)
    expect(result.created.some((rel) => rel.startsWith('src/presentation-kit/'))).toBe(false)
    expect(existsSync(join(dir, 'src/presentation-kit/Stage.tsx'))).toBe(false)
    expect(result.created).toContain('src/presentations/index.ts')
    expect(result.created).toContain('vite.config.ts')
  })

  it('with a present build setup, adds no build files beyond the missing index anchor', async () => {
    writeBuildSetup()
    const result = await scaffoldInto(dir)
    expect(result.skipped).toEqual(expect.arrayContaining(['package.json', 'vite.config.ts']))
    expect(result.created).toContain('src/presentations/index.ts')
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))).toMatchObject({ scripts: { build: 'tsc -b && vite build' } })
  })

  it('an existing manifest without the build and verify scripts gets them, and keeps its own', async () => {
    write('package.json', JSON.stringify({ name: 'mine', scripts: { build: 'my-build' }, dependencies: { react: '1' } }))
    const result = await scaffoldInto(dir)
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(manifest.name).toBe('mine')
    expect(manifest.scripts.build).toBe('my-build')
    expect(manifest.scripts.verify).toBeDefined()
    expect(result.addedScripts).toContain('verify')
    expect(result.addedDependencies).toContain('vite')
  })

  it('reports the required dependencies a project does not declare', async () => {
    write('package.json', JSON.stringify({ dependencies: { react: '1', motion: '1' } }))
    const missing = await missingDependencies(dir)
    expect(missing).toContain('vite')
    expect(missing).toContain('playwright')
    expect(missing).not.toContain('react')
    expect(missing).not.toContain('motion')
  })

  it('the bootstrap declares the full dependency set and no styling framework', async () => {
    expect(await missingDependencies(TEMPLATE_ROOT)).toEqual([])
    const declared = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'package.json'), 'utf8'))
    const names = Object.keys({ ...declared.dependencies, ...declared.devDependencies })
    expect(names.some((name) => /tailwind/i.test(name))).toBe(false)
  })

  it('the CLI resolves templates from its own location, not the caller working directory', () => {
    const outside = mkdtempSync(join(tmpdir(), 'scaffold-cwd-'))
    try {
      const stdout = execFileSync('node', [SCRIPT, 'scaffold', 'target'], { cwd: outside, encoding: 'utf8' })
      const parsed = JSON.parse(stdout)
      expect(parsed.target).toBe(join(outside, 'target'))
      expect(parsed.created).toContain('package.json')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })
})
