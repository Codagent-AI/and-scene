import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)])
}
it('I-7 keeps all non-test kit files and browser scripts byte-aligned', () => {
  const root = resolve('src/presentation-kit')
  const template = resolve('skills/presentation/templates/bootstrap')
  for (const file of files(root)) expect(readFileSync(resolve(template, 'src/presentation-kit', file.slice(root.length + 1)), 'utf8')).toBe(readFileSync(file, 'utf8'))
  expect(files(resolve(template, 'src/presentation-kit')).length).toBe(files(root).length)
  for (const file of readdirSync('scripts')) expect(readFileSync(resolve(template, 'scripts', file), 'utf8')).toBe(readFileSync(resolve('scripts', file), 'utf8'))
})
it('I-6 and I-20 bootstrap kit contains geometry without visual defaults or frameworks', () => {
  for (const file of files(resolve('src/presentation-kit'))) {
    expect(readFileSync(file, 'utf8')).not.toMatch(/(?:color|background|border|boxShadow|fontFamily|fontSize|padding|gap)\s*:/)
    expect(readFileSync(file, 'utf8')).not.toMatch(/import\s+['"].*\.css/)
  }
  const root = 'skills/presentation/templates/bootstrap'
  expect(readFileSync(`${root}/src/index.css`, 'utf8').trim()).toBe('body { margin: 0; }')
  expect(readFileSync(`${root}/package.json`, 'utf8')).not.toMatch(/tailwind/i)
})
it('I-45 keeps fast test scope separate from browser-backed suites and exposes required commands', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(pkg.scripts.test).toBe('vitest run')
  expect(pkg.scripts['test:integration']).toContain('tests/integration.test.mjs')
  for (const name of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts[name]).toBeTruthy()
  const config = readFileSync('vitest.config.ts', 'utf8')
  expect(config).toContain('tests/**/*.test.{ts,tsx}')
})
