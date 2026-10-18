import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BOOTSTRAP = path.join(ROOT, 'skills/presentation/templates/bootstrap')

export const isTestFile = (name: string) => /\.test\.[cm]?[jt]sx?$/.test(name)

/** Relative paths (posix) of every file under dir, optionally skipping test files. */
export function listFiles(dir: string, { skipTests = false } = {}): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (!(skipTests && isTestFile(e.name))) out.push(path.relative(dir, full).split(path.sep).join('/'))
    }
  }
  walk(dir)
  return out.sort()
}

export function tmpDir(prefix = 'and-scene-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function write(dir: string, rel: string, content: string) {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

export const read = (...parts: string[]) => fs.readFileSync(path.join(...parts), 'utf8')
