import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('reference presentation fixture', () => {
  it('registers the canonical nine-step sample and root verification commands', async () => {
    await expect(access(join(root, 'src/presentations/how-to-make-a-presentation/Talk.tsx'))).resolves.toBeUndefined()
    await expect(access(join(root, 'scripts/verify.mjs'))).resolves.toBeUndefined()
    await expect(access(join(root, 'scripts/inspect-presentation.mjs'))).resolves.toBeUndefined()

    const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'how-to-make-a-presentation'")

    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(manifest.scripts.verify).toContain('scripts/verify.mjs')
    expect(manifest.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })
})
