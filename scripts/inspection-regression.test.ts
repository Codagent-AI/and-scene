import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (file: string) => readFileSync(resolve(root, file), 'utf8')

test('verification and inspection share the preview lifecycle helper', () => {
  const helper = 'scripts/preview-server.mjs'
  const templateHelper = 'skills/presentation/templates/bootstrap/scripts/preview-server.mjs'

  expect(existsSync(resolve(root, helper))).toBe(true)
  expect(existsSync(resolve(root, templateHelper))).toBe(true)
  expect(read(templateHelper)).toBe(read(helper))

  for (const script of [
    'scripts/inspect-presentation.mjs',
    'scripts/verify.mjs',
    'skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs',
    'skills/presentation/templates/bootstrap/scripts/verify.mjs',
  ]) {
    const source = read(script)
    expect(source).toContain("from './preview-server.mjs'")
    expect(source).not.toContain('function getAvailablePort')
    expect(source).not.toContain('function watchPreview')
    expect(source).not.toContain('function waitForPreview')
  }
})

test('inspection builds fresh assets, rejects unsafe slugs, and retains preview exit state', () => {
  const source = read('scripts/inspect-presentation.mjs')

  expect(source).toContain("await run('npm', ['run', 'build'])")
  expect(source).toContain("if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))")
  expect(source).toContain("previewExited = once(preview, 'exit').catch(() => undefined)")
  expect(source).toContain("if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')")
})

test('verification cleanup waits for the exit event captured at preview startup', () => {
  const source = read('scripts/verify.mjs')

  expect(source).toContain("previewExited = once(preview, 'exit').catch(() => undefined)")
  expect(source).toContain("if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')")
})

test('the narrow layout removes the table of contents instead of overlapping the mode toggle', () => {
  const stylesheet = read('src/presentations/how-to-make-a-presentation/presentation.css')

  expect(stylesheet).toMatch(/\[data-presentation-toc\]\s*\{\s*display:\s*none;/)
})
