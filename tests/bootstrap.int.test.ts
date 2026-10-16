import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO } from './helpers'

// INT-001: the distributable bootstrap works outside the repository that authored it.
describe('INT-001 materialized bootstrap', () => {
  it('scaffolds, installs from the lock file, builds, lints, and verifies from another cwd', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-int1-'))
    const sh = (cmd: string, args: string[], cwd: string) => {
      const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 540_000 })
      return { code: r.status, out: `${r.stdout}${r.stderr}` }
    }
    const scaffold = sh('node', [path.join(REPO, 'skills/presentation/scripts/scaffold.mjs'), dir], os.tmpdir())
    expect(scaffold.code, scaffold.out).toBe(0)
    for (const [cmd, args] of [
      ['npm', ['ci', '--no-audit', '--no-fund']],
      ['npm', ['run', 'build']],
      ['npm', ['run', 'lint']],
      ['npm', ['run', 'verify']],
    ] as const) {
      const r = sh(cmd, [...args], dir)
      expect(r.code, `${cmd} ${args.join(' ')}\n${r.out}`).toBe(0)
      if (args[1] === 'verify') expect(r.out).toContain('VERIFY PASSED')
    }
    const detect = sh('node', [path.join(REPO, 'skills/presentation/scripts/detect.mjs'), dir], os.tmpdir())
    expect(JSON.parse(detect.out).anchors).toEqual({ build: true, kit: true, index: true })
    fs.rmSync(dir, { recursive: true, force: true })
  }, 600_000)
})
