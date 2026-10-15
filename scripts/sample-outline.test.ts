import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { validateSample } from './sample-outline.mjs'

const roots: string[] = []
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'and-scene-sample-'))
  roots.push(root)
  await symlink(path.join(process.cwd(), 'node_modules'), path.join(root, 'node_modules'), 'dir')
  const sample = path.join(root, 'src/presentations/how-to-make-a-presentation/steps')
  await mkdir(sample, { recursive: true })
  await writeFile(path.join(root, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'how-to-make-a-presentation', load: () => import('./how-to-make-a-presentation/Talk') }]")
  await writeFile(path.join(sample, 'index.tsx'), await readFile(path.join(process.cwd(), 'src/presentations/how-to-make-a-presentation/steps/index.tsx'), 'utf8'))
  return root
}

afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe('reference sample validation', () => {
  it('accepts the registered nine-step sample', async () => { await expect(validateSample(await fixture())).resolves.toBeUndefined() }, 15000)
  it('rejects a missing registration', async () => {
    const root = await fixture()
    await writeFile(path.join(root, 'src/presentations/index.ts'), 'export const presentations = []')
    await expect(validateSample(root)).rejects.toThrow('[sample] registry does not register')
  }, 15000)
  it('rejects malformed or out-of-order entries with the failing step', async () => {
    const root = await fixture()
    const file = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace("'You have a topic'", "'A different title'"))
    await expect(validateSample(root)).rejects.toThrow('[sample] step 1 missing or out of order')
  }, 15000)
})
