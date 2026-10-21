import { execFile } from 'node:child_process'
import { cp, mkdtemp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR, SKILL_DIR, createPresentation, detectAnchors, hasMonorepoSignal, isEmptyProject, resolveTarget, scaffold,
} from './scaffold.mjs'

const run = promisify(execFile)
const dirs: string[] = []
async function tmp() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'scaffold-'))
  dirs.push(dir)
  return dir
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })))
})

const exists = (p: string) => stat(p).then(() => true, () => false)
const ALL_MISSING = { build: false, kit: false, index: false }

async function writeBuildOnly(dir: string, extra: Record<string, unknown> = {}) {
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^18.0.0' }, devDependencies: { vite: '^5.0.0', typescript: '^5.0.0' }, ...extra }),
  )
  await writeFile(path.join(dir, 'tsconfig.json'), '{}')
}

describe('anchor detection', () => {
  it('finds none in an empty directory', async () => {
    expect(await detectAnchors(await tmp())).toEqual(ALL_MISSING)
  })

  it('finds all three after a full scaffold', async () => {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('detects the contract, not file names: renamed kit files still count', async () => {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    await rename(path.join(dir, 'src/presentation-kit/Presentation.tsx'), path.join(dir, 'src/presentation-kit/Deck.tsx'))
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ ...JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8')), extra: 1 }))
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('detects the contract regardless of export syntax', async () => {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    const types = path.join(dir, 'src/presentation-kit/types.ts')
    const source = await readFile(types, 'utf8')
    await writeFile(types, source.replace('export interface Step<', 'interface Step<') + '\nexport type { Step }\n')
    const presentation = path.join(dir, 'src/presentation-kit/Presentation.tsx')
    await writeFile(presentation, (await readFile(presentation, 'utf8')).replace('export function Presentation', 'function Presentation') + '\nexport { Presentation }\n')
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('reports a build-only project as missing the kit and index', async () => {
    const dir = await tmp()
    await writeBuildOnly(dir)
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: false, index: false })
  })

  it('does not count a build script without Vite, React and TypeScript', async () => {
    const dir = await tmp()
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' } }))
    expect((await detectAnchors(dir)).build).toBe(false)
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory at the root without confirmation', async () => {
    const dir = await tmp()
    await mkdir(path.join(dir, '.git'))
    expect(await isEmptyProject(dir)).toBe(true)
    const resolved = await resolveTarget(dir)
    expect(resolved).toMatchObject({ target: dir, empty: true, needsConfirmation: false, missing: ['build', 'kit', 'index'] })
  })

  it('scaffolds a non-empty standalone project at the root, after confirmation', async () => {
    const dir = await tmp()
    await writeBuildOnly(dir)
    const resolved = await resolveTarget(dir)
    expect(resolved).toMatchObject({ target: dir, empty: false, missing: ['kit', 'index'], needsConfirmation: true })
  })

  it('requires confirmation even when only the build setup is missing', async () => {
    const dir = await tmp()
    await scaffold(dir, { build: false, kit: false, index: false })
    await rm(path.join(dir, 'package.json'))
    const resolved = await resolveTarget(dir)
    expect(resolved).toMatchObject({ target: dir, missing: ['build'], needsConfirmation: true })
  })

  it('skips scaffolding and confirmation when every anchor is present', async () => {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    expect(await resolveTarget(dir)).toMatchObject({ target: dir, missing: [], needsConfirmation: false })
  })

  const signals: Array<[string, (dir: string) => Promise<void>]> = [
    ['package.json workspaces', (d) => writeBuildOnly(d, { workspaces: ['packages/*'] })],
    ['pnpm-workspace.yaml', async (d) => { await writeBuildOnly(d); await writeFile(path.join(d, 'pnpm-workspace.yaml'), 'packages: []') }],
    ['a packages/ directory', async (d) => { await writeBuildOnly(d); await mkdir(path.join(d, 'packages')) }],
    ['an apps/ directory', async (d) => { await writeBuildOnly(d); await mkdir(path.join(d, 'apps')) }],
  ]
  it.each(signals)('puts the app in presentations/ for a monorepo signalled by %s', async (_name, setup) => {
    const dir = await tmp()
    await setup(dir)
    expect(await hasMonorepoSignal(dir)).toBe(true)
    const resolved = await resolveTarget(dir)
    expect(resolved.target).toBe(path.join(dir, 'presentations'))
    // The monorepo root's own build never satisfies the nested app's anchors.
    expect(resolved.missing).toEqual(['build', 'kit', 'index'])
    expect(resolved.needsConfirmation).toBe(true)
  })

  it('reuses an existing presentation app, at the root or in presentations/', async () => {
    const root = await tmp()
    await scaffold(root, ALL_MISSING)
    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages: []')
    expect((await resolveTarget(root)).target).toBe(root)

    const mono = await tmp()
    await writeBuildOnly(mono, { workspaces: ['presentations'] })
    await scaffold(path.join(mono, 'presentations'), ALL_MISSING)
    const resolved = await resolveTarget(mono)
    expect(resolved).toMatchObject({ target: path.join(mono, 'presentations'), missing: [], needsConfirmation: false })
  })
})

describe('scaffold', () => {
  it('scaffolds an empty directory completely, with a lockfile', async () => {
    const dir = await tmp()
    const result = await scaffold(dir, ALL_MISSING)
    expect(result.copied).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/presentations/index.ts', 'src/presentation-kit/types.ts', 'scripts/verify.mjs']))
    expect(await exists(path.join(dir, 'package-lock.json'))).toBe(true)
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies).toHaveProperty(name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(pkg.devDependencies).toHaveProperty(name)
    }
    expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
  })

  it('adds only the missing anchors and leaves existing files and unrelated content alone', async () => {
    const dir = await tmp()
    await writeBuildOnly(dir)
    await writeFile(path.join(dir, 'README.md'), 'mine')
    await mkdir(path.join(dir, 'src'))
    await writeFile(path.join(dir, 'src/main.tsx'), '// existing entry')
    const before = await readFile(path.join(dir, 'package.json'), 'utf8')
    const result = await scaffold(dir, await detectAnchors(dir))

    expect(await readFile(path.join(dir, 'README.md'), 'utf8')).toBe('mine')
    expect(await readFile(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('// existing entry')
    expect(result.skipped).toContain('src/main.tsx')
    expect(result.copied).not.toContain('index.html') // build anchor present: its files are not copied
    expect(await exists(path.join(dir, 'vite.config.ts'))).toBe(false)
    expect(result.copied).toContain('src/presentation-kit/Presentation.tsx')
    expect(result.copied).toContain('src/presentations/index.ts')
    expect(result.copied).not.toContain('package-lock.json')

    const merged = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    const original = JSON.parse(before)
    expect(merged.dependencies.react).toBe(original.dependencies.react) // existing versions win
    expect(merged.devDependencies.vite).toBe(original.devDependencies.vite)
    expect(merged.dependencies.motion).toBeDefined() // missing dependencies are added
    expect(merged.devDependencies.playwright).toBeDefined()
    expect(merged.scripts.build).toBe('vite build')
    expect(await detectAnchors(dir)).toMatchObject({ kit: true, index: true })
  })

  it('never leaves a package command pointing at a missing script, even when the build anchor exists', async () => {
    const dir = await tmp()
    await writeBuildOnly(dir)
    await scaffold(dir, await detectAnchors(dir))
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    for (const command of Object.values(pkg.scripts) as string[]) {
      const file = /node (scripts\/\S+)/.exec(command)?.[1]
      if (file) expect(await exists(path.join(dir, file)), command).toBe(true)
    }
    expect(await exists(path.join(dir, 'scripts/lib/project.mjs'))).toBe(true)
    expect(await exists(path.join(dir, 'scripts/verify.config.json'))).toBe(true)
  })

  it('reports existing dependencies whose major version the kit cannot use, and leaves them unchanged', async () => {
    const dir = await tmp()
    await writeBuildOnly(dir)
    const result = await scaffold(dir, await detectAnchors(dir))
    expect(result.incompatible).toEqual(expect.arrayContaining([{ name: 'react', existing: '^18.0.0', required: '^19.2.6' }]))
    expect(result.incompatible.map((d: { name: string }) => d.name)).toContain('vite')
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
  })

  it('reports nothing incompatible for a fresh scaffold', async () => {
    const dir = await tmp()
    expect((await scaffold(dir, ALL_MISSING)).incompatible).toEqual([])
  })

  it('does nothing when every anchor is present', async () => {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    expect(await scaffold(dir, { build: true, kit: true, index: true })).toEqual({ copied: [], skipped: [], merged: [], incompatible: [] })
  })

  it('is independent of the caller working directory', async () => {
    const dir = await tmp()
    const elsewhere = await tmp()
    const { stdout } = await run(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'apply', dir], { cwd: elsewhere })
    expect(JSON.parse(stdout).copied).toContain('src/presentations/index.ts')
    const detected = await run(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'detect', dir], { cwd: elsewhere })
    expect(JSON.parse(detected.stdout).missing).toEqual([])
  })
})

describe('createPresentation', () => {
  async function scaffolded() {
    const dir = await tmp()
    await scaffold(dir, ALL_MISSING)
    return dir
  }

  it('writes a self-contained folder and registers it without disturbing others', async () => {
    const dir = await scaffolded()
    const before = await readFile(path.join(dir, 'src/presentations/starter/Talk.tsx'), 'utf8')
    const { files } = await createPresentation(dir, 'my-talk', "It's a Talk")
    expect(files.sort()).toEqual(['Scene.tsx', 'Talk.tsx', 'entities.ts', 'steps.ts', 'talk.css'])
    const registry = await readFile(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'starter'")
    expect(registry).toContain("slug: 'my-talk'")
    expect(registry).toContain("title: 'It\\'s a Talk'")
    expect(registry).toContain("import('./my-talk/Talk')")
    expect(registry.trimEnd().endsWith(']')).toBe(true)
    expect(await readFile(path.join(dir, 'src/presentations/starter/Talk.tsx'), 'utf8')).toBe(before)
    const talk = await readFile(path.join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')
    expect(talk).not.toContain('__')
    expect(talk).toContain('className="my-talk"')
    for (const file of await readdir(path.join(dir, 'src/presentations/my-talk'))) {
      expect(await readFile(path.join(dir, 'src/presentations/my-talk', file), 'utf8'), file).not.toMatch(/__SLUG__|__TITLE__/)
    }
  })

  it('refuses duplicate and malformed slugs', async () => {
    const dir = await scaffolded()
    await expect(createPresentation(dir, 'starter', 'x')).rejects.toThrow(/already exists/)
    await expect(createPresentation(dir, 'Not Kebab', 'x')).rejects.toThrow(/kebab-case/)
    await expect(createPresentation(dir, '../escape', 'x')).rejects.toThrow(/kebab-case/)
  })

  it('keeps every earlier registry line when several presentations are added', async () => {
    const dir = await scaffolded()
    await createPresentation(dir, 'first', 'First')
    await createPresentation(dir, 'second', 'Second')
    const registry = await readFile(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect([...registry.matchAll(/slug: '([^']+)'/g)].map((m) => m[1])).toEqual(['starter', 'first', 'second'])
  })
})

describe('skill layout', () => {
  it('resolves its templates relative to the skill directory', async () => {
    expect(BOOTSTRAP_DIR).toBe(path.join(SKILL_DIR, 'templates', 'bootstrap'))
    for (const file of ['package.json', 'package-lock.json', 'src/presentations/index.ts', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(await exists(path.join(BOOTSTRAP_DIR, file)), file).toBe(true)
    }
    for (const file of ['Talk.tsx', 'entities.ts', 'Scene.tsx', 'steps.ts', 'talk.css', 'registry-entry.txt']) {
      expect(await exists(path.join(SKILL_DIR, 'templates/presentation', file)), file).toBe(true)
    }
  })

  it('has SKILL.md with frontmatter naming the skill after its directory', async () => {
    const skill = await readFile(path.join(SKILL_DIR, 'SKILL.md'), 'utf8')
    const front = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1] ?? ''
    expect(front).toMatch(/^name: presentation$/m)
    expect(front).toMatch(/^description: .{20,}/m)
  })

  it('ships a template that does not include a git copy of dependencies', async () => {
    await cp(BOOTSTRAP_DIR, await tmp(), { recursive: true })
    expect(await exists(path.join(BOOTSTRAP_DIR, 'node_modules'))).toBe(false)
  })
})
