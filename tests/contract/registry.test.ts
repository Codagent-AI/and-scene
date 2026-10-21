import { stat } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, text } from './helpers'

describe.each([ROOT, TEMPLATE])('registry source in %s', (dir) => {
  it('is an explicit array whose entries each name a folder with a Talk component', async () => {
    const source = await text(path.join(dir, 'src/presentations/index.ts'))
    expect(source).not.toMatch(/import\.meta\.glob/)
    const slugs = [...source.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      expect(source).toContain(`import('./${slug}/Talk')`)
      await expect(stat(path.join(dir, 'src/presentations', slug, 'Talk.tsx'))).resolves.toBeTruthy()
    }
  })
})
