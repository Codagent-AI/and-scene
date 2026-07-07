import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = dirname(fileURLToPath(import.meta.url))

describe('presentation skill structure', () => {
  it('has bootstrap template with three contract anchors', () => {
    const bootstrap = join(SKILL_DIR, 'templates/bootstrap')
    expect(existsSync(join(bootstrap, 'package.json'))).toBe(true)
    expect(existsSync(join(bootstrap, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(bootstrap, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(join(bootstrap, 'src/presentations/index.ts'))).toBe(true)
    expect(existsSync(join(bootstrap, 'src/main.tsx'))).toBe(true)
  })

  it('bootstrap package.json includes required dependency set', () => {
    const pkg = JSON.parse(
      readFileSync(join(SKILL_DIR, 'templates/bootstrap/package.json'), 'utf-8'),
    )
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) {
      expect(pkg.dependencies?.[dep] ?? pkg.devDependencies?.[dep]).toBeDefined()
    }
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', 'playwright']) {
      expect(pkg.devDependencies?.[dep]).toBeDefined()
    }
    expect(pkg.scripts?.build).toBeDefined()
  })

  it('has presentation template with entities, steps, and Talk.tsx', () => {
    const tmpl = join(SKILL_DIR, 'templates/presentation')
    expect(existsSync(join(tmpl, 'entities.ts'))).toBe(true)
    expect(existsSync(join(tmpl, 'Talk.tsx'))).toBe(true)
    const steps = readdirSync(join(tmpl, 'steps'))
    expect(steps.some((f: string) => f.endsWith('.tsx'))).toBe(true)
  })

  it('has single-step template', () => {
    expect(existsSync(join(SKILL_DIR, 'templates/single-step/step.tsx'))).toBe(true)
  })
})
