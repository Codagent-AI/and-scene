import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, existsSync, cpSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

describe('INT-001 materialized presentation bootstrap', () => {
  it('builds from an unrelated working directory with complete anchors and a style-neutral kit', () => {
    const temp = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temp, 'app')
    const caller = join(temp, 'caller')
    expect(readFileSync(join(root, 'skills/presentation/SKILL.md'), 'utf8')).toContain('materialize-bootstrap.mjs')
    try {
      mkdirSync(caller)
      execFileSync(process.execPath, [join(root, 'skills/presentation/materialize-bootstrap.mjs'), app], { cwd: caller, stdio: 'pipe' })
      const generated = join(app, 'src/presentations/template-example')
      cpSync(join(root, 'skills/presentation/templates/presentation'), generated, { recursive: true })
      cpSync(join(root, 'skills/presentation/templates/step/step.ts'), join(generated, 'steps/step.ts'))
      cpSync(join(root, 'skills/presentation/templates/step/Scene.tsx'), join(generated, 'steps/Scene.tsx'))
      const registry = join(app, 'src/presentations/index.ts')
      writeFileSync(registry, readFileSync(registry, 'utf8').replace("  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },", "  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },\n  { slug: 'template-example', title: 'Template example', load: () => import('./template-example/Talk') },"))
      const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string>; scripts: Record<string, string> }
      for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
      for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
      expect(pkg.scripts.build).toBeTruthy()
      expect(pkg.scripts.verify).toBeTruthy()
      expect(pkg.scripts.inspect).toBeTruthy()
      for (const anchor of ['vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts']) expect(existsSync(join(app, anchor))).toBe(true)
      for (const file of readdirSync(join(root, 'src/presentation-kit')).filter((name) => !name.endsWith('.test.tsx'))) {
        expect(readFileSync(join(app, 'src/presentation-kit', file), 'utf8')).toBe(readFileSync(join(root, 'src/presentation-kit', file), 'utf8'))
      }
      const kit = readdirSync(join(app, 'src/presentation-kit')).filter((name) => !name.endsWith('.test.tsx')).map((name) => readFileSync(join(app, 'src/presentation-kit', name), 'utf8')).join('\n')
      expect(kit).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|box-shadow|font-family/i)
      execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: app, stdio: 'pipe' })
      execFileSync('npm', ['run', 'build', '--prefix', app], { cwd: caller, stdio: 'pipe' })
      execFileSync('npm', ['run', 'lint', '--prefix', app], { cwd: caller, stdio: 'inherit' })
      execFileSync('npm', ['run', 'verify', '--prefix', app], { cwd: caller, stdio: 'pipe' })
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 180_000)
})
