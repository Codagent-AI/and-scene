// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { snapshot } from './filesystem'
import { dirname, join } from 'node:path'
import { materialize } from '../skills/presentation/scaffold.mjs'
const directories: string[] = []
afterEach(async () => { for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true }) })
describe('scaffold executable', () => {
  it('I-21 full partial reuse preserve existing anchors and packages', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scene-scaffold-')); directories.push(dir)
    await writeFile(join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'existing-build' }, dependencies: { react: 'existing-react' } }))
    await writeFile(join(dir, 'unrelated.txt'), 'keep')
    await materialize(dir, ['kit'])
    expect(await readFile(join(dir, 'src/presentation-kit/types.ts'), 'utf8')).toContain('Step')
    const packageJson = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    expect(packageJson.scripts.build).toBe('existing-build'); expect(packageJson.dependencies.react).toBe('existing-react'); expect(packageJson.dependencies.motion).toBeTruthy()
    expect(await readFile(join(dir, 'scripts/verify.mjs'), 'utf8')).toContain('verify')
    expect(await readFile(join(dir, 'unrelated.txt'), 'utf8')).toBe('keep')
    await writeFile(join(dir, 'src/presentation-kit/types.ts'), '// host contract')
    await materialize(dir, ['kit']); expect(await readFile(join(dir, 'src/presentation-kit/types.ts'), 'utf8')).toBe('// host contract')
    await expect(materialize(dir, ['invalid'])).rejects.toThrow('Unknown scaffold anchor')
  })
})

const anchorFiles = { build: 'vite.config.ts', kit: 'src/presentation-kit/types.ts', index: 'src/presentations/index.ts' }
const anchors = ['build', 'kit', 'index'] as const
it.each(Array.from({ length: 8 }, (_, mask) => ({
  present: anchors.filter((_, index) => mask & (1 << index)),
  missing: anchors.filter((_, index) => !(mask & (1 << index))),
})))('I-21 missing $missing with present $present preserves all existing anchors', async ({ present, missing }) => {
  const dir = await mkdtemp(join(tmpdir(), 'scene-anchor-matrix-')); directories.push(dir)
  await writeFile(join(dir, 'package.json'), '{"scripts":{"build":"existing-build"},"dependencies":{"react":"existing-react"}}\n')
  await writeFile(join(dir, 'unrelated.txt'), 'untouched')
  for (const anchor of present) {
    const path = join(dir, anchorFiles[anchor]); await mkdir(dirname(path), { recursive: true }); await writeFile(path, `// existing ${anchor} contract\n`)
  }
  const before = await snapshot(dir)
  await materialize(dir, missing)
  const after = await snapshot(dir)
  for (const anchor of anchors) {
    const path = anchorFiles[anchor]
    expect(after[path]).toBeTruthy()
    if (present.includes(anchor)) expect(after[path]).toBe(before[path])
  }
  expect(after['unrelated.txt']).toBe(before['unrelated.txt'])
  if (missing.length === 0) expect(after).toEqual(before)
  else {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('existing-build'); expect(pkg.dependencies.react).toBe('existing-react'); expect(pkg.dependencies.motion).toBeTruthy()
    for (const anchor of present) {
      const newFiles = Object.keys(after).filter(path => !(path in before))
      if (anchor === 'build') expect(newFiles).not.toContain('index.html')
      if (anchor === 'kit') expect(newFiles.some(path => path.startsWith('src/presentation-kit/'))).toBe(false)
      if (anchor === 'index') expect(newFiles).not.toContain('src/Router.tsx')
    }
  }
})
