import { mkdtemp, cp, mkdir, rm, symlink, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appFiles = ['src', 'scripts', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html']

async function makeCopy(parent: string, name: string) {
  const app = join(parent, name)
  await mkdir(app)
  for (const entry of appFiles) await cp(join(root, entry), join(app, entry), { recursive: true })
  await symlink(join(root, 'node_modules'), join(app, 'node_modules'), 'dir')
  return app
}

describe('production verification failure contract', () => {
  it('reports actionable non-zero failures from isolated fault-injection copies', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-verification-faults-'))
    try {
      const fixtures = [
        { name: 'build', fault: async (app: string) => writeFile(join(app, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), 'this is not valid TypeScript') , expected: 'FAIL: build:' },
        { name: 'sample', fault: async (app: string) => { const path = join(app, 'src/presentations/how-to-make-a-presentation/steps/index.ts'); await writeFile(path, (await readFile(path, 'utf8')).replace('You have a topic', 'Wrong sample title')) }, expected: 'FAIL: sample: step 1 does not match canonical' },
        { name: 'browser', fault: async (app: string) => { const path = join(app, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(path, (await readFile(path, 'utf8')).replace('const beat = payload.beat', "const beat = payload.beat\n  if (beat === 0) console.error('injected browser fault')")) }, expected: 'FAIL: browser: step 1: console error: injected browser fault' },
        { name: 'transition', fault: async (app: string) => { const path = join(app, 'src/presentation-kit/usePresentationNav.ts'); await writeFile(path, (await readFile(path, 'utf8')).replace('const next = useCallback(() => setIndex((i) => Math.min(lastIndex, i + 1)), [lastIndex])', 'const next = useCallback(() => {}, [])')) }, expected: 'FAIL: browser: step 2 transition did not advance from step 1' },
      ]
      for (const fixture of fixtures) {
        const app = await makeCopy(temp, fixture.name)
        await fixture.fault(app)
        try {
          await exec(process.execPath, [join(app, 'scripts/verify.mjs')], { cwd: temp, timeout: 90_000 })
          throw new Error(`${fixture.name} fault unexpectedly passed`)
        } catch (error) {
          const result = error as { code?: number; stdout?: string; stderr?: string; message?: string }
          expect(result.code).not.toBe(0)
          expect(`${result.stdout ?? ''}\n${result.stderr ?? ''}`).toContain(fixture.expected)
        }
      }
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 420_000)

  it('parses reformatted multi-line step objects when checking the canonical outline', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-verification-format-'))
    try {
      const app = await makeCopy(temp, 'multiline')
      const path = join(app, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
      const source = (await readFile(path, 'utf8')).replace(/(\{ id: '[^']+',)\s*(era:)/g, '$1\n    $2').replace(/, (title:|caption:|groupKey:|Scene:|payload:)/g, ',\n    $1').replace('You have a topic', 'Wrong sample title')
      await writeFile(path, source)
      const result = await exec(process.execPath, [join(app, 'scripts/verify.mjs')], { cwd: temp, timeout: 30_000 }).then(() => ({ code: 0, output: '' }), (error: { code?: number; stdout?: string; stderr?: string }) => ({ code: error.code, output: `${error.stdout ?? ''}\n${error.stderr ?? ''}` }))
      expect(result.code).not.toBe(0)
      expect(result.output).toContain('FAIL: sample: step 1 does not match canonical')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 60_000)
})
