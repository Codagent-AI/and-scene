import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocked = vi.hoisted(() => ({ mkdir: vi.fn(), writeFile: vi.fn(), preview: vi.fn() }))
vi.mock('node:fs/promises', () => ({ mkdir: mocked.mkdir, writeFile: mocked.writeFile }))
vi.mock('../scripts/browser.mjs', () => ({ withPreview: mocked.preview, visitSteps: vi.fn(), watchErrors: vi.fn(), SETTLE_MS: 850 }))
// @ts-expect-error Shared CLI module is JavaScript.
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'
beforeEach(() => {
  mocked.mkdir.mockReset().mockResolvedValue(undefined)
  mocked.writeFile.mockReset().mockResolvedValue(undefined)
  mocked.preview.mockReset().mockResolvedValue(undefined)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
it.each([
  [NaN, 900], [1440, NaN], [0, 900], [1440, 0], [-1, 900], [1440, -1],
  [390.5, 844], [390, 844.5], [Infinity, 844], [390, Infinity],
])('R2 rejects invalid viewport %s x %s before filesystem or browser effects', async (width, height) => {
  await expect(inspectPresentation('example', { viewport: { width, height } })).rejects.toThrow('inspection: viewport must be positive integers')
  expect(mocked.mkdir).not.toHaveBeenCalled()
  expect(mocked.writeFile).not.toHaveBeenCalled()
  expect(mocked.preview).not.toHaveBeenCalled()
})
it('R2 accepts positive integer dimensions and forwards them to browser setup', async () => {
  const viewport = { width: 390, height: 844 }
  await inspectPresentation('example', { cwd: '/project', viewport })
  expect(mocked.mkdir).toHaveBeenCalledWith('/project/artifacts/inspection/example/390x844', { recursive: true })
  expect(mocked.preview).toHaveBeenCalledWith(expect.any(Function), { cwd: '/project', viewport })
})
