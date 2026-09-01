import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
const bootstrap = join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const temporaryProjects: string[] = []

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd }, (error) => error ? reject(error) : resolve())
  })
}

async function filesBelow(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory)
  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry)
    if ((await stat(path)).isDirectory()) files.push(...await filesBelow(path, root))
    else files.push(relative(root, path))
  }
  return files.sort()
}

afterEach(async () => {
  await Promise.all(temporaryProjects.splice(0).map((project) => rm(project, { force: true, recursive: true })))
})

describe('presentation bootstrap template', () => {
  it('INT-001 materializes a complete, style-neutral app with a kit snapshot', async () => {
    const project = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    temporaryProjects.push(project)
    await cp(bootstrap, project, { recursive: true })

    const packageJson = JSON.parse(await readFile(join(project, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(packageJson.scripts.build).toBeTruthy()
    expect(packageJson.scripts.verify).toBeTruthy()
    expect(packageJson.scripts.inspect).toBeTruthy()
    expect(await readFile(join(project, 'scripts/verify.mjs'), 'utf8')).toContain('127.0.0.1')
    expect(await readFile(join(project, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain('screenshot')
    expect(await readFile(join(repositoryRoot, 'skills/presentation/SKILL.md'), 'utf8')).toContain('one question at a time')
    expect(await readFile(join(repositoryRoot, 'skills/presentation/templates/presentation/Talk.tsx.template'), 'utf8')).toContain('Presentation')
    const skill = await readFile(join(repositoryRoot, 'skills/presentation/SKILL.md'), 'utf8')
    const additionalStep = await readFile(join(repositoryRoot, 'skills/presentation/templates/step/step.tsx.template'), 'utf8')
    const baseSteps = await readFile(join(repositoryRoot, 'skills/presentation/templates/presentation/steps.tsx.template'), 'utf8')
    expect(skill).toContain('Activates when users ask to create a presentation')
    expect(skill).toContain('## Out of Scope')
    expect(skill).toContain('Route:')
    expect(baseSteps).toContain('export type Payload')
    expect(additionalStep).toContain("from '../../../presentation-kit'")
    expect(additionalStep).toContain("import type { Payload } from '../steps'")
    expect(additionalStep).not.toContain('<Appear><Box layoutId={entities.subject}')
    const verifyScript = await readFile(join(project, 'scripts/verify.mjs'), 'utf8')
    const inspectScript = await readFile(join(project, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(verifyScript).toContain('await browser?.close()')
    expect(inspectScript).toContain('await browser?.close()')
    expect(inspectScript).toContain("/^[a-z0-9]+(?:-[a-z0-9]+)*$/")
    expect(packageJson.dependencies).toMatchObject({
      'lucide-react': expect.any(String), motion: expect.any(String), react: expect.any(String), 'react-dom': expect.any(String),
    })
    expect(packageJson.devDependencies).toMatchObject({
      '@vitejs/plugin-react': expect.any(String), eslint: expect.any(String), playwright: expect.any(String), typescript: expect.any(String), vite: expect.any(String),
    })
    const kitFiles = (await filesBelow(join(repositoryRoot, 'src/presentation-kit')))
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
    expect(await filesBelow(join(project, 'src/presentation-kit'))).toEqual(kitFiles)
    for (const file of kitFiles) {
      expect(await readFile(join(project, 'src/presentation-kit', file), 'utf8')).toBe(
        await readFile(join(repositoryRoot, 'src/presentation-kit', file), 'utf8'),
      )
    }

    const bootstrapContents = await Promise.all((await filesBelow(project)).map((file) => readFile(join(project, file), 'utf8')))
    expect(bootstrapContents.join('\n')).not.toMatch(/tailwind/i)
    expect(bootstrapContents.join('\n')).not.toMatch(/--(?:color|font|spacing|shadow|border)-/)

    await run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], project)
    await run('npm', ['run', 'lint'], project)
    await run('npm', ['run', 'build'], project)
  }, 60_000)
})
