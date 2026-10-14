// @vitest-environment node
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { expect, it, onTestFinished } from 'vitest'

async function fixture() {
  const parent = resolve('.artifacts/sync-templates')
  await mkdir(parent, { recursive: true })
  const dir = await mkdtemp(join(parent, 'fixture-'))
  onTestFinished(() => rm(dir, { recursive: true, force: true }))
  const snapshot = join(dir, 'skills/presentation/templates/bootstrap')
  for (const path of ['scripts', 'src/presentation-kit', 'skills/presentation/templates/bootstrap/src/presentation-kit', 'skills/presentation/templates/bootstrap/scripts']) {
    await mkdir(join(dir, path), { recursive: true })
  }
  await cp('scripts/sync-templates.mjs', join(dir, 'scripts/sync-templates.mjs'))
  await writeFile(join(dir, 'src/presentation-kit/new.ts'), 'canonical kit\n')
  await writeFile(join(dir, 'scripts/browser-preview.mjs'), 'canonical preview helper\n')
  await writeFile(join(dir, 'scripts/verify.mjs'), 'canonical verifier\n')
  await writeFile(join(dir, 'scripts/inspect-presentation.mjs'), 'canonical inspector\n')
  await writeFile(join(snapshot, 'src/presentation-kit/old.ts'), 'previous kit\n')
  await writeFile(join(snapshot, 'scripts/verify.mjs'), 'previous verifier\n')
  await writeFile(join(snapshot, 'scripts/inspect-presentation.mjs'), 'previous inspector\n')
  await writeFile(join(snapshot, 'scripts/stale.mjs'), 'stale driver\n')
  await writeFile(join(snapshot, 'package.json'), '{"private":true}\n')
  return { dir, snapshot }
}

async function run(dir: string, preload?: string) {
  try {
    const result = await promisify(execFile)(process.execPath, [
      ...(preload ? ['--import', preload] : []), join(dir, 'scripts/sync-templates.mjs'),
    ], { cwd: process.cwd() })
    return { code: 0, output: result.stdout + result.stderr }
  } catch (error) {
    const result = error as { code: number; stdout: string; stderr: string }
    return { code: result.code, output: result.stdout + result.stderr }
  }
}

async function preserved(snapshot: string) {
  expect(await readdir(join(snapshot, 'src/presentation-kit'))).toEqual(['old.ts'])
  expect(await readFile(join(snapshot, 'src/presentation-kit/old.ts'), 'utf8')).toBe('previous kit\n')
  expect(await readFile(join(snapshot, 'scripts/verify.mjs'), 'utf8')).toBe('previous verifier\n')
  expect(await readFile(join(snapshot, 'scripts/inspect-presentation.mjs'), 'utf8')).toBe('previous inspector\n')
  expect(await readFile(join(snapshot, 'scripts/stale.mjs'), 'utf8')).toBe('stale driver\n')
  expect(await readdir(snapshot)).toEqual(['package.json', 'scripts', 'src'])
}

it.each(['src/presentation-kit', 'scripts/inspect-presentation.mjs'])('preserves both snapshots when staging fails on missing %s', async missing => {
  const { dir, snapshot } = await fixture()
  await rm(join(dir, missing), { recursive: true })
  const result = await run(dir)
  expect(result.code).not.toBe(0)
  expect(result.output).toContain('FAIL template synchronization')
  await preserved(snapshot)
})

it('restores both snapshots if replacing the driver directory fails after the kit swap', async () => {
  const { dir, snapshot } = await fixture()
  // Inject one OS rename failure at the destination; allow the subsequent restore.
  const preload = join(dir, 'rename-failure.mjs')
  await writeFile(preload, `import fs from 'node:fs';
const rename = fs.promises.rename;
let failed = false;
fs.promises.rename = async (from, to) => {
  if (!failed && String(to) === ${JSON.stringify(join(snapshot, 'scripts'))}) {
    failed = true;
    throw new Error('injected driver swap failure');
  }
  return rename(from, to);
};\n`)
  const result = await run(dir, preload)
  expect(result.code).not.toBe(0)
  expect(result.output).toContain('injected driver swap failure')
  await preserved(snapshot)
})

it('replaces the complete managed snapshots, removes stale files, and preserves other bootstrap files', async () => {
  const { dir, snapshot } = await fixture()
  const result = await run(dir)
  expect(result.code, result.output).toBe(0)
  expect(await readdir(join(snapshot, 'src/presentation-kit'))).toEqual(['new.ts'])
  expect(await readFile(join(snapshot, 'src/presentation-kit/new.ts'), 'utf8')).toBe('canonical kit\n')
  expect(await readdir(join(snapshot, 'scripts'))).toEqual(['browser-preview.mjs', 'inspect-presentation.mjs', 'verify.mjs'])
  expect(await readFile(join(snapshot, 'scripts/verify.mjs'), 'utf8')).toBe('canonical verifier\n')
  expect(await readFile(join(snapshot, 'scripts/inspect-presentation.mjs'), 'utf8')).toBe('canonical inspector\n')
  expect(await readFile(join(snapshot, 'package.json'), 'utf8')).toBe('{"private":true}\n')
  expect(await readdir(snapshot)).toEqual(['package.json', 'scripts', 'src'])
})
