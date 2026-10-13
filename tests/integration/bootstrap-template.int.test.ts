import { expect, it } from 'vitest'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const template = path.join(repo, 'skills/presentation/templates/bootstrap')

function run(cwd: string, args: string[]) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.once('error', reject)
    child.once('exit', code => resolve({ code, output }))
  })
}

it('installs and verifies a materialized bootstrap from outside the repository', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
  const project = path.join(temp, 'materialized-app')
  try {
    await cp(template, project, { recursive: true })
    expect(await readFile(path.join(template, 'package-lock.json'), 'utf8')).toContain('and-scene-presentation')
    const install = await run(project, ['ci', '--no-audit', '--no-fund'])
    expect(install.code, install.output).toBe(0)
    const pkg = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(pkg.scripts.build).toBeTruthy()
    const build = await run(project, ['run', 'build'])
    expect(build.code, build.output).toBe(0)
    const verify = await run(project, ['run', 'verify'])
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toContain('browser route http://127.0.0.1:')
    expect(verify.output).toContain('PASS [verify]')
    for (const anchor of ['vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts']) {
      await expect(readFile(path.join(project, anchor), 'utf8')).resolves.toBeTruthy()
    }
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}, 180_000)
