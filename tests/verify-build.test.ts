import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocked = vi.hoisted(() => ({ spawn: vi.fn(), preview: vi.fn() }))
vi.mock('node:child_process', () => ({ spawnSync: mocked.spawn }))
vi.mock('../scripts/browser.mjs', () => ({ withPreview: mocked.preview, visitSteps: vi.fn(), watchErrors: vi.fn() }))
// @ts-expect-error Shared CLI module is JavaScript.
import { verify } from '../scripts/verify.mjs'
beforeEach(() => {
  mocked.spawn.mockReset()
  mocked.preview.mockReset().mockResolvedValue(undefined)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
it('R1 build output inherits streams instead of using the bounded spawnSync buffer', async () => {
  mocked.spawn.mockReturnValue({ status: 0, signal: null })
  await verify({ cwd: '/project' })
  expect(mocked.spawn).toHaveBeenCalledWith('npm', ['run', 'build'], { cwd: '/project', stdio: 'inherit' })
  expect(mocked.preview).toHaveBeenCalledOnce()
})
it.each(['ENOENT', 'ENOBUFS'])('R1 reports spawn error %s without entering browser verification', async code => {
  const error = new Error(`spawnSync npm ${code}`)
  mocked.spawn.mockReturnValue({ status: null, error, signal: null })
  await expect(verify()).rejects.toThrow(`build: npm run build failed (spawnSync npm ${code})`)
  expect(mocked.preview).not.toHaveBeenCalled()
})
it('R1 reports child termination signal', async () => {
  mocked.spawn.mockReturnValue({ status: null, signal: 'SIGTERM' })
  await expect(verify()).rejects.toThrow('build: npm run build failed (SIGTERM)')
  expect(mocked.preview).not.toHaveBeenCalled()
})
it('R1 reports nonzero build exit status', async () => {
  mocked.spawn.mockReturnValue({ status: 2, signal: null })
  await expect(verify()).rejects.toThrow('build: npm run build failed (exit 2)')
  expect(mocked.preview).not.toHaveBeenCalled()
})
