import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('provides the presentation host, stage, chrome, and generic scene primitives', () => {
  for (const filename of [
    'Presentation.tsx',
    'Stage.tsx',
    'chrome/Header.tsx',
    'chrome/Footer.tsx',
    'chrome/Toc.tsx',
    'nodes/Box.tsx',
    'nodes/Appear.tsx',
    'nodes/SceneLayer.tsx',
  ]) {
    expect(existsSync(resolve(import.meta.dirname, filename))).toBe(true)
  }
})
