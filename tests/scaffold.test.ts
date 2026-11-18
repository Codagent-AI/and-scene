// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
