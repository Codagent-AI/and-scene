import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repositoryRoot = process.cwd()
const temporaryDirectories: string[] = []

async function disposableCopy() {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-verification-'))
  temporaryDirectories.push(directory)
  await cp(repositoryRoot, directory, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', 'artifacts', '.git'].includes(basename(source)),
  })
  await symlink(join(repositoryRoot, 'node_modules'), join(directory, 'node_modules'), 'dir')
  return directory
}

async function verify(directory: string) {
  try {
    const result = await execFileAsync('npm', ['run', 'verify'], { cwd: directory })
    return { code: 0, output: `${result.stdout}\n${result.stderr}` }
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string }
    return { code: failure.code ?? 1, output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}` }
  }
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('production presentation verification', () => {
  it('E2E-001 builds and renders the canonical sample through every step', async () => {
    const result = await verify(repositoryRoot)

    expect(result.code).toBe(0)
    expect(result.output).toContain('VERIFY PASS: /how-to-make-a-presentation built and rendered 9 steps on 127.0.0.1')
  }, 60_000)

  it('E2E-002 reports the originating browser error and step from an isolated faulty copy', async () => {
    const directory = await disposableCopy()
    const talk = join(directory, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
    const source = await readFile(talk, 'utf8')
    await writeFile(talk, source.replace('export default function Talk() {', "export default function Talk() {\n  throw new Error('controlled browser fault')"))

    const result = await verify(directory)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('VERIFY FAIL at step 1')
    expect(result.output).toContain('controlled browser fault')
  }, 60_000)
})
