import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, symlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = process.cwd()
const bootstrap = path.join(repo, 'skills/presentation/templates/bootstrap')

async function filesUnder(root: string, relative = ''): Promise<string[]> {
  const directory = path.join(root, relative)
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesUnder(root, path.join(relative, entry.name))
    : Promise.resolve([path.join(relative, entry.name)])))
  return files.flat().sort()
}

describe('distributable bootstrap template', () => {
  it('materializes, builds from an unrelated working directory, and preserves kit parity', async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    try {
      await cp(bootstrap, target, { recursive: true, filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.includes(`${path.sep}dist`) && !source.includes(`${path.sep}presentation-artifacts`) })
      await symlink(path.join(repo, 'node_modules'), path.join(target, 'node_modules'), 'dir')
      execFileSync('npm', ['run', 'verify', '--prefix', target], { cwd: os.tmpdir(), stdio: 'pipe' })
      const templateFiles = await filesUnder(path.join(target, 'src/presentation-kit'))
      const canonicalFiles = await filesUnder(path.join(repo, 'src/presentation-kit'))
      const sourceFiles = (files: string[]) => files.filter((file) => !file.endsWith('.test.tsx') && !file.endsWith('.test.ts'))
      expect(sourceFiles(templateFiles)).toEqual(sourceFiles(canonicalFiles))
      for (const file of sourceFiles(canonicalFiles)) {
        expect(await readFile(path.join(target, 'src/presentation-kit', file), 'utf8')).toBe(await readFile(path.join(repo, 'src/presentation-kit', file), 'utf8'))
      }
      const pkg = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
      for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
      for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
      expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
      const kitCss = await readFile(path.join(target, 'src/presentation-kit/presentation-kit.css'), 'utf8')
      expect(kitCss).not.toMatch(/#[\da-f]{3,8}\b|\b(?:font-family|box-shadow|border-radius|--[\w-]+)\s*:/i)
      expect(await readFile(path.join(target, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'starter'")
      expect(await readFile(path.join(target, 'scripts/verify.mjs'), 'utf8')).toContain('127.0.0.1')
      expect(await readFile(path.join(target, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain('presentation-artifacts')
    } finally {
      await rm(target, { recursive: true, force: true })
    }
  }, 120_000)
})
