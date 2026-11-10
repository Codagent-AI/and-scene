import { cp, mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'
const run = promisify(execFile)
test('materialized bootstrap installs, builds and renders outside the source tree', async () => {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    await cp(resolve('skills/presentation/templates/bootstrap'), target, { recursive: true })
    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(manifest.dependencies[name]).toBeTruthy()
    for (const name of ['vite', 'typescript', '@vitejs/plugin-react', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(manifest.devDependencies[name]).toBeTruthy()
    expect(JSON.stringify(manifest)).not.toMatch(/tailwind/i)
    await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: target })
    await run('npm', ['run', 'lint'], { cwd: target })
    const result = await run('npm', ['run', 'verify'], { cwd: target })
    expect(result.stdout).toContain('PASS rendered presentation example')
  } finally { await rm(target, { recursive: true, force: true }) }
}, 180000)
