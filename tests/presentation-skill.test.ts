import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repositoryRoot = process.cwd()
const bootstrapRoot = join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const temporaryDirectories: string[] = []

async function materializeBootstrap() {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  temporaryDirectories.push(directory)
  await cp(bootstrapRoot, directory, { recursive: true })
  return directory
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('presentation skill bootstrap', () => {
  it('INT-001 materializes a self-contained, style-neutral app with its dependency contract', async () => {
    const directory = await materializeBootstrap()
    const packageJson = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    expect(existsSync(join(directory, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(directory, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(join(directory, 'src/presentations/index.ts'))).toBe(true)
    expect(existsSync(join(directory, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(join(directory, 'scripts/inspect-presentation.mjs'))).toBe(true)
    expect(packageJson.dependencies).toMatchObject({
      'lucide-react': expect.any(String),
      motion: expect.any(String),
      react: expect.any(String),
      'react-dom': expect.any(String),
    })
    expect(packageJson.devDependencies).toMatchObject({
      '@types/node': expect.any(String),
      '@types/react': expect.any(String),
      '@types/react-dom': expect.any(String),
      '@vitejs/plugin-react': expect.any(String),
      eslint: expect.any(String),
      playwright: expect.any(String),
      typescript: expect.any(String),
      vite: expect.any(String),
    })
    expect(JSON.stringify(packageJson)).not.toContain('tailwind')
    expect(await readFile(join(directory, 'src/index.css'), 'utf8')).not.toMatch(/(?:color|font-family|box-shadow|border|--[\w-]+)\s*:/)
  })

  it('INT-001 keeps the bootstrap scene kit byte-aligned and builds from an external directory', async () => {
    const directory = await materializeBootstrap()
    const kitFiles = [
      'constants.ts', 'index.ts', 'Presentation.tsx', 'Stage.tsx', 'types.ts', 'useFitScale.ts', 'usePresentationNav.ts',
      'chrome/Footer.tsx', 'chrome/Header.tsx', 'chrome/Toc.tsx',
      'nodes/Appear.tsx', 'nodes/Arrow.tsx', 'nodes/Box.tsx', 'nodes/Emphasis.tsx', 'nodes/Frame.tsx', 'nodes/Label.tsx', 'nodes/SceneLayer.tsx', 'nodes/SymbolChip.tsx',
    ]

    await Promise.all(kitFiles.map(async (file) => {
      expect(await readFile(join(directory, 'src/presentation-kit', file), 'utf8')).toBe(
        await readFile(join(repositoryRoot, 'src/presentation-kit', file), 'utf8'),
      )
    }))

    await expect(execFileAsync('npm', ['ci', '--ignore-scripts'], { cwd: directory })).resolves.toMatchObject({ stdout: expect.any(String) })
    await expect(execFileAsync('npm', ['run', 'build'], { cwd: directory })).resolves.toMatchObject({ stdout: expect.any(String) })
  })

  it('owns strict Vite preview servers so verification cannot inspect another app or leak a port', async () => {
    for (const script of ['verify.mjs', 'inspect-presentation.mjs']) {
      const source = await readFile(join(bootstrapRoot, 'scripts', script), 'utf8')

      expect(source).toContain("import { preview as startPreview } from 'vite'")
      expect(source).toContain('strictPort: true')
      expect(source).toContain('await closePreview(browser, server)')
    }
  })
})
