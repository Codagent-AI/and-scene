import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HOST, PROJECT_ROOT, freePort, readRegistry } from './project.mjs'

describe('project helpers', () => {
  it('uses the IPv4 loopback address', () => expect(HOST).toBe('127.0.0.1'))

  it('derives the project root from the script location, not the cwd', () => {
    expect(PROJECT_ROOT).toBe(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'))
  })

  it('finds a free loopback port', async () => {
    expect(await freePort()).toBeGreaterThan(0)
  })

  it('reads slug/title pairs from the registry source', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'reg-'))
    await mkdir(path.join(root, 'src/presentations'), { recursive: true })
    await writeFile(
      path.join(root, 'src/presentations/index.ts'),
      "export const P = [\n  {\n    slug: 'one',\n    title: 'First',\n    load: () => import('./one/Talk'),\n  },\n  { slug: \"two\", title: \"Second\", load: () => import('./two/Talk') },\n]\n",
    )
    expect(await readRegistry(root)).toEqual([{ slug: 'one', title: 'First' }, { slug: 'two', title: 'Second' }])
  })
})

describe('loopback-only contract', () => {
  it('never mentions localhost in the verification or inspection scripts', async () => {
    const scripts = path.join(PROJECT_ROOT, 'scripts')
    const files = [
      ...(await readdir(scripts)).filter((f) => f.endsWith('.mjs')).map((f) => path.join(scripts, f)),
      ...(await readdir(path.join(scripts, 'lib'))).filter((f) => f.endsWith('.mjs')).map((f) => path.join(scripts, 'lib', f)),
    ]
    for (const file of files) expect(await readFile(file, 'utf8'), file).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
  })

  it('builds every preview URL from the shared HOST constant', async () => {
    const lib = await readFile(path.join(PROJECT_ROOT, 'scripts/lib/project.mjs'), 'utf8')
    expect(lib).toContain("'--host', HOST")
    expect(lib).toContain('`http://${HOST}:${port}`')
    expect(lib).toContain('fetch(`${url}/`)')
    for (const script of ['verify.mjs', 'inspect-presentation.mjs']) {
      const source = await readFile(path.join(PROJECT_ROOT, 'scripts', script), 'utf8')
      expect(source).toContain('preview.url')
      expect(source).not.toMatch(/https?:\/\/\d/)
    }
  })
})
