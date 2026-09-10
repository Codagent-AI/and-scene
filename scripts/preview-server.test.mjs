import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { withPreview } from './preview-server.mjs'

test.each([false, true])('preview releases its port after callback failure=%s', async (fail) => {
  const root = await mkdtemp(resolve(tmpdir(), 'and-scene-preview-'))
  let origin
  try {
    await mkdir(resolve(root, 'dist'))
    await writeFile(resolve(root, 'dist/index.html'), '<h1>Preview fixture</h1>')
    const visit = withPreview(root, async (url) => {
      origin = url
      expect(await (await fetch(url)).text()).toContain('Preview fixture')
      if (fail) throw new Error('fixture callback failure')
      return 'inspected'
    })
    if (fail) await expect(visit).rejects.toThrow('fixture callback failure')
    else await expect(visit).resolves.toBe('inspected')
    await expect.poll(async () => {
      try { await fetch(origin); return true } catch { return false }
    }).toBe(false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
