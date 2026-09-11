import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const run = async (...args: Parameters<typeof execFile>) => {
  try {
    return await promisify(execFile)(...args)
  } catch (error) {
    const details = error as { message?: string; stdout?: string; stderr?: string }
    throw new Error([details.message, details.stdout, details.stderr].filter(Boolean).join('\n'), { cause: error })
  }
}
const repositoryRoot = process.cwd()
const skillDirectory = join(repositoryRoot, 'skills/presentation')
const bootstrapDirectory = join(skillDirectory, 'templates/bootstrap')
const scratchDirectories: string[] = []

async function filesBelow(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory)
  const files = await Promise.all(entries.map(async (entry) => {
    const filename = join(directory, entry)
    return (await stat(filename)).isDirectory()
      ? filesBelow(filename, root)
      : [filename.slice(root.length + 1)]
  }))
  return files.flat().sort()
}

afterEach(async () => {
  await Promise.all(scratchDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('presentation skill bootstrap contract', () => {
  it('ships the skill procedure and bootstrap anchors', () => {
    expect(existsSync(join(skillDirectory, 'SKILL.md'))).toBe(true)
    expect(existsSync(join(skillDirectory, 'templates/bootstrap/package.json'))).toBe(true)
    expect(existsSync(join(skillDirectory, 'templates/bootstrap/src/presentation-kit/types.ts'))).toBe(true)
    expect(existsSync(join(skillDirectory, 'templates/bootstrap/src/presentations/index.ts'))).toBe(true)
    expect(existsSync(join(skillDirectory, 'templates/bootstrap/scripts/inspect-presentation.mjs'))).toBe(true)
  })

  it('documents one-question gathering and self-verification', () => {
    const skill = readFileSync(join(skillDirectory, 'SKILL.md'), 'utf8')
    expect(skill).toMatch(/one question at a time/i)
    expect(skill).toMatch(/partial detail/i)
    expect(skill).toMatch(/contract anchor/i)
    expect(skill).toMatch(/npm run verify/i)
    expect(skill).toMatch(/visual composition/i)
  })

  it('INT-001 materializes a buildable, style-neutral bootstrap outside the repository', async () => {
    expect(existsSync(join(bootstrapDirectory, 'package-lock.json'))).toBe(true)
    const destination = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    scratchDirectories.push(destination)
    await cp(bootstrapDirectory, destination, { recursive: true })

    const packageJson = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'))
    expect(packageJson.scripts.build).toBe('tsc -b && vite build')
    expect(packageJson.scripts.verify).toBeTruthy()
    expect(packageJson.scripts.inspect).toBeTruthy()
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) {
      expect(packageJson.dependencies[dependency]).toBeTruthy()
    }
    for (const dependency of [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
      '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright',
    ]) {
      expect(packageJson.devDependencies[dependency]).toBeTruthy()
    }

    expect(await readFile(join(destination, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toContain('data-step-count')
    expect(await readFile(join(destination, 'src/presentation-kit/types.ts'), 'utf8')).toContain('export type Step')
    expect(await readFile(join(destination, 'src/presentations/index.ts'), 'utf8')).toContain('PRESENTATIONS')
    expect(await readFile(join(destination, 'scripts/verify.mjs'), 'utf8')).toContain('127.0.0.1')
    expect(await readFile(join(destination, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain('screenshot')

    const bootstrapCss = await readFile(join(destination, 'src/index.css'), 'utf8')
    expect(bootstrapCss).not.toMatch(/tailwind|--(?:color|font|space)|background(?:-color)?\s*:/i)
    expect(JSON.stringify(packageJson)).not.toMatch(/tailwind/i)

    const canonicalKit = join(repositoryRoot, 'src/presentation-kit')
    for (const filename of await filesBelow(canonicalKit)) {
      if (filename.includes('.test.')) continue
      expect(await readFile(join(destination, 'src/presentation-kit', filename), 'utf8')).toBe(
        await readFile(join(canonicalKit, filename), 'utf8'),
      )
    }

    await run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: destination })

    await writeFile(join(destination, 'src/presentations/index.ts'), `
import type { ComponentType } from 'react'

export type PresentationRegistryEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const PRESENTATIONS = [{
  slug: 'fixture',
  title: 'Fixture',
  load: () => import('./fixture/Talk.tsx'),
}]
`)
    await mkdir(join(destination, 'src/presentations/fixture'), { recursive: true })
    await writeFile(join(destination, 'src/presentations/fixture/Talk.tsx'), `
import { Presentation } from '../../presentation-kit/index.ts'

function Scene() {
  return <div data-scene-node="fixture">fixture</div>
}

const steps = [{
  id: 'fixture',
  era: 'fixture',
  title: 'Fixture',
  caption: 'Fixture route',
  Scene,
  payload: null,
}]

export default function Talk() {
  return <Presentation title="Fixture" steps={steps} />
}
    `)
    await run('npm', ['run', 'build'], { cwd: destination })
    await run('npm', ['run', 'verify', '--', 'fixture'], { cwd: destination })
    await writeFile(join(destination, 'src/presentations/index.ts'), `
import type { ComponentType } from 'react'

export type PresentationRegistryEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const PRESENTATIONS = [
  { slug: 'fixture', title: 'Fixture', load: () => import('./fixture/Talk.tsx') },
  { slug: 'fixture-two', title: 'Fixture two', load: () => import('./fixture/Talk.tsx') },
]
`)
    await expect(run('npm', ['run', 'verify'], { cwd: destination })).rejects.toThrow(
      'multiple presentations are registered; pass a presentation slug to npm run verify',
    )
  }, 30_000)
})
