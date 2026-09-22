import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = join(repo, 'skills/presentation/templates/bootstrap')
const kit = join(repo, 'src/presentation-kit')
const read = (path: string) => readFileSync(path, 'utf8')

describe('distributable bootstrap (INT-001)', () => {
  it('materializes, builds, and verifies independently of the caller directory', () => {
    const temp = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      cpSync(bootstrap, temp, { recursive: true })
      const pkg = JSON.parse(read(join(temp, 'package.json')))
      expect(pkg.dependencies).toMatchObject({ react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String) })
      expect(pkg.devDependencies).toMatchObject({ vite: expect.any(String), '@vitejs/plugin-react': expect.any(String), typescript: expect.any(String), playwright: expect.any(String), eslint: expect.any(String), '@types/node': expect.any(String), '@types/react': expect.any(String), '@types/react-dom': expect.any(String) })
      expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
      const files = (dir: string, base = dir): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        return entry.isDirectory() ? files(path, base) : entry.name.endsWith('.test.tsx') ? [] : [path.slice(base.length + 1)]
      }).sort()
      expect(files(join(temp, 'src/presentation-kit'))).toEqual(files(kit))
      for (const name of files(kit)) expect(read(join(temp, 'src/presentation-kit', name))).toBe(read(join(kit, name)))
      expect(() => read(join(temp, 'package-lock.json'))).not.toThrow()
      execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: temp, stdio: 'pipe' })
      expect(read(join(temp, 'package.json'))).not.toMatch(/tailwind/i)
      expect(read(join(temp, 'src/index.css'))).not.toMatch(/#[\da-f]{3,8}|font-family|--[\w-]+\s*:/i)
      execFileSync('npm', ['run', 'lint'], { cwd: temp, stdio: 'pipe' })
      const invokedOutside = execFileSync('node', [join(temp, 'scripts/verify.mjs')], { cwd: tmpdir(), encoding: 'utf8', stdio: 'pipe' })
      expect(invokedOutside).toMatch(/PASS/i)
      execFileSync('npm', ['run', 'inspect', '--', 'starter'], { cwd: temp, stdio: 'pipe' })
      expect(readdirSync(join(temp, 'artifacts/presentations/starter'))).toContain('step-01.png')
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 120000)
})
