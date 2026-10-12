import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skillPath = path.join(root, 'skills/presentation/SKILL.md')

describe('presentation skill contract', () => {
  it('declares valid metadata and the required workflow', async () => {
    const skill = await readFile(skillPath, 'utf8')
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatter?.[1]).toMatch(/^name: presentation$/m)
    expect(frontmatter?.[1]).toMatch(/^description: .{20,}$/m)
    for (const phrase of [
      'one question at a time', 'partial details', 'Build setup', 'Scene kit', 'Presentation index',
      'scaffold at the project root', 'self-contained app at `presentations/`',
      'wait for confirmation before writing', "this skill file's directory", 'plain CSS is the default',
      'list the registered presentations', 'npm run build', 'first-step render check',
      'Inspect first, last, and dense or key steps', 'Review overlap, active-chrome, and attribution warnings',
    ]) expect(skill).toContain(phrase)
    const resolvedBootstrap = path.resolve(path.dirname(skillPath), 'templates/bootstrap')
    expect(resolvedBootstrap).toBe(path.join(root, 'skills/presentation/templates/bootstrap'))
  })

  it('keeps the snapshot synchronized with canonical app files', () => {
    execFileSync('node', ['scripts/sync-templates.mjs', '--check'], { cwd: root, stdio: 'pipe' })
  })

  it('has presentation templates for entities, steps, route component, and local CSS', async () => {
    const base = path.join(root, 'skills/presentation/templates/presentation')
    const files = new Set(await readdir(base))
    expect(files.has('steps')).toBe(true)
    for (const file of ['entities.ts', 'Talk.tsx', 'style.css']) await expect(readFile(path.join(base, file), 'utf8')).resolves.toBeTruthy()
    await expect(readFile(path.join(base, 'steps/steps.tsx'), 'utf8')).resolves.toContain('export const steps')
  })
})
