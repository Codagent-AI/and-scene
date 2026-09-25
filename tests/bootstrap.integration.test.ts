import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = resolve(import.meta.dirname, '..')
const template = join(repo, 'skills/presentation/templates/bootstrap')
const kitRoot = join(repo, 'src/presentation-kit')
const ignored = new Set(['node_modules', '.DS_Store'])

function filesUnder(root: string, relative = ''): string[] {
  return readdirSync(join(root, relative), { withFileTypes: true })
    .filter((entry) => !ignored.has(entry.name) && !entry.name.endsWith('.test.tsx'))
    .flatMap((entry) => {
      const path = join(relative, entry.name)
      return entry.isDirectory() ? filesUnder(root, path) : [path]
    }).sort()
}

describe('presentation bootstrap integration', () => {
  it('materializes outside the repository, builds, and keeps the kit in parity', () => {
    expect(statSync(template).isDirectory()).toBe(true)
    const temp = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temp, 'materialized app')
    try {
      execFileSync('cp', ['-R', `${template}/.`, app])
      execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: app, stdio: 'inherit' })
      execFileSync('npm', ['run', 'build'], { cwd: app, stdio: 'inherit' })
      execFileSync('npm', ['run', 'lint'], { cwd: app, stdio: 'inherit' })

      const canonical = filesUnder(kitRoot)
      expect(filesUnder(join(app, 'src/presentation-kit'))).toEqual(canonical)
      let kitSource = ''
      for (const path of canonical) {
        const source = readFileSync(join(kitRoot, path), 'utf8')
        expect(readFileSync(join(app, 'src/presentation-kit', path), 'utf8')).toBe(source)
        kitSource += source
      }
      expect(kitSource).not.toMatch(/(?:color|fontFamily|fontSize|padding|margin|border(?:Color|Width|Radius)?|boxShadow|backgroundColor)\s*:/i)

      const packageJson = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(packageJson.dependencies[dependency]).toBeTruthy()
      for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(packageJson.devDependencies[dependency]).toBeTruthy()
      expect(JSON.stringify(packageJson)).not.toMatch(/tailwind/i)
      expect(readFileSync(join(app, 'src/index.css'), 'utf8')).not.toMatch(/--(color|font|space|radius|shadow)|#[0-9a-f]{3,8}\b/i)
      const starterCss = readFileSync(join(app, 'src/presentations/starter/presentation.css'), 'utf8')
      expect(starterCss).toContain('[data-presentation-active="true"]')
      expect(starterCss).toContain('.presentation-attribution')
      expect(readFileSync(join(app, 'scripts/verify.mjs'), 'utf8')).toContain('127.0.0.1')
      expect(readFileSync(join(app, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain('data-presentation-allow-overlap')
      expect(readFileSync(join(repo, 'skills/presentation/SKILL.md'), 'utf8')).toMatch(/relative to that directory, never the agent's current working directory/)
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 120_000)
})
