import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SKILL_DIR = import.meta.dirname

function readSkillMd(): string {
  return readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf-8')
}

describe('presentation skill structure', () => {
  it('has SKILL.md with interactive gathering procedure', () => {
    const content = readSkillMd()
    expect(content).toMatch(/one question at a time/i)
    expect(content).toMatch(/topic/i)
    expect(content).toMatch(/visual style/i)
    expect(content).toMatch(/partial detail/i)
    expect(content).toMatch(/ASCII/i)
  })

  it('has SKILL.md with scaffold and monorepo target resolution', () => {
    const content = readSkillMd()
    expect(content).toMatch(/contract anchor/i)
    expect(content).toMatch(/monorepo/i)
    expect(content).toMatch(/presentations\//i)
    expect(content).toMatch(/install/i)
  })

  it('has SKILL.md with create and modify flows', () => {
    const content = readSkillMd()
    expect(content).toMatch(/src\/presentations\/<slug>/i)
    expect(content).toMatch(/index\.ts/i)
    expect(content).toMatch(/modify/i)
    expect(content).toMatch(/lists? the existing presentations/i)
  })

  it('has SKILL.md with self-verify procedure', () => {
    const content = readSkillMd()
    expect(content).toMatch(/npm run verify/i)
    expect(content).toMatch(/build/i)
    expect(content).toMatch(/render/i)
    expect(content).toMatch(/fix/i)
  })

  it('has SKILL.md describing scene kit composition', () => {
    const content = readSkillMd()
    expect(content).toMatch(/Box/i)
    expect(content).toMatch(/layoutId/i)
    expect(content).toMatch(/SceneLayer/i)
    expect(content).toMatch(/entities\.ts/i)
  })

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
    expect(steps.some((f) => f.endsWith('.tsx'))).toBe(true)
  })

  it('has single-step template', () => {
    expect(existsSync(join(SKILL_DIR, 'templates/single-step/step.tsx'))).toBe(true)
  })
})
