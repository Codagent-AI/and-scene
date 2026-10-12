import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('template synchronization', () => {
  it('copies snapshots when the repository path contains a test marker', () => {
    const fixture = mkdtempSync(path.join(os.tmpdir(), 'and-scene.test.'))
    try {
      const scripts = path.join(fixture, 'scripts')
      const sourceKit = path.join(fixture, 'src/presentation-kit')
      const snapshotKit = path.join(fixture, 'skills/presentation/templates/bootstrap/src/presentation-kit')
      const bootstrapScripts = path.join(fixture, 'skills/presentation/templates/bootstrap/scripts')
      mkdirSync(scripts, { recursive: true })
      mkdirSync(sourceKit, { recursive: true })
      mkdirSync(snapshotKit, { recursive: true })
      mkdirSync(bootstrapScripts, { recursive: true })
      writeFileSync(path.join(scripts, 'sync-templates.mjs'), readFileSync(path.join(process.cwd(), 'scripts/sync-templates.mjs')))
      writeFileSync(path.join(sourceKit, 'runtime.ts'), 'export const runtime = true\n')
      writeFileSync(path.join(sourceKit, 'runtime.test.ts'), 'test fixture\n')
      writeFileSync(path.join(snapshotKit, 'stale.ts'), 'stale snapshot\n')
      writeFileSync(path.join(scripts, 'inspect-presentation.mjs'), 'export const inspect = true\n')
      writeFileSync(path.join(scripts, 'preview-utils.mjs'), 'export const preview = true\n')

      execFileSync(process.execPath, ['scripts/sync-templates.mjs'], { cwd: fixture })

      expect(readFileSync(path.join(snapshotKit, 'runtime.ts'), 'utf8')).toBe('export const runtime = true\n')
      expect(() => readFileSync(path.join(snapshotKit, 'runtime.test.ts'))).toThrow()
      expect(() => readFileSync(path.join(snapshotKit, 'stale.ts'))).toThrow()
      expect(readFileSync(path.join(bootstrapScripts, 'preview-utils.mjs'), 'utf8')).toBe('export const preview = true\n')
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
