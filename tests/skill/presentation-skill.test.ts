import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const skill = path.join(repo, 'skills/presentation')
const temps: string[] = []
async function temp() { const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-skill-')); temps.push(dir); return dir }
function run(script: string, args: string[], cwd = os.tmpdir()) {
  const result = spawnSync(process.execPath, [path.join(skill, 'scripts', script), ...args], { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  return result.stdout
}
afterEach(async () => { await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })

describe('presentation skill', () => {
  it('has valid frontmatter, required workflow, and resolvable local paths', async () => {
    const content = await readFile(path.join(skill, 'SKILL.md'), 'utf8')
    expect(content).toMatch(/^---\nname: presentation\ndescription: .+\n---/)
    for (const phrase of ['one question at a time', 'partial detail', 'ASCII mockup', 'three app anchors', 'monorepo', 'under `presentations/`', 'proceed only after the user confirms', 'relative to the directory containing this `SKILL.md`', 'Do not add Tailwind', 'missing or ambiguous', 'list its existing presentations', 'npm run inspect -- <slug>', 'genuinely intentional']) expect(content).toContain(phrase)
    for (const match of content.matchAll(/(?:templates|scripts|references)\/[\w./-]+/g)) {
      const relative = match[0].replace(/[).`,;]+$/, '')
      expect(await import('node:fs/promises').then(({ stat }) => stat(path.join(skill, relative)).then(() => true).catch(() => false)), relative).toBe(true)
    }
  })

  it('detects empty, standalone, monorepo signals, existing apps, and partial anchors', async () => {
    const empty = await temp()
    expect(JSON.parse(run('detect-target.mjs', [empty])).empty).toBe(true)
    const standalone = await temp()
    await writeFile(path.join(standalone, 'package.json'), '{}')
    expect(JSON.parse(run('detect-target.mjs', [standalone])).target.kind).toBe('standalone')
    for (const signal of ['workspaces', 'pnpm', 'packages', 'apps']) {
      const dir = await temp()
      if (signal === 'workspaces') await writeFile(path.join(dir, 'package.json'), '{"workspaces":[]}')
      if (signal === 'pnpm') await writeFile(path.join(dir, 'pnpm-workspace.yaml'), 'packages: []')
      if (signal === 'packages' || signal === 'apps') await mkdir(path.join(dir, signal))
      const result = JSON.parse(run('detect-target.mjs', [dir]))
      expect(result.target.kind).toBe('monorepo')
      expect(result.target.dir).toBe(path.join(dir, 'presentations'))
    }
    const app = await temp()
    run('scaffold.mjs', ['--target', app, '--anchors', 'all'])
    expect(JSON.parse(run('detect-target.mjs', [app])).anchors).toEqual({ build: true, kit: true, index: true })
    const partial = await temp()
    await mkdir(path.join(partial, 'src/presentation-kit'), { recursive: true })
    await writeFile(path.join(partial, 'src/presentation-kit/index.ts'), "export { Presentation } from './Presentation'; export { Stage } from './Stage'; export { usePresentationNav } from './usePresentationNav'; export { useFitScale } from './useFitScale'; export { Box } from './nodes/Box'; export { Header } from './chrome/Header'; export { Footer } from './chrome/Footer'; export { Toc } from './chrome/Toc';")
    await writeFile(path.join(partial, 'src/presentation-kit/types.ts'), 'export type Step = {}')
    await writeFile(path.join(partial, 'src/presentation-kit/Stage.tsx'), '')
    const result = JSON.parse(run('detect-target.mjs', [partial]))
    expect(result.anchors).toEqual({ build: false, kit: true, index: false })
  })

  it('scaffolds only missing anchors, preserves existing files and merges dependency entries', async () => {
    const dir = await temp()
    await mkdir(path.join(dir, 'src'))
    await writeFile(path.join(dir, 'src/keep.txt'), 'keep')
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'host', scripts: { hello: 'true' }, dependencies: { react: 'custom' }, custom: 'preserve' }))
    await writeFile(path.join(dir, 'src/index.css'), 'host css')
    run('scaffold.mjs', ['--target', dir, '--anchors', 'build'])
    expect(await readFile(path.join(dir, 'src/keep.txt'), 'utf8')).toBe('keep')
    expect(await readFile(path.join(dir, 'src/index.css'), 'utf8')).toBe('host css')
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('custom')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(pkg.scripts.hello).toBe('true')
    expect(pkg.custom).toBe('preserve')
    await writeFile(path.join(dir, 'vite.config.ts'), 'existing')
    run('scaffold.mjs', ['--target', dir, '--anchors', 'build'])
    expect(await readFile(path.join(dir, 'vite.config.ts'), 'utf8')).toBe('existing')
  })

  it('creates and registers a presentation idempotently from an unrelated cwd', async () => {
    const dir = await temp()
    run('scaffold.mjs', ['--target', dir, '--anchors', 'all'])
    const registry = path.join(dir, 'src/presentations/index.ts')
    await writeFile(registry, (await readFile(registry, 'utf8')).replace('export const presentations: PresentationEntry[] = []', "export const presentations: PresentationEntry[] = [{ slug: 'existing', title: 'Existing', load: () => import('./existing/Talk') } ]"))
    const args = ['--target', dir, '--slug', 'test-talk', '--title', 'A Test Talk']
    run('new-presentation.mjs', args, '/tmp')
    run('new-presentation.mjs', args, '/tmp')
    const text = await readFile(registry, 'utf8')
    expect(text.match(/slug: "test-talk"/g)).toHaveLength(1)
    expect(text).toContain("slug: 'existing'")
    expect(await readFile(path.join(dir, 'src/presentations/test-talk/Talk.tsx'), 'utf8')).toContain('A Test Talk')
    expect((await readdir(path.join(dir, 'src/presentations/test-talk')))).toContain('talk.css')
  })
})
