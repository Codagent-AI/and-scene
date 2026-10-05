import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const skillDir = path.join(repository, 'skills/presentation')
const bootstrap = path.join(skillDir, 'templates/bootstrap')
const tempRoot = mkdtempSync(path.join(tmpdir(), 'and-scene-bootstrap-'))
const materialized = path.join(tempRoot, 'fresh-app')

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name)
    return statSync(full).isDirectory() ? filesUnder(full).map((file) => path.join(name, file)) : [name]
  })
}

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, { cwd, stdio: 'pipe', timeout: 180_000, env: { ...process.env, CI: '1' } })
}

beforeAll(() => {
  cpSync(bootstrap, materialized, { recursive: true })
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], materialized)
}, 240_000)

afterAll(() => rmSync(tempRoot, { recursive: true, force: true }))

describe('distributable presentation bootstrap (INT-001)', () => {
  it('materializes a buildable app with all three contract anchors and required dependency declarations', () => {
    const pkg = JSON.parse(readFileSync(path.join(materialized, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string>
    }
    expect(pkg.scripts.build).toBeTruthy()
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.scripts.inspect).toBeTruthy()
    expect(readFileSync(path.join(materialized, 'src/presentation-kit/types.ts'), 'utf8')).toMatch(/interface Step/)
    expect(readFileSync(path.join(materialized, 'src/presentation-kit/Stage.tsx'), 'utf8')).toMatch(/AnimatePresence/)
    expect(readFileSync(path.join(materialized, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toMatch(/Footer|Toc|Header/)
    expect(readFileSync(path.join(materialized, 'src/presentation-kit/useFitScale.ts'), 'utf8')).toMatch(/ResizeObserver/)
    expect(readFileSync(path.join(materialized, 'src/presentations/index.ts'), 'utf8')).toMatch(/slug: 'example'/)
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', '@playwright/test']) {
      expect(pkg.devDependencies[name], `${name} must be declared`).toBeTruthy()
    }
    expect(pkg.devDependencies.tailwindcss).toBeUndefined()
  })

  it('builds and smoke-renders the registered example route from outside the source repository', () => {
    run('npm', ['run', 'build'], materialized)
    const verify = path.join(materialized, 'scripts/verify.mjs')
    run(process.execPath, [verify], tempRoot)
  }, 240_000)

  it('keeps the bootstrap scene kit byte-aligned with canonical non-test files', () => {
    const canonical = path.join(repository, 'src/presentation-kit')
    const snapshot = path.join(bootstrap, 'src/presentation-kit')
    const canonicalFiles = filesUnder(canonical).filter((file) => !file.startsWith('__tests__/')).sort()
    const snapshotFiles = filesUnder(snapshot).sort()
    expect(snapshotFiles).toEqual(canonicalFiles)
    for (const relative of canonicalFiles) {
      expect(readFileSync(path.join(snapshot, relative)), relative).toEqual(readFileSync(path.join(canonical, relative)))
    }
  })

  it('resolves templates from the skill directory and keeps visual defaults outside the reusable kit', () => {
    const skill = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8')
    expect(skill).toMatch(/directory containing this\s+`SKILL\.md`/)
    expect(skill).toMatch(/templates\/` next to this file/)
    const kitCss = readFileSync(path.join(bootstrap, 'src/presentation-kit/presentation-kit.css'), 'utf8')
    expect(kitCss).toMatch(/Geometry only/)
    expect(kitCss).not.toMatch(/#[\da-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]+\s*:/i)
    for (const file of filesUnder(path.join(bootstrap, 'src/presentation-kit'))) {
      const text = readFileSync(path.join(bootstrap, 'src/presentation-kit', file), 'utf8')
      expect(text, file).not.toMatch(/tailwind|bg-[a-z]+-\d{2,3}|text-[a-z]+-\d{2,3}/i)
    }
    const packageJson = JSON.parse(readFileSync(path.join(bootstrap, 'package.json'), 'utf8')) as { devDependencies: Record<string, string> }
    expect(packageJson.devDependencies.tailwindcss).toBeUndefined()
    expect(readFileSync(path.join(bootstrap, 'src/index.css'), 'utf8')).not.toMatch(/#[\da-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]+\s*:/i)
  })
})
