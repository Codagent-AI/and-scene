import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectAnchors, detectTarget, isMonorepo } from '../../skills/presentation/scripts/detect-target.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'detect-'))
const write = (file: string, content = '') => {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, content)
}

interface AppOpts { build?: boolean; kit?: boolean; index?: boolean; viteConfig?: string; extraDeps?: boolean }

const KIT_SOURCE = `import { AnimatePresence, LayoutGroup } from 'motion/react'
export interface Step { id: string }
export function Presentation() {
  window.addEventListener('keydown', () => {})
  return <LayoutGroup><AnimatePresence /></LayoutGroup>
}
`
const INDEX_SOURCE = `export const presentations = [
  { slug: 'a', title: 'A', load: () => import('./a/Talk') },
]
`

function makeApp(dir: string, { build = false, kit = false, index = false, viteConfig = 'vite.config.mjs', extraDeps = false }: AppOpts) {
  if (build) {
    write(join(dir, 'package.json'), JSON.stringify({
      scripts: { build: 'tsc -b && vite build' },
      dependencies: { react: '^19', ...(extraDeps ? { lodash: '1' } : {}) },
      devDependencies: { typescript: '^6' },
    }))
    write(join(dir, viteConfig), 'export default {}')
  }
  if (kit) write(join(dir, 'src/presentation-kit/Presentation.tsx'), KIT_SOURCE)
  if (index) write(join(dir, 'src/presentations/index.ts'), INDEX_SOURCE)
}

