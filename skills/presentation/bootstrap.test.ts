// @vitest-environment node
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, test } from 'vitest'

const skillDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = join(skillDirectory, '..', '..')
const bootstrapTemplate = join(skillDirectory, 'templates', 'bootstrap')
const temporaryDirectories: string[] = []

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory)
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry)
    return (await stat(path)).isDirectory()
      ? filesUnder(path)
      : [path]
  }))
  return files.flat()
}

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  expect(result.status, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`).toBe(0)
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('presentation bootstrap template', () => {
  test('INT-001 materializes outside the repository with required anchors, a style-neutral kit, and a buildable route', async () => {
    const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    temporaryDirectories.push(target)
    await cp(bootstrapTemplate, target, { recursive: true })

    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const dependency of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react',
      'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright',
    ]) expect(dependencies[dependency]).toBeTruthy()

    await expect(stat(join(target, 'src', 'presentation-kit'))).resolves.toBeTruthy()
    await expect(stat(join(target, 'src', 'presentations', 'index.ts'))).resolves.toBeTruthy()
    expect(await readFile(join(target, 'src', 'presentations', 'index.ts'), 'utf8')).toContain("slug: 'starter'")

    const templateKit = join(target, 'src', 'presentation-kit')
    const canonicalKit = join(repositoryRoot, 'src', 'presentation-kit')
    for (const templateFile of await filesUnder(templateKit)) {
      const path = relative(templateKit, templateFile)
      if (/\.test\.[cm]?[jt]sx?$/.test(path)) continue
      expect(await readFile(templateFile, 'utf8')).toBe(await readFile(join(canonicalKit, path), 'utf8'))
    }

    const kitSource = (await Promise.all((await filesUnder(templateKit)).map((path) => readFile(path, 'utf8')))).join('\n')
    expect(kitSource).not.toMatch(/tailwind|font-family|#[0-9a-f]{3,8}|box-shadow|border:\s*['"]?\d|background(?:-color)?\s*:/i)

    run('npm', ['ci', '--ignore-scripts'], target)
    run('npm', ['run', 'build'], target)
    run('npm', ['run', 'render:smoke', '--', '--check-only'], target)
  }, 120_000)

  test('reports accidental visual defects while exempting explicitly allowed overlap', async () => {
    const { inspectStep } = await import('./templates/bootstrap/scripts/inspection-diagnostics.mjs') as {
      inspectStep: (input: {
        activeStyles: { active: string; inactive: string }[]
        attribution: { browserDefault: boolean; fontSize: number; present: boolean }
        elements: { allowOverlap: boolean; id: string; rect: { bottom: number; left: number; right: number; top: number } }[]
      }) => string[]
    }

    const warnings = inspectStep({
      activeStyles: [{ active: 'rgb(0, 0, 0)', inactive: 'rgb(0, 0, 0)' }],
      attribution: { browserDefault: true, fontSize: 12, present: true },
      elements: [
        { allowOverlap: false, id: 'caption', rect: { bottom: 40, left: 0, right: 100, top: 0 } },
        { allowOverlap: false, id: 'next', rect: { bottom: 60, left: 50, right: 140, top: 20 } },
        { allowOverlap: true, id: 'intentional-a', rect: { bottom: 40, left: 200, right: 300, top: 0 } },
        { allowOverlap: true, id: 'intentional-b', rect: { bottom: 50, left: 220, right: 320, top: 10 } },
      ],
    })

    expect(warnings).toContain('overlap: caption and next')
    expect(warnings).toContain('active chrome is visually indistinct')
    expect(warnings).toContain('attribution is browser-default or undersized')
    expect(warnings.join('\n')).not.toContain('intentional-a')
  })

  test('keeps the starter visual treatment presentation-owned, including usable chrome', async () => {
    const stylesheet = await readFile(join(bootstrapTemplate, 'src', 'presentations', 'starter', 'presentation.css'), 'utf8')

    expect(stylesheet).toContain('[data-presentation-toc="true"]')
    expect(stylesheet).toContain('[data-presentation-controls="true"] button')
    expect(stylesheet).toContain('[data-presentation-progress="true"] button')
    expect(stylesheet).toContain('right: 1rem !important')
  })
})
