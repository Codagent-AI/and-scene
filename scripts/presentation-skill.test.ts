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
    expect(frontmatter?.[1]).toMatch(/^description: Creates .*\. Use when the user /m)
    const description = frontmatter?.[1].match(/^description: (.*)$/m)?.[1] ?? ''
    expect(description).toMatch(/Use when.*presentation.*slide deck.*talk.*slides.*scenes/i)
    for (const phrase of [
      'one question at a time', 'partial details', 'Build setup', 'Scene kit', 'Presentation index',
      'scaffold at the project root', 'self-contained app at `presentations/`',
      'wait for confirmation before writing', "this skill file's directory", 'plain CSS is the default',
      'list the registered presentations', 'npm run build', 'first-step render check',
      'Inspect first, last, and dense or key steps', 'Review overlap, active-chrome, and attribution warnings',
      'entities.ts', '`id`, `era`, `title`, `caption`, `Scene`, and `payload`',
      '## Out of scope', 'templates/bootstrap/package.json',
      'If the user chooses to proceed with partial details', 'use `--narrow` where the presentation is responsive-sensitive',
      'If all anchors exist, use the app without scaffolding.',
      'templates/bootstrap/package.json` as the sole authoritative list',
      'For a fresh app, copy the template', 'For an existing app, preserve its manifest',
      'Install dependencies: use `npm ci`', 'Add Vitest and its test dependencies only when adopting the shipped tests.',
      'Do not add Tailwind or another style framework',
      'Presentation: <title> (route: /<slug>)', 'Checks: build <pass/fail>, verify <pass/fail>, inspect <pass/fail/not run (reason)>',
      'offer to build the browser-based React version instead',
      'Decline direct edits to presentations that do not use the scene-kit contract',
      'offer to convert or recreate them as a scene-kit presentation',
    ]) expect(skill).toContain(phrase)
    expect(skill.match(/wait for confirmation before writing/g)).toHaveLength(1)
    expect(skill).not.toContain('the required runtime dependencies are')
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
