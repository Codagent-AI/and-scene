import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)])
}
it('kit owns behavior and geometry, with no CSS or styling framework', () => {
  const kit = files('src/presentation-kit')
  expect(kit.length).toBeGreaterThan(10)
  for (const file of kit) {
    expect(file).not.toMatch(/\.css$/)
    if (!/\.tsx?$/.test(file)) continue
    const source = readFileSync(file, 'utf8')
    expect(source).not.toMatch(/tailwind|styled-components|@emotion|bootstrap/i)
    expect(source).not.toMatch(/\b(?:color|background\w*|font\w*|border\w*|boxShadow|textShadow|padding\w*|margin\w*|gap)\s*:/)
    expect(source).not.toMatch(/className\s*=\s*["'][^"']+["']/)
  }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ')).not.toMatch(/tailwind|bootstrap|@emotion|styled-components/)
})

it('keeps every bootstrap kit file byte-aligned with the canonical source', () => {
  const root = resolve('src/presentation-kit')
  const snapshot = resolve('skills/presentation/templates/bootstrap/src/presentation-kit')
  const canonicalFiles = files(root).map(file => file.slice(root.length + 1)).sort()
  const snapshotFiles = files(snapshot).map(file => file.slice(snapshot.length + 1)).sort()
  expect(snapshotFiles).toEqual(canonicalFiles)
  for (const file of canonicalFiles) expect(readFileSync(resolve(snapshot, file), 'utf8')).toBe(readFileSync(resolve(root, file), 'utf8'))
})
