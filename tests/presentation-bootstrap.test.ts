import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repository = process.cwd()
const bootstrap = join(repository, 'skills/presentation/templates/bootstrap')
const canonicalKit = join(repository, 'src/presentation-kit')

async function filesUnder(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesUnder(join(root, entry.name)).then((files) => files.map((file) => join(entry.name, file)))
    : [entry.name]))
  return nested.flat()
}

describe('INT-001 materialized bootstrap', () => {
  it('installs, builds and renders from outside the source checkout with a neutral, aligned kit', async () => {
    const scratch = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const project = join(scratch, 'fresh-app')
    const outside = join(scratch, 'caller')
    await cp(bootstrap, project, { recursive: true })
    await import('node:fs/promises').then(({ mkdir }) => mkdir(outside))
    try {
      const packageJson = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      for (const required of ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'motion', 'lucide-react', 'eslint', 'playwright', '@playwright/test']) {
        expect(dependencies).toHaveProperty(required)
      }
      expect(JSON.stringify(dependencies)).not.toMatch(/tailwind/i)
      expect(await readFile(join(project, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'starter'")
      expect(await readFile(join(project, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toContain('data-presentation-attribution')

      const canonicalFiles = (await filesUnder(canonicalKit)).sort()
      const templateKit = join(project, 'src/presentation-kit')
      expect((await filesUnder(templateKit)).sort()).toEqual(canonicalFiles)
      for (const file of canonicalFiles) {
        expect(await readFile(join(templateKit, file))).toEqual(await readFile(join(canonicalKit, file)))
      }
      const kitSources = await Promise.all(canonicalFiles.filter((file) => /\.(tsx?|css)$/.test(file)).map((file) => readFile(join(templateKit, file), 'utf8')))
      expect(kitSources.join('\n')).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|font-family|box-shadow|border-radius|--(?:color|space|font)-/i)

      await execFileAsync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: project, timeout: 180_000 })
      await execFileAsync('npm', ['--prefix', project, 'run', 'verify'], { cwd: outside, timeout: 180_000 })
    } finally {
      await rm(scratch, { recursive: true, force: true })
    }
  }, 360_000)
})
