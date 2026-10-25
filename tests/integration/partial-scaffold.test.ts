// INT-001 (partial scaffold): a host whose index.html never boots an app still ends up with a rendering route.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { repoRoot, sh, skillDir, type Result } from '../helpers/materialize.ts'

let dir = ''
let scaffoldOut: Result
let build: Result

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-int001-partial-'))
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'host',
      private: true,
      type: 'module',
      scripts: { build: 'tsc -b && vite build' },
      dependencies: { react: '^19' },
      devDependencies: { vite: '^8', typescript: '~6' },
    }),
  )
  fs.copyFileSync(path.join(skillDir, 'templates/bootstrap/vite.config.ts'), path.join(dir, 'vite.config.ts'))
  // The host's own HTML: a root element and no module script.
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html>\n<html>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>\n')
  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  scaffoldOut = sh(process.execPath, [path.join(skillDir, 'scripts/scaffold.mjs'), '--cwd', dir], os.tmpdir())
  build = sh('npm', ['run', 'build'], dir)
})

afterAll(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

describe('INT-001 partial scaffold with an index.html that has no module entry', () => {
  it('reports that it wired the HTML', () => {
    expect(scaffoldOut.code, scaffoldOut.out).toBe(0)
    expect(scaffoldOut.out).toMatch(/index\.html had no module script/)
  })

  it('builds an entry bundle, so the route has an app to mount', () => {
    expect(build.code, build.out).toBe(0)
    const html = fs.readFileSync(path.join(dir, 'dist/index.html'), 'utf8')
    const entry = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(html)
    expect(entry, html).not.toBeNull()
    expect(fs.existsSync(path.join(dir, 'dist', entry![1]))).toBe(true)
    expect(fs.readFileSync(path.join(dir, 'index.html'), 'utf8')).toContain('<div id="root"></div>')
  })
})
