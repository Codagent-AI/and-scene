import { mkdtemp, mkdir, readFile, rm, writeFile, rename } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findSnapshotDrift, replaceSnapshot } from './sync-templates-lib.mjs'

describe('template snapshot synchronization helpers', () => {
  it('reports extra files as drift', () => {
    expect(findSnapshotDrift(['src/main.tsx', 'package.json'], ['src/main.tsx', 'package.json', 'src/old.css'])).toEqual({
      missing: [],
      unexpected: ['src/old.css'],
    })
  })

  it('restores the existing snapshot when staged installation fails', async () => {
    const parent = await mkdtemp(path.join(os.tmpdir(), 'and-scene-snapshot-'))
    const target = path.join(parent, 'bootstrap')
    const staging = path.join(parent, 'staging')
    try {
      await mkdir(target)
      await writeFile(path.join(target, 'sentinel.txt'), 'old snapshot')
      await mkdir(staging)
      await writeFile(path.join(staging, 'sentinel.txt'), 'new snapshot')
      const failingRename = async (from: string, to: string) => {
        if (from === staging && to === target) {
          const error = new Error('simulated staged install failure') as NodeJS.ErrnoException
          error.code = 'EIO'
          throw error
        }
        await rename(from, to)
      }

      await expect(replaceSnapshot(staging, target, { renamePath: failingRename })).rejects.toThrow('simulated staged install failure')
      await expect(readFile(path.join(target, 'sentinel.txt'), 'utf8')).resolves.toBe('old snapshot')
      await expect(readFile(path.join(staging, 'sentinel.txt'), 'utf8')).resolves.toBe('new snapshot')
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  })
})
