// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bootstrapSource, materializeBootstrap } from '../skills/presentation/materialize-bootstrap.mjs'

const temporary = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('bootstrap materialization', () => {
  it('resolves the bootstrap relative to its own module, not process cwd', () => {
    expect(bootstrapSource).toBe(join(dirname(fileURLToPath(import.meta.url)), '../skills/presentation/templates/bootstrap/'))
  })

  it('refuses a non-empty destination without changing existing files', async () => {
    const destination = await mkdtemp(join(tmpdir(), 'and-scene-preserve-'))
    temporary.push(destination)
    await writeFile(join(destination, 'existing.txt'), 'preserve me')
    await expect(materializeBootstrap(destination)).rejects.toThrow('Refusing to overwrite non-empty scaffold target')
    expect(await readFile(join(destination, 'existing.txt'), 'utf8')).toBe('preserve me')
  })
})

it('copies bootstrap entries into an existing empty target and preserves them on repeat', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'and-scene-empty-'))
  temporary.push(destination)
  await materializeBootstrap(destination)
  const manifest = await readFile(join(destination, 'package.json'), 'utf8')
  expect(JSON.parse(manifest).scripts.build).toBeTruthy()
  await expect(materializeBootstrap(destination)).rejects.toThrow('Refusing to overwrite')
  expect(await readFile(join(destination, 'package.json'), 'utf8')).toBe(manifest)
})
