import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const expected = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? (await files(absolute)).map(name => `${entry.name}/${name}`) : [entry.name]
  }))).flat().sort()
}

describe('presentation skill bootstrap contract', () => {
  it('keeps the snapshot aligned and proves it builds and renders outside this repository', async () => {
    const skill = await readFile(path.join(root, 'skills/presentation/SKILL.md'), 'utf8')
    const workflow = await readFile(path.join(root, 'skills/presentation/references/workflow.md'), 'utf8')
    expect(skill).toContain('Resolve template paths from this file\'s directory')
    expect(workflow).toContain('`workspaces`')
    expect(workflow).toContain('`pnpm-workspace.yaml`')
    expect(workflow).toContain('or root')
    expect(workflow).toContain('`packages/` or `apps/` exists')
    expect(workflow).toContain('self-contained `presentations/` child app')
    expect(workflow).toContain('wait for explicit confirmation')
    const kit = path.join(root, 'src/presentation-kit')
    const snapshot = path.join(bootstrap, 'src/presentation-kit')
    const kitFiles = (await files(kit)).filter(file => !/\.test\./.test(file))
    expect(await files(snapshot)).toEqual(kitFiles)
    for (const file of kitFiles) expect(await readFile(path.join(snapshot, file))).toEqual(await readFile(path.join(kit, file)))
    for (const file of ['scripts/inspect-presentation.mjs', 'scripts/preview-utils.mjs']) {
      expect(await readFile(path.join(bootstrap, file))).toEqual(await readFile(path.join(root, file)))
    }
    const manifest = JSON.parse(await readFile(path.join(bootstrap, 'package.json'), 'utf8'))
    expect(manifest.scripts.build).toBe('tsc -b && vite build')
    expect(manifest.scripts.verify).toBeTruthy()
    expect(manifest.scripts.inspect).toBeTruthy()
    for (const dependency of expected) expect(manifest.dependencies?.[dependency] ?? manifest.devDependencies?.[dependency]).toBeTruthy()

    const allFiles = [...kitFiles.map(file => path.join(snapshot, file)), ...(await files(bootstrap)).map(file => path.join(bootstrap, file))]
    const text = (await Promise.all(allFiles.map(file => readFile(file, 'utf8').catch(() => '')))).join('\n')
    expect(text).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|font-family\s*:|\b(?:border|box-shadow)\s*:/i)
    expect(JSON.stringify(manifest)).not.toMatch(/tailwind/i)
    expect(await stat(path.join(bootstrap, 'package-lock.json'))).toBeTruthy()

    const temporary = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    const app = path.join(temporary, 'app')
    const cache = path.join(root, 'node_modules/.cache/presentation-bootstrap-npm')
    try {
      await cp(bootstrap, app, { recursive: true })
      const run = (args: string[]) => {
        try { execFileSync('npm', args, { cwd: app, stdio: 'pipe', timeout: 180_000 }) }
        catch (error) {
          const result = error as NodeJS.ErrnoException & { stdout?: Buffer; stderr?: Buffer }
          throw new Error(`npm ${args.join(' ')} failed:\n${result.stdout?.toString()}\n${result.stderr?.toString()}`, { cause: error })
        }
      }
      run(['ci', '--cache', cache])
      run(['run', 'build'])
      run(['run', 'verify'])
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  }, 420_000)
})
