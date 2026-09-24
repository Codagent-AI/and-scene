import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const copyHelper = join(root, 'skills/presentation/scripts/copy-template.mjs')

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

describe('presentation bootstrap template (INT-001)', () => {
  it('materializes outside the repository, builds, has contract anchors and dependencies, and matches the canonical style-neutral kit', () => {
    const materialized = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      execFileSync(process.execPath, [copyHelper, 'bootstrap', materialized], { cwd: tmpdir(), stdio: 'pipe' })
      const pkg = JSON.parse(readFileSync(join(materialized, 'package.json'), 'utf8')) as {
        dependencies: Record<string, string>; devDependencies: Record<string, string>
      }
      for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
      for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
      expect(statSync(join(materialized, 'src/presentation-kit/types.ts')).isFile()).toBe(true)
      expect(statSync(join(materialized, 'src/presentation-kit/Presentation.tsx')).isFile()).toBe(true)
      expect(statSync(join(materialized, 'src/presentations/index.ts')).isFile()).toBe(true)
      expect(statSync(join(materialized, 'scripts/verify.mjs')).isFile()).toBe(true)
      expect(statSync(join(materialized, 'scripts/inspect-presentation.mjs')).isFile()).toBe(true)
      expect(readFileSync(join(materialized, 'src/main.tsx'), 'utf8')).toContain('Router')

      const canonical = filesUnder(join(root, 'src/presentation-kit')).filter((path) => !path.endsWith('.test.tsx') && !path.endsWith('.test.ts'))
      const templated = filesUnder(join(materialized, 'src/presentation-kit'))
      expect(templated.map((path) => relative(join(materialized, 'src/presentation-kit'), path)).sort()).toEqual(
        canonical.map((path) => relative(join(root, 'src/presentation-kit'), path)).sort(),
      )
      for (const path of canonical) {
        const templatePath = join(materialized, 'src/presentation-kit', relative(join(root, 'src/presentation-kit'), path))
        expect(readFileSync(templatePath)).toEqual(readFileSync(path))
      }

      const kitStyles = filesUnder(join(materialized, 'src/presentation-kit')).filter((path) => path.endsWith('.css'))
      expect(kitStyles).toHaveLength(0)
      expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
      const hostStyles = readFileSync(join(materialized, 'src/index.css'), 'utf8')
      expect(hostStyles).not.toMatch(/@theme|--(?:color|font|space|shadow)-/i)
      expect(hostStyles).not.toMatch(/(?:^|[;\n])\s*(?:background|color|font-family|box-shadow|border)\s*:/m)

      const starterDirectory = join(materialized, 'src/presentations/starter')
      execFileSync(process.execPath, [copyHelper, 'presentation', starterDirectory], { cwd: tmpdir(), stdio: 'pipe' })
      const registryPath = join(materialized, 'src/presentations/index.ts')
      const registry = readFileSync(registryPath, 'utf8').replace(/\]\s*$/, "  { slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') },\n]")
      writeFileSync(registryPath, registry)

      execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: materialized, stdio: 'pipe' })
      execFileSync('npm', ['run', 'lint'], { cwd: materialized, stdio: 'pipe' })
      execFileSync('npm', ['run', 'verify'], { cwd: materialized, stdio: 'pipe' })
      execFileSync('npm', ['run', 'inspect', '--', 'example'], { cwd: materialized, stdio: 'pipe' })
      expect(statSync(join(materialized, 'artifacts/inspection/example-01.png')).isFile()).toBe(true)

      writeFileSync(registryPath, readFileSync(registryPath, 'utf8').replace(/\]\s*$/, "  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk') },\n]"))
      mkdirSync(join(materialized, 'src/presentations/broken'), { recursive: true })
      writeFileSync(join(materialized, 'src/presentations/broken/Talk.tsx'), "export default function Broken(): import('react').ReactNode { throw new Error('intentional verification fault') }\n")
      expect(() => execFileSync('npm', ['run', 'verify'], { cwd: materialized, stdio: 'pipe' })).toThrow('No presentation rendered at http://127.0.0.1:4178/broken')
    } finally {
      rmSync(materialized, { recursive: true, force: true })
    }
  }, 240_000)
})
