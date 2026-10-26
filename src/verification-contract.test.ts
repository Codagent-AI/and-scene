import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

describe('production presentation verification', () => {
  it('exposes root verification and inspection commands', async () => {
    const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts.verify).toBe('node scripts/verify.mjs')
    expect(packageJson.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })
})
