import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')

describe('repository verify.config.json', () => {
  // The shared verifier only runs the reference-sample phase when this file
  // exists, so deleting it would silently drop that requirement.
  it('keeps the canonical nine-step reference sample requirement enabled', async () => {
    const config = JSON.parse(await readFile(path.join(root, 'verify.config.json'), 'utf8'))

    expect(config.reference.slug).toBe('how-to-make-a-presentation')
    expect(config.reference.steps).toHaveLength(9)
    await expect(readFile(path.join(root, config.reference.stepSource), 'utf8')).resolves.toContain(
      config.reference.steps[0].title,
    )
  })
})
