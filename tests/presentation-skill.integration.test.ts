import { mkdtemp, readdir, readFile, cp, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const bootstrap = join(root, 'skills/presentation/templates/bootstrap')

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesUnder(join(dir, entry.name)).then((files) => files.map((file) => join(entry.name, file)))
    : [entry.name]))
  return nested.flat()
}

describe('presentation skill bootstrap (INT-001)', () => {
  it('materializes outside the repository, builds, declares the full stack, and matches the canonical kit', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temp, 'fresh-project')
    try {
      await cp(bootstrap, app, { recursive: true })
      await symlink(join(root, 'node_modules'), join(app, 'node_modules'), 'dir')
      execFileSync('npm', ['run', 'build'], { cwd: app, stdio: 'pipe' })

      const packageJson = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', '@eslint/js', 'typescript-eslint', 'playwright']) {
        expect(allDeps, dependency).toHaveProperty(dependency)
      }
      expect(packageJson.scripts).toHaveProperty('verify')
      expect(packageJson.scripts).toHaveProperty('inspect')
      expect(await readFile(join(app, 'package-lock.json'), 'utf8')).toContain('"lockfileVersion"')

      const canonicalKit = join(root, 'src/presentation-kit')
      const templateKit = join(app, 'src/presentation-kit')
      const canonicalFiles = (await filesUnder(canonicalKit)).sort()
      expect((await filesUnder(templateKit)).sort()).toEqual(canonicalFiles)
      for (const file of canonicalFiles) {
        expect(await readFile(join(templateKit, file)), relative(app, join(templateKit, file)))
          .toEqual(await readFile(join(canonicalKit, file)))
      }
      const kitText = (await Promise.all(canonicalFiles.map((file) => readFile(join(templateKit, file), 'utf8')))).join('\n')
      expect(kitText).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]+\s*:/i)
      expect(packageJson.dependencies).not.toHaveProperty('tailwindcss')

      const skill = await readFile(join(root, 'skills/presentation/SKILL.md'), 'utf8')
      expect(skill).toContain('relative to it')
      expect(skill).toContain('one concise question at a time')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 60_000)
})
