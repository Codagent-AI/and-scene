import { beforeEach, expect, it, vi } from 'vitest'
const mocked = vi.hoisted(() => ({ cp: vi.fn(), mkdir: vi.fn(), rm: vi.fn(), readFile: vi.fn(), writeFile: vi.fn() }))
vi.mock('node:fs/promises', () => mocked)
const destination = new URL('../skills/presentation/templates/bootstrap/', import.meta.url)
const owned = ['src/presentation-kit/', 'scripts/', 'tests/']
const files = new Set<string>()
beforeEach(() => {
  vi.resetModules()
  files.clear()
  for (const folder of owned) files.add(new URL(folder + 'deleted-file', destination).href)
  files.add(new URL('src/presentations/example/Talk.tsx', destination).href)
  mocked.mkdir.mockReset().mockResolvedValue(undefined)
  mocked.cp.mockReset().mockImplementation(async (_source: URL, target: URL) => {
    files.add(target.href.endsWith('/src/presentation-kit/') ? new URL('Renamed.ts', target).href : target.href)
  })
  mocked.rm.mockReset().mockImplementation(async (target: URL) => {
    for (const file of files) if (file.startsWith(target.href)) files.delete(file)
  })
  mocked.readFile.mockReset().mockResolvedValue(JSON.stringify({ scripts: { build: 'tsc -b && vite build' } }))
  mocked.writeFile.mockReset().mockResolvedValue(undefined)
})
it('R4 replaces owned release snapshots before copying and preserves application templates', async () => {
  // @ts-expect-error Synchronizer is a JavaScript entry point.
  await import('../scripts/sync-templates.mjs')
  expect(mocked.rm).toHaveBeenCalledTimes(3)
  for (const folder of owned) {
    const target = new URL(folder, destination)
    expect(mocked.rm).toHaveBeenCalledWith(target, { recursive: true, force: true })
    expect(files.has(new URL(folder + 'deleted-file', destination).href)).toBe(false)
    const removeIndex = mocked.rm.mock.calls.findIndex(([url]) => url.href === target.href)
    const copyIndex = mocked.cp.mock.calls.findIndex(([, url]) => url.href.startsWith(target.href))
    expect(copyIndex).toBeGreaterThanOrEqual(0)
    expect(mocked.rm.mock.invocationCallOrder[removeIndex]).toBeLessThan(mocked.cp.mock.invocationCallOrder[copyIndex])
  }
  expect(files.has(new URL('src/presentation-kit/Renamed.ts', destination).href)).toBe(true)
  expect(files.has(new URL('src/presentations/example/Talk.tsx', destination).href)).toBe(true)
})
it('R4 propagates reset errors instead of reporting a stale snapshot as synced', async () => {
  mocked.rm.mockRejectedValueOnce(new Error('snapshot reset denied'))
  // @ts-expect-error Synchronizer is a JavaScript entry point.
  await expect(import('../scripts/sync-templates.mjs')).rejects.toThrow('snapshot reset denied')
  expect(mocked.cp.mock.calls.some(([, url]) => url.href.startsWith(new URL('src/presentation-kit/', destination).href))).toBe(false)
})
