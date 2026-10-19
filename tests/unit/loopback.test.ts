import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) files(full, out)
    else if (/\.mjs$/.test(name)) out.push(full)
  }
  return out
}

describe('I-55 IPv4 loopback in browser drivers', () => {
  const roots = ['scripts', 'skills/presentation/templates/bootstrap/scripts']
  for (const root of roots) {
    for (const file of files(root)) {
      it(`${file} never uses localhost or ::1`, () => {
        const text = readFileSync(file, 'utf8')
        expect(text).not.toMatch(/localhost|::1\b|\[::1\]/)
      })
    }
  }
  for (const script of ['verify.mjs', 'inspect-presentation.mjs']) {
    for (const root of roots) {
      it(`${root}/${script} binds the preview and builds probe and browser URLs from 127.0.0.1`, () => {
        const text = readFileSync(join(root, script), 'utf8')
        expect(text).toMatch(/127\.0\.0\.1/)
        expect(text).toMatch(/--host/)
        expect(text).toMatch(/http:\/\/\$\{[A-Z_a-z]+\}:/)
      })
    }
  }
})
