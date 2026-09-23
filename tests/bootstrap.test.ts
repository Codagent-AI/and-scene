import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = join(repo, 'skills/presentation/templates/bootstrap')

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : Promise.resolve([path])
  }))
  return files.flat()
}

describe('presentation bootstrap template (INT-001)', () => {
  it('materializes, builds outside the repository, and matches the canonical style-neutral kit', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temporaryRoot, 'app')
    try {
      await cp(bootstrap, app, { recursive: true })

      const packageJson = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
      const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      for (const name of [
        'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react',
        'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright',
      ]) expect(allDependencies).toHaveProperty(name)
      expect(JSON.stringify(allDependencies)).not.toMatch(/tailwind/i)
      expect(packageJson.scripts).toHaveProperty('build')
      expect(packageJson.scripts).toHaveProperty('verify')
      expect(packageJson.scripts).toHaveProperty('inspect')

      const anchors = await filesUnder(app)
      expect(anchors.some((path) => path.endsWith('vite.config.ts'))).toBe(true)
      expect(anchors.some((path) => path.endsWith('presentation-kit/types.ts'))).toBe(true)
      expect(anchors.some((path) => path.endsWith('presentations/index.ts'))).toBe(true)
      expect(anchors.some((path) => path.endsWith('scripts/verify.mjs'))).toBe(true)
      expect(anchors.some((path) => path.endsWith('scripts/inspect-presentation.mjs'))).toBe(true)
      expect(anchors.some((path) => path.endsWith('package-lock.json'))).toBe(true)

      const canonicalFiles = (await filesUnder(join(repo, 'src/presentation-kit')))
        .filter((path) => !path.includes('/__tests__/'))
      for (const source of canonicalFiles) {
        const relative = source.slice(join(repo, 'src/presentation-kit').length + 1)
        expect(await readFile(join(app, 'src/presentation-kit', relative), 'utf8')).toBe(await readFile(source, 'utf8'))
      }

      const kitFiles = (await filesUnder(join(app, 'src/presentation-kit'))).filter((path) => path.endsWith('.css'))
      const kitCss = (await Promise.all(kitFiles.map((path) => readFile(path, 'utf8')))).join('\n')
      expect(kitCss).not.toMatch(/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\s*\(|--[\w-]+\s*:/i)
      expect(kitCss).not.toMatch(/tailwind/i)

      execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: app, stdio: 'pipe' })
      execFileSync('npm', ['run', 'lint'], { cwd: app, stdio: 'pipe' })
      execFileSync('npm', ['run', 'build'], { cwd: app, stdio: 'pipe' })
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  }, 120_000)

  it('resolves its template directory from the skill location, independent of cwd', async () => {
    const skill = await readFile(join(repo, 'skills/presentation/SKILL.md'), 'utf8')
    expect(skill).toMatch(/resolve[^\n]*(?:relative|directory)[^\n]*SKILL\.md/i)
    expect(skill).toMatch(/templates\/bootstrap/)
    expect(skill).toMatch(/templates\/presentation/)
  })
})
