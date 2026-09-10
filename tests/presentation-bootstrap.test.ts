import { access, cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrapRoot = join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const kitRoot = join(repositoryRoot, 'src/presentation-kit')
const temporaryDirectories: string[] = []

async function filesBelow(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory()
      ? filesBelow(path, root)
      : [relative(root, path)]
  }))).flat().sort()
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('presentation bootstrap template', () => {
  it('INT-001 materializes from outside the repository with complete anchors, dependencies, parity, and no kit style system', async () => {
    const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    temporaryDirectories.push(target)
    await cp(bootstrapRoot, target, { recursive: true })

    await expect(access(join(target, 'package-lock.json'))).resolves.toBeUndefined()
    await execFileAsync('npm', ['ci', '--ignore-scripts'], { cwd: target, maxBuffer: 1024 * 1024 })

    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const installed = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(installed[dependency]).toBeTypeOf('string')
    }
    expect(manifest.scripts.build).toBeTruthy()
    expect(manifest.scripts.verify).toBeTruthy()
    expect(manifest.scripts.inspect).toBeTruthy()

    for (const anchor of ['src/presentation-kit', 'src/presentations/index.ts', 'vite.config.ts', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      await expect(access(join(target, anchor))).resolves.toBeUndefined()
    }

    const sourceKitFiles = (await filesBelow(kitRoot)).filter((file) => !file.endsWith('.test.tsx'))
    expect(await filesBelow(join(target, 'src/presentation-kit'))).toEqual(sourceKitFiles)
    for (const file of sourceKitFiles) {
      expect(await readFile(join(target, 'src/presentation-kit', file), 'utf8')).toBe(await readFile(join(kitRoot, file), 'utf8'))
    }

    const kitText = (await Promise.all(sourceKitFiles.map((file) => readFile(join(target, 'src/presentation-kit', file), 'utf8')))).join('\n')
    expect(kitText).not.toMatch(/tailwind|font-family|background(?:-color)?\s*:|box-shadow|border(?:-color)?\s*:/i)
    await expect(execFileAsync('npm', ['run', 'build'], { cwd: target })).resolves.toMatchObject({ stderr: expect.any(String) })
  })
})
