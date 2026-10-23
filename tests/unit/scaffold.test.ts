import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
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

describe('contract anchor detection', () => {
  it('reports no anchors in an empty directory', () => {
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false, complete: false })
  })

  it('treats a cosmetically different but contract-equivalent kit as present', () => {
    write('package.json', '{}')
    write('vite.config.mjs', '')
    write('src/presentation-kit/index.ts', 'export {}')
    write('src/presentation-kit/types.ts', '// renamed formatting does not matter')
    write('src/presentations/index.ts', 'export const presentations = []')
    expect(detectAnchors(dir).complete).toBe(true)
  })

  it('a partial scaffold reports only the anchors that are present', () => {
    write('package.json', '{}')
    write('vite.config.ts', '')
    expect(detectAnchors(dir)).toMatchObject({ build: true, kit: false, index: false, complete: false })
  })

  it('the kit anchor needs both the index and the types contract', () => {
    write('src/presentation-kit/index.ts', 'export {}')
    expect(detectAnchors(dir).kit).toBe(false)
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
    const result = await resolveTarget(dir)
    expect(result).toMatchObject({ target: dir, action: 'scaffold', monorepo: false, confirmationRequired: true })
  })

  it('a monorepo scaffolds into presentations/ and requires confirmation', async () => {
    write('package.json', JSON.stringify({ workspaces: ['packages/*'] }))
    const result = await resolveTarget(dir)
    expect(result).toMatchObject({ target: join(dir, 'presentations'), monorepo: true, confirmationRequired: true })
  })

  it('a project with all three anchors is reused as-is', async () => {
    write('package.json', '{}')
    write('vite.config.ts', '')
    write('src/presentation-kit/index.ts', '')
    write('src/presentation-kit/types.ts', '')
    write('src/presentations/index.ts', '')
    expect(await resolveTarget(dir)).toMatchObject({ target: dir, action: 'reuse', confirmationRequired: false })
  })

  it('a monorepo whose presentations/ app is complete reuses that app', async () => {
    write('package.json', JSON.stringify({ workspaces: ['x'] }))
    const app = join(dir, 'presentations')
    write('presentations/package.json', '{}')
    write('presentations/vite.config.ts', '')
    write('presentations/src/presentation-kit/index.ts', '')
    write('presentations/src/presentation-kit/types.ts', '')
    write('presentations/src/presentations/index.ts', '')
    expect(await resolveTarget(dir)).toMatchObject({ target: app, action: 'reuse', monorepo: true })
  })
})

describe('scaffolding', () => {
  it('copies every bootstrap file into an empty directory, and it becomes complete', async () => {
    const result = await scaffoldInto(dir)
    expect(result.skipped).toEqual([])
    expect(detectAnchors(dir).complete).toBe(true)
    expect(existsSync(join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(join(TEMPLATE_ROOT, 'package.json'))).toBe(true)
  })

  it('never overwrites existing files, and leaves unrelated files untouched', async () => {
    write('package.json', '{"name":"mine"}')
    write('src/presentation-kit/index.ts', 'export const mine = 1\n')
    write('notes/keep.md', 'unrelated')
    const before = readFileSync(join(dir, 'src/presentation-kit/index.ts'), 'utf8')
    const result = await scaffoldInto(dir)
    expect(readFileSync(join(dir, 'src/presentation-kit/index.ts'), 'utf8')).toBe(before)
    expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe('{"name":"mine"}')
    expect(readFileSync(join(dir, 'notes/keep.md'), 'utf8')).toBe('unrelated')
    expect(result.skipped).toContain('src/presentation-kit/index.ts')
    expect(result.skipped).toContain('package.json')
    expect(result.skipped).toContain('package-lock.json')
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
