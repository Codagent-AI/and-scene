import { spawnSync } from 'node:child_process'
import { mkdtempSync, cpSync, symlinkSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createConnection } from 'node:net'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
function isolated(fault?: 'build' | 'sample' | 'outline' | 'runtime' | 'transition') {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-verify-'))
  cpSync(root, dir, { recursive: true, filter: source => !source.includes('/node_modules') && !source.includes('/.git') && !source.includes('/dist') && !source.includes('/validator_logs') })
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  if (fault === 'build') writeFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/steps.tsx'), readFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/steps.tsx'), 'utf8') + '\nconst broken: number = "no"\n')
  if (fault === 'sample') writeFileSync(join(dir, 'src/presentations/index.ts'), readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8').replace("slug: 'how-to-make-a-presentation'", "slug: 'different-slug'"))
  if (fault === 'outline') writeFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/steps.tsx'), readFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/steps.tsx'), 'utf8').replace('Answers become steps', 'Steps become answers'))
  if (fault === 'runtime') writeFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/EvolvingScene.tsx'), readFileSync(join(dir, 'src/presentations/how-to-make-a-presentation/steps/EvolvingScene.tsx'), 'utf8').replace('const n = payload.count', "const n = payload.count\n  if (payload.count === 3) console.error('injected render error')"))
  if (fault === 'transition') writeFileSync(join(dir, 'src/presentation-kit/usePresentationNav.ts'), readFileSync(join(dir, 'src/presentation-kit/usePresentationNav.ts'), 'utf8').replace('const next = useCallback(() => goTo(index + 1), [goTo, index])', 'const next = useCallback(() => undefined, [])'))
  return dir
}
function invoke(dir: string) { return spawnSync('npm', ['run', 'verify'], { cwd: dir, encoding: 'utf8', timeout: 120_000 }) }
async function portIsFree(port: number) {
  return await new Promise<boolean>(resolveFree => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => { socket.destroy(); resolveFree(false) })
    socket.once('error', () => resolveFree(true))
  })
}

describe('production verification E2E', () => {
  it('E2E-001 verifies the committed sample through Chromium', async () => {
    const dir = isolated()
    try {
      const result = invoke(dir)
      expect(result.status, result.stdout + result.stderr).toBe(0)
      expect(result.stdout).toContain('PASS [verify]')
      expect(result.stdout + result.stderr).toContain('preview and readiness probe at http://127.0.0.1:')
      expect(result.stdout + result.stderr).toContain('browser route http://127.0.0.1:')
      const port = result.stdout.match(/preview and readiness probe at http:\/\/127\.0\.0\.1:(\d+)\//)?.[1]
      expect(port).toBeDefined()
      expect(await portIsFree(Number(port))).toBe(true)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  }, 120_000)

  it.each([
    ['build', 'build'], ['sample', 'sample'], ['outline', 'sample'], ['runtime', 'render'], ['transition', 'render'],
  ] as const)('E2E-002 reports %s faults and cleans up', async (fault, phase) => {
    const dir = isolated(fault)
    try {
      const result = invoke(dir)
      const output = result.stdout + result.stderr
      expect(result.status).not.toBe(0)
      expect(output).toContain(`FAIL [${phase}]`)
      expect(output).not.toContain('PASS [verify]')
      if (fault === 'runtime' || fault === 'transition') expect(output).toMatch(/step [0-9]/)
      const port = output.match(/preview and readiness probe at http:\/\/127\.0\.0\.1:(\d+)\//)?.[1]
      if (port) expect(await portIsFree(Number(port))).toBe(true)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  }, 120_000)
})
