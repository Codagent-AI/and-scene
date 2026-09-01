import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as previewServer from './preview-server.mjs'

describe('preview server ownership', () => {
  it('provides a shared readiness guard for browser scripts', () => {
    expect(existsSync(resolve(process.cwd(), 'scripts/preview-server.mjs'))).toBe(true)
  })

  it('starts Vite programmatically so readiness belongs to this invocation', () => {
    expect(previewServer.startOwnedPreview).toBeTypeOf('function')
  })

  it('bounds stalled HTTP readiness probes', async () => {
    let aborted = false
    const readiness = previewServer.waitForPreviewResponse('http://127.0.0.1:4173/', {
      attempts: 1,
      delayMs: 0,
      requestTimeoutMs: 10,
      fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          aborted = true
          reject(signal.reason)
        })
      }),
    })

    await expect(readiness).rejects.toThrow('did not become ready')
    expect(aborted).toBe(true)
  })
})
