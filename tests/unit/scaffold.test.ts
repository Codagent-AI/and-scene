import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addRegistryEntry,
  apply,
  createPresentation,
  detect,
  detectAnchors,
} from '../../skills/presentation/scripts/scaffold.mjs'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'scaffold-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const write = async (rel: string, content = '') => {
  await mkdir(path.dirname(path.join(dir, rel)), { recursive: true })
  await writeFile(path.join(dir, rel), content)
}
const buildAnchor = async (base = '') => {
  await write(
    path.join(base, 'package.json'),
    JSON.stringify({ scripts: { build: 'vite build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }),
  )
  await write(path.join(base, 'vite.config.js'), 'export default {}')
}

describe('detect', () => {
  it('scaffolds an empty directory at its root without confirmation', async () => {
    const result = await detect(dir)
    expect(result.appDir).toBe(dir)
    expect(result.empty).toBe(true)
    expect(result.missing).toEqual(['build', 'kit', 'index'])
    expect(result.needsConfirmation).toBe(false)
  })

  it('ignores .git when deciding a directory is empty', async () => {
    await mkdir(path.join(dir, '.git'))
    expect((await detect(dir)).empty).toBe(true)
  })

  it('targets the root of a non-empty standalone project and asks for confirmation', async () => {
    await write('notes.md', 'hello')
    const result = await detect(dir)
    expect(result.appDir).toBe(dir)
    expect(result.monorepo).toBe(false)
    expect(result.needsConfirmation).toBe(true)
  })

  it.each([
    ['workspaces', () => write('package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', () => write('pnpm-workspace.yaml', 'packages: []')],
    ['lerna.json', () => write('lerna.json', '{}')],
    ['turbo.json', () => write('turbo.json', '{}')],
    ['packages/', () => mkdir(path.join(dir, 'packages'))],
    ['apps/', () => mkdir(path.join(dir, 'apps'))],
  ])('scaffolds a monorepo (%s signal) into presentations/', async (_name, setup) => {
    await setup()
    await write('README.md', 'root content')
    const result = await detect(dir)
    expect(result.monorepo).toBe(true)
    expect(result.appDir).toBe(path.join(dir, 'presentations'))
    expect(result.needsConfirmation).toBe(true)
  })

  it('uses a partial monorepo build anchor only as context: the app is still self-contained', async () => {
    await buildAnchor()
    await write('pnpm-workspace.yaml', 'packages: []')
    const result = await detect(dir)
    expect(result.appDir).toBe(path.join(dir, 'presentations'))
    expect(result.missing).toEqual(['build', 'kit', 'index'])
  })

  it('reuses an existing presentation app in the current directory or in presentations/', async () => {
    await buildAnchor()
    await write('src/presentation-kit/index.ts', 'export { Presentation } from "./P"')
    await write('src/presentations/index.ts', 'export const presentations = []')
    const here = await detect(dir)
    expect(here.appDir).toBe(dir)
    expect(here.missing).toEqual([])
    expect(here.needsConfirmation).toBe(false)

    await rm(path.join(dir, 'src'), { recursive: true })
    await write('presentations/src/presentations/index.tsx', 'export const presentations = []')
    await write('apps/x/file', '')
    const nested = await detect(dir)
    expect(nested.appDir).toBe(path.join(dir, 'presentations'))
    expect(nested.missing).toEqual(['build', 'kit'])
  })

  it('detects by contract, tolerating cosmetic differences', async () => {
    await buildAnchor()
    await write('src/presentation-kit/index.tsx', "export * from './x'\nexport function Presentation() {}")
    await write('src/presentations/index.tsx', 'export {}')
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not count an unrelated kit directory or a build setup without Vite', async () => {
    await write('package.json', JSON.stringify({ scripts: { build: 'tsc' }, dependencies: { react: '1' } }))
    await write('src/presentation-kit/index.ts', 'export const other = 1')
    expect(await detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })
})

describe('apply', () => {
  const run = (target: string, missing: string[], options = {}) => apply(target, missing, { install: false, ...options })

  it('materializes all three anchors in an empty directory', async () => {
    await run(dir, ['build', 'kit', 'index'])
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies).toHaveProperty(name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(pkg.devDependencies).toHaveProperty(name)
    }
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(dir, 'src/presentation-kit/__tests__'))).toBe(false)
    expect(await readFile(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toContain('PresentationEntry[] = []')
    expect(existsSync(path.join(dir, 'src/presentations/starter'))).toBe(false)
  })

  it('can include the starter presentation', async () => {
    await run(dir, ['build', 'kit', 'index'], { starter: true })
    expect(existsSync(path.join(dir, 'src/presentations/starter/Talk.tsx'))).toBe(true)
  })

  it('adds only missing anchors and never overwrites existing files', async () => {
    await buildAnchor()
    await write('src/main.tsx', 'custom entry')
    const before = await readFile(path.join(dir, 'vite.config.js'), 'utf8')
    await run(dir, ['kit', 'index'])
    expect(await readFile(path.join(dir, 'vite.config.js'), 'utf8')).toBe(before)
    expect(await readFile(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('custom entry')
    expect(existsSync(path.join(dir, 'src/presentation-kit/index.ts'))).toBe(true)
    expect(existsSync(path.join(dir, 'vite.config.ts'))).toBe(false)
  })

  it('merges package.json, keeping existing scripts and dependency versions', async () => {
    await write('package.json', JSON.stringify({ name: 'mine', scripts: { build: 'custom build' }, dependencies: { react: '^18.0.0' } }))
    await run(dir, ['build'])
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts.build).toBe('custom build')
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.motion).toBeTruthy()
  })

  it('scaffolds a monorepo app in presentations/ and leaves the root untouched', async () => {
    await buildAnchor()
    await write('pnpm-workspace.yaml', 'packages: []')
    await write('docs/keep.md', 'keep')
    const snapshot = async () =>
      JSON.stringify(await Promise.all(['package.json', 'vite.config.js', 'pnpm-workspace.yaml', 'docs/keep.md'].map((f) => readFile(path.join(dir, f), 'utf8'))))
    const before = await snapshot()
    const result = await detect(dir)
    await run(result.appDir, result.missing)
    expect(await snapshot()).toBe(before)
    expect(await readdir(dir)).not.toContain('src')
    expect(await detectAnchors(result.appDir)).toEqual({ build: true, kit: true, index: true })
  })

  it('resolves templates from the skill directory regardless of the working directory', async () => {
    const original = process.cwd()
    process.chdir(os.tmpdir())
    try {
      await run(dir, ['build', 'kit', 'index'])
    } finally {
      process.chdir(original)
    }
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })
})

describe('partial scaffolding of an existing project', () => {
  it('adds dependencies, scripts and tooling when only the kit and index are missing', async () => {
    await buildAnchor()
    await write('src/main.tsx', "console.log('app')")
    const result = await apply(dir, ['kit', 'index'], { install: false })
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    for (const name of ['motion', 'lucide-react']) expect(pkg.dependencies).toHaveProperty(name)
    expect(pkg.devDependencies).toHaveProperty('playwright')
    expect(pkg.scripts).toMatchObject({ build: 'vite build', verify: expect.any(String), inspect: expect.any(String) })
    expect(existsSync(path.join(dir, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(path.join(dir, 'verify.config.json'))).toBe(true)
    expect(result.notes.join(' ')).toMatch(/Router/)
    expect(await readFile(path.join(dir, 'src/main.tsx'), 'utf8')).toBe("console.log('app')")
  })

  it('fills in an incomplete existing kit folder without touching its files', async () => {
    await buildAnchor()
    await write('src/presentation-kit/custom.ts', 'mine')
    await apply(dir, ['kit', 'index'], { install: false })
    expect(await readFile(path.join(dir, 'src/presentation-kit/custom.ts'), 'utf8')).toBe('mine')
    expect(await detectAnchors(dir)).toMatchObject({ kit: true, index: true })
  })

  it('creates a presentation in a project whose files differ cosmetically', async () => {
    await apply(dir, ['build', 'kit', 'index'], { install: false })
    await rename(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/index.tsx'))
    await writeFile(
      path.join(dir, 'src/presentations/index.tsx'),
      "export const presentations = [\n  { slug: 'old', title: 'Old', load: () => import('./old/Talk.tsx') }\n]\n",
    )
    await createPresentation(dir, 'fresh', 'Fresh')
    const registry = await readFile(path.join(dir, 'src/presentations/index.tsx'), 'utf8')
    expect(registry).toContain("slug: 'old'")
    expect(registry).toContain("slug: 'fresh'")
    expect(existsSync(path.join(dir, 'src/presentations/index.ts'))).toBe(false)
  })
})

describe('createPresentation', () => {
  it('adds a routed folder and registry entry without touching existing presentations', async () => {
    await run()
    async function run() {
      await apply(dir, ['build', 'kit', 'index'], { install: false })
    }
    await createPresentation(dir, 'first-talk', 'First Talk')
    const firstTalk = await readFile(path.join(dir, 'src/presentations/first-talk/Talk.tsx'), 'utf8')
    await createPresentation(dir, 'second-talk', "Second's Talk")
    const registry = await readFile(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'first-talk'")
    expect(registry).toContain("slug: 'second-talk'")
    expect(registry).toContain("import('./second-talk/Talk.tsx')")
    expect(await readFile(path.join(dir, 'src/presentations/first-talk/Talk.tsx'), 'utf8')).toBe(firstTalk)
    expect(firstTalk).toContain('First Talk')
    expect(firstTalk).not.toContain('__SLUG__')
    const css = await readFile(path.join(dir, 'src/presentations/second-talk/talk.css'), 'utf8')
    expect(css).toContain('.p-second-talk')
  })

  it('rejects bad or duplicate slugs', async () => {
    await apply(dir, ['build', 'kit', 'index'], { install: false })
    await expect(createPresentation(dir, 'Bad Slug', 't')).rejects.toThrow(/invalid slug/)
    await createPresentation(dir, 'ok', 't')
    await expect(createPresentation(dir, 'ok', 't')).rejects.toThrow(/already exists/)
  })

  it('keeps registry formatting when appending', () => {
    const source = "export const presentations: PresentationEntry[] = [\n  { slug: 'a', title: 'A', load: () => import('./a/Talk.tsx') }\n]\n"
    const updated = addRegistryEntry(source, 'b', 'B')
    expect(updated).toContain("load: () => import('./a/Talk.tsx') },\n  {\n    slug: 'b'")
  })
})
