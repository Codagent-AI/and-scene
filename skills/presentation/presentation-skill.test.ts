import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, expect, test } from 'vitest'

const repositoryRoot = process.cwd()
const bootstrap = join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const scratchDirectories: string[] = []
const run = promisify(execFile)

async function filesBelow(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory)
  const results = await Promise.all(entries.map(async (entry) => {
    const filename = join(directory, entry)
    return (await stat(filename)).isDirectory()
      ? filesBelow(filename, root)
      : [relative(root, filename)]
  }))
  return results.flat()
}

afterEach(async () => {
  await Promise.all(scratchDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

test('INT-001 bootstrap materializes outside the repository with the required anchors and a byte-aligned kit', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  scratchDirectories.push(destination)
  await cp(bootstrap, destination, { recursive: true })

  const packageJson = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'))
  expect(packageJson.scripts.build).toBeTruthy()
  expect(packageJson.scripts.verify).toBeTruthy()
  expect(packageJson.scripts.inspect).toBeTruthy()
  for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) {
    expect(packageJson.dependencies[dependency]).toBeTruthy()
  }
  for (const dependency of ['vite', 'typescript', 'eslint', 'playwright']) {
    expect(packageJson.devDependencies[dependency]).toBeTruthy()
  }

  expect(await readFile(join(destination, 'src/presentation-kit/types.ts'), 'utf8')).toContain('export interface Step')
  expect(await readFile(join(destination, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toContain('data-step-count')
  expect(await readFile(join(destination, 'src/presentations/index.ts'), 'utf8')).toContain('presentations')
  expect(await readFile(join(destination, 'scripts/preview-server.mjs'), 'utf8')).toContain('127.0.0.1')
  for (const script of ['preview-server.mjs', 'inspect-presentation.mjs', 'inspection-diagnostics.mjs']) {
    expect(await readFile(join(destination, 'scripts', script), 'utf8')).toBe(
      await readFile(join(repositoryRoot, 'scripts', script), 'utf8'),
    )
  }

  const canonicalKit = join(repositoryRoot, 'src/presentation-kit')
  for (const filename of await filesBelow(canonicalKit)) {
    expect(await readFile(join(destination, 'src/presentation-kit', filename), 'utf8')).toBe(
      await readFile(join(canonicalKit, filename), 'utf8'),
    )
  }

  const bootstrapContents = await readFile(join(destination, 'src/index.css'), 'utf8')
  expect(bootstrapContents).not.toMatch(/tailwind|--(?:color|font|space)|background(?:-color)?\s*:/i)

  await run('npm', ['ci', '--ignore-scripts'], { cwd: destination })
  await cp(join(repositoryRoot, 'skills/presentation/templates/presentation'), join(destination, 'src/presentations/example'), { recursive: true })
  await writeFile(join(destination, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationRegistration[] = [
  { slug: 'example', title: 'Example', load: () => import('./example/Talk') },
]

export function resolvePresentation(pathname: string, registry: readonly PresentationRegistration[] = presentations) {
  const slug = pathname.replace(/^\\/+|\\/+$/g, '')
  return slug.includes('/') ? undefined : registry.find((presentation) => presentation.slug === slug)
}
`)
  const verified = await run('npm', ['run', 'verify'], { cwd: destination })
  expect(verified.stdout).toContain('verify: PASS')
  const talkPath = join(destination, 'src/presentations/example/Talk.tsx')
  await writeFile(talkPath, `console.error('bootstrap route fault')\n${await readFile(talkPath, 'utf8')}`)
  await expect(run('npm', ['run', 'verify'], { cwd: destination, timeout: 30_000 }))
    .rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('bootstrap route fault') })
}, 60_000)
