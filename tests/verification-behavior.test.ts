import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { createAppFixture } from './helpers/app-fixture'

const exec = promisify(execFile)
const copies: string[] = []

async function fixture() {
  const directory = await createAppFixture('and-scene-verification-')
  copies.push(directory)
  return directory
}

async function verify(directory: string) {
  try {
    const { stdout, stderr } = await exec('npm', ['run', 'verify'], { cwd: directory, timeout: 60000, maxBuffer: 1024 * 1024 })
    return { code: 0, output: stdout + stderr }
  } catch (error) {
    const result = error as { code: number; stdout: string; stderr: string }
    return { code: result.code, output: result.stdout + result.stderr }
  }
}

afterEach(async () => {
  await Promise.all(copies.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('production verification contract', () => {
  it('accepts the canonical presentation with its outline moved into an imported module', async () => {
    const directory = await fixture()
    const steps = join(directory, 'src/presentations/how-to-make-a-presentation/steps')
    await rename(join(steps, 'index.tsx'), join(steps, 'outline.tsx'))
    await writeFile(join(steps, 'index.tsx'), "export { STEPS } from './outline'\n")
    const result = await verify(directory)
    expect(result.output).toContain('Presentation verification passed.')
    expect(result.code).toBe(0)
  }, 90000)

  it('rejects a wrong runtime caption even when every canonical string remains in source', async () => {
    const directory = await fixture()
    const steps = join(directory, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
    const source = await readFile(steps, 'utf8')
    await writeFile(steps, source.replace('  caption,', '  caption: index === 1 ? REFERENCE_OUTLINE[0][2] : caption,'))
    const result = await verify(directory)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/reference.*step 2.*caption/i)
  }, 90000)

  it.each([
    ['build', 'src/presentations/how-to-make-a-presentation/Talk.tsx', (source: string) => source + '\nconst broken: string = 42\n', /build.*exited|error TS/],
    ['missing sample', 'src/presentations/index.ts', (source: string) => source.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'"), /reference sample is not registered/],
    ['runtime order', 'src/presentations/how-to-make-a-presentation/steps/index.tsx', (source: string) => source.replace('REFERENCE_OUTLINE.map', '[...REFERENCE_OUTLINE].reverse().map'), /reference.*step 1.*(era|title)/],
    ['console error', 'src/presentation-kit/chrome/Footer.tsx', (source: string) => source.replace('  const step = steps[index]', "  if (index === 1) console.error('injected console failure')\n  const step = steps[index]"), /render phase failed at step 2: injected console failure/],
    ['page error', 'src/presentation-kit/chrome/Footer.tsx', (source: string) => source.replace('  const step = steps[index]', "  if (index === 1) throw new Error('injected page failure')\n  const step = steps[index]"), /render phase failed at step 2: injected page failure/],
    ['transition', 'src/presentation-kit/Presentation.tsx', (source: string) => source.replace('data-step-index={index}', 'data-step-index={0}'), /render phase failed at step 2:/],
  ] as const)('E2E-002 rejects an isolated %s fault with an actionable failure', async (_name, file, inject, message) => {
    const directory = await fixture()
    const path = join(directory, file)
    await writeFile(path, inject(await readFile(path, 'utf8')))
    const result = await verify(directory)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(message)
    expect(result.output).not.toContain('Presentation verification passed.')
  }, 90000)
})
