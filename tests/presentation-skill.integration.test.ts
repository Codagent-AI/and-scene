import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const run = promisify(execFile)
const root = join(import.meta.dirname, '..')
const bootstrap = join(root, 'skills/presentation/templates/bootstrap')

describe('presentation bootstrap integration contract', () => {
  it('materializes a buildable style-neutral app with canonical kit parity', async () => {
    const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      await cp(bootstrap, target, { recursive: true })
      const packageJson = JSON.parse(await readFile(join(target, 'package.json'), 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> }
      expect(packageJson.scripts.build).toBeTruthy()
      expect(packageJson.scripts.lint).toBeTruthy()
      expect(packageJson.dependencies).toEqual(expect.objectContaining({ react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String) }))
      expect(packageJson.devDependencies).toEqual(expect.objectContaining({ vite: expect.any(String), typescript: expect.any(String), eslint: expect.any(String), playwright: expect.any(String) }))
      expect(await readFile(join(target, 'src/presentation-kit/types.ts'), 'utf8')).toBe(await readFile(join(root, 'src/presentation-kit/types.ts'), 'utf8'))
      expect(await readFile(join(target, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toBe(await readFile(join(root, 'src/presentation-kit/Presentation.tsx'), 'utf8'))
      expect(await readFile(join(target, 'src/index.css'), 'utf8')).not.toMatch(/#[0-9a-f]{3,8}|font-family|box-shadow|border:/i)
      expect(await readFile(join(target, 'src/index.css'), 'utf8')).not.toMatch(/tailwind/i)
      await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: target, timeout: 180_000 })
      await run('npm', ['run', 'build'], { cwd: target, timeout: 180_000 })
    } finally {
      await rm(target, { recursive: true, force: true })
    }
  }, 240_000)

  it('resolves the screenshot helper from its own project path', async () => {
    const helper = await readFile(join(bootstrap, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(helper).toContain("new URL('../package.json', import.meta.url)")
    expect(helper).toContain('127.0.0.1')
  })

  it('ships a screenshot helper that owns its preview and captures every step', async () => {
    const helper = await readFile(join(bootstrap, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(helper).toContain("['run', 'build']")
    expect(helper).toContain('waitForPreview(preview, previewMonitor.failure)')
    expect(helper).toContain('await terminatePreview(preview)')
    expect(helper).toContain("getAttribute('data-step-count')")
    expect(helper).toContain('page.waitForTimeout(700)')
    expect(helper).toContain('${slug}-${index}.png')
    expect(await readFile(join(bootstrap, 'scripts/diagnose.mjs'), 'utf8')).toBe(await readFile(join(root, 'scripts/diagnose.mjs'), 'utf8'))
  })
})