describe('anchor detection', () => {
  it('keys on presence of the contract, not on byte-identical scaffolding', () => {
    const dir = tmp()
    makeApp(dir, { build: true, kit: true, index: true, viteConfig: 'vite.config.js', extraDeps: true })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('requires a working build contract: a build script, react, vite and TypeScript', () => {
    const dir = tmp()
    const pkg = (p: object) => write(join(dir, 'package.json'), JSON.stringify(p))
    pkg({ scripts: {}, dependencies: { react: '1' } })
    expect(detectAnchors(dir).build).toBe(false)
    pkg({ scripts: { build: 'x' }, dependencies: { react: '1' } })
    expect(detectAnchors(dir).build).toBe(false)
    pkg({ scripts: { build: 'x' }, devDependencies: { react: '1', vite: '1' } }) // plain JavaScript app
    expect(detectAnchors(dir).build).toBe(false)
    pkg({ scripts: { build: 'x' }, devDependencies: { react: '1', vite: '1', typescript: '1' } })
    expect(detectAnchors(dir).build).toBe(true)
    pkg({ scripts: { build: 'x' }, devDependencies: { react: '1' } })
    write(join(dir, 'vite.config.js'), '')
    write(join(dir, 'tsconfig.json'), '{}')
    expect(detectAnchors(dir).build).toBe(true) // contract met through config files instead of dependencies
  })

  it('recognizes a functional kit and registry that are renamed and relocated', () => {
    const dir = tmp()
    write(join(dir, 'src/lib/engine/Host.tsx'), KIT_SOURCE.replace('export function Presentation()', 'function Presentation()') + '\nexport { Presentation }\n')
    write(join(dir, 'src/talks/registry.ts'), 'export const talkRegistry = [{ route: "/a", load: () => import("./a") }]\n')
    expect(detectAnchors(dir)).toMatchObject({ kit: true, index: true })
    expect(detectTarget(dir).locations).toEqual({ kitDir: join(dir, 'src/lib/engine'), indexFile: join(dir, 'src/talks/registry.ts') })
  })

  it('does not accept empty or non-functional files as anchors', () => {
    const dir = tmp()
    write(join(dir, 'src/presentation-kit/index.ts'), '')
    write(join(dir, 'src/presentation-kit/Presentation.tsx'), '')
    write(join(dir, 'src/presentations/index.ts'), '')
    expect(detectAnchors(dir)).toMatchObject({ kit: false, index: false })
    write(join(dir, 'src/presentation-kit/Presentation.tsx'), 'export function Presentation() { return null }\n')
    write(join(dir, 'src/presentations/index.ts'), 'export const presentations = []\n')
    expect(detectAnchors(dir)).toMatchObject({ kit: false, index: false }) // missing step contract, stage, nav / entries
  })

  it('detects each anchor independently', () => {
    for (const anchor of ['build', 'kit', 'index'] as const) {
      const dir = tmp()
      makeApp(dir, { [anchor]: true })
      expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false, [anchor]: true })
    }
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory (or a bare .git) at the root with no confirmation', () => {
    for (const withGit of [false, true]) {
      const dir = tmp()
      if (withGit) mkdirSync(join(dir, '.git'))
      expect(detectTarget(dir)).toMatchObject({
        target: dir, reason: 'standalone-or-empty', missing: ['build', 'kit', 'index'], nonEmpty: false, needsConfirmation: false,
      })
    }
  })

  it('scaffolds a non-empty standalone project at the root, confirming first', () => {
    const dir = tmp()
    write(join(dir, 'notes.txt'), 'hi')
    expect(detectTarget(dir)).toMatchObject({ target: dir, monorepo: false, nonEmpty: true, needsConfirmation: true })
  })

  it('confirms even when only the build setup is missing', () => {
    const dir = tmp()
    makeApp(dir, { kit: true, index: true })
    expect(detectTarget(dir)).toMatchObject({ target: dir, missing: ['build'], needsConfirmation: true })
  })

  it.each([
    ['workspaces in package.json', (d: string) => write(join(d, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(join(d, 'pnpm-workspace.yaml'), 'packages: []')],
    ['a packages/ directory', (d: string) => mkdirSync(join(d, 'packages'))],
    ['an apps/ directory', (d: string) => mkdirSync(join(d, 'apps'))],
  ])('puts a self-contained app under presentations/ for a monorepo signalled by %s', (_, signal) => {
    const dir = tmp()
    signal(dir)
    write(join(dir, 'README.md'), 'existing')
    const result = detectTarget(dir)
    expect(isMonorepo(dir)).toBe(true)
    expect(result).toMatchObject({
      target: join(dir, 'presentations'), reason: 'monorepo', monorepo: true, missing: ['build', 'kit', 'index'], needsConfirmation: true,
    })
  })

  it('keeps a monorepo root build setup out of the picture and scaffolds into presentations/', () => {
    const dir = tmp()
    mkdirSync(join(dir, 'packages'))
    makeApp(dir, { build: true })
    const result = detectTarget(dir)
    expect(result.target).toBe(join(dir, 'presentations'))
    expect(result.anchors).toEqual({ build: false, kit: false, index: false })
  })

  it('reuses an existing presentation app and reports only missing anchors', () => {
    const dir = tmp()
    makeApp(dir, { build: true, kit: true, index: true })
    expect(detectTarget(dir)).toMatchObject({ target: dir, reason: 'existing-app', missing: [], needsConfirmation: false })
    const partial = tmp()
    makeApp(partial, { build: true, kit: true })
    expect(detectTarget(partial)).toMatchObject({ target: partial, reason: 'existing-app', missing: ['index'], needsConfirmation: true })
  })

  it('reuses an app already scaffolded under presentations/ in a monorepo', () => {
    const dir = tmp()
    mkdirSync(join(dir, 'apps'))
    makeApp(join(dir, 'presentations'), { build: true, kit: true, index: true })
    expect(detectTarget(dir)).toMatchObject({
      target: join(dir, 'presentations'), reason: 'existing-app-in-presentations', missing: [], needsConfirmation: false,
    })
    const buildOnly = tmp()
    mkdirSync(join(buildOnly, 'packages'))
    makeApp(join(buildOnly, 'presentations'), { build: true })
    expect(detectTarget(buildOnly)).toMatchObject({ target: join(buildOnly, 'presentations'), missing: ['kit', 'index'] })
  })

  it('works when invoked from a different working directory', () => {
    const dir = tmp()
    mkdirSync(join(dir, 'apps'))
    const script = join(__dirname, '..', '..', 'skills', 'presentation', 'scripts', 'detect-target.mjs')
    const out = JSON.parse(execFileSync(process.execPath, [script, dir], { cwd: tmpdir(), encoding: 'utf8' }))
    expect(out.target).toBe(join(dir, 'presentations'))
  })
})
