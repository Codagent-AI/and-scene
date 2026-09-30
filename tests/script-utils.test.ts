import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { describe, expect, it } from 'vitest'
import { closePreview, runCommand } from '../scripts/script-utils.mjs'

const helperPath = 'scripts/script-utils.mjs'
const bootstrapPath = 'skills/presentation/templates/bootstrap/scripts/script-utils.mjs'

describe('browser command process helpers', () => {
  it('ships the same shared helpers with the standalone bootstrap', async () => {
    expect(existsSync(helperPath)).toBe(true)
    expect(existsSync(bootstrapPath)).toBe(true)
    expect(await readFile(bootstrapPath, 'utf8')).toBe(await readFile(helperPath, 'utf8'))
  })

  it('propagates command failures and allows successful commands to complete', async () => {
    await expect(runCommand(process.execPath, ['-e', 'process.exit(0)'])).resolves.toBeUndefined()
    await expect(runCommand(process.execPath, ['-e', 'process.exit(7)'])).rejects.toThrow('exited 7')
    await expect(runCommand('/nonexistent-and-scene-command', [])).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('releases the preview server even if closing the browser fails', async () => {
    const httpServer = createServer()
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const error = new Error('browser close failed')

    try {
      await expect(closePreview({ close: async () => { throw error } }, { httpServer })).rejects.toBe(error)
      expect(httpServer.listening).toBe(false)
      await expect(closePreview(undefined, undefined)).resolves.toBeUndefined()
    } finally {
      if (httpServer.listening) httpServer.close()
    }
  })
})
