import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
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
  it('ships a lockfile that is consistent with its package manifest', async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-lock-'))
    try {
      for (const file of ['package.json', 'package-lock.json']) await cp(path.join(bootstrap, file), path.join(target, file))
      expect(() => execFileSync('npm', ['ci', '--dry-run', '--ignore-scripts', '--offline', '--no-audit', '--no-fund'], { cwd: target, encoding: 'utf8', stdio: 'pipe' })).not.toThrow()
    } finally {
      await rm(target, { recursive: true, force: true })
    }
  }, 60_000)

  it('materializes, builds from an unrelated working directory, and preserves kit parity', async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    try {
      await cp(bootstrap, target, { recursive: true, filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.includes(`${path.sep}dist`) && !source.includes(`${path.sep}presentation-artifacts`) })
      await symlink(path.join(repo, 'node_modules'), path.join(target, 'node_modules'), 'dir')
      const registryPath = path.join(target, 'src/presentations/index.ts')
      const registry = await readFile(registryPath, 'utf8')
      const twoRoutes = registry.replace(
        "  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },",
        "  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },\n  { slug: 'second', title: 'Second route', load: () => import('./starter/Talk') },",
      ) + "\n// { slug: 'comment-is-not-a-route' }\n"
      await writeFile(registryPath, twoRoutes)
      const verifyOutput = execFileSync('npm', ['run', 'verify', '--prefix', target], { cwd: os.tmpdir(), encoding: 'utf8' })
      expect(verifyOutput).toContain('PASS: starter rendered')
      expect(verifyOutput).toContain('PASS: second rendered')
      expect(verifyOutput).not.toContain('comment-is-not-a-route')
      const inspectOutput = execFileSync('npm', ['run', 'inspect', '--prefix', target, '--', 'starter'], { cwd: os.tmpdir(), encoding: 'utf8' })
      expect(inspectOutput).toContain('Captured 1 settled step screenshots')
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
      expect(await readFile(path.join(target, 'scripts/verify.mjs'), 'utf8')).toContain('registeredSlugs')
      expect(await readFile(path.join(target, 'scripts/preview-utils.mjs'), 'utf8')).toContain('port: 0')
      expect(await readFile(path.join(target, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain('presentation-artifacts')
    } finally {
      await rm(target, { recursive: true, force: true })
    }
  }, 120_000)
})
