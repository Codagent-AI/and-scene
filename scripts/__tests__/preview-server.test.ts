import { createServer, type Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { startPreview } from '../preview-server.mjs'

const HOST = '127.0.0.1'
const PORT = 4199

let squatter: Server | undefined

afterEach(async () => {
  if (squatter) await new Promise<void>((resolve) => squatter!.close(() => resolve()))
  squatter = undefined
})

describe('preview startup', () => {
  it('refuses to start when the port is already served by something else', async () => {
    squatter = createServer((_request, response) => response.end('not the built app'))
    await new Promise<void>((resolve) => squatter!.listen(PORT, HOST, resolve))

    // Without this guard the readiness poll would succeed against the squatter and
    // verification would run against an unrelated application.
    await expect(startPreview(HOST, PORT)).rejects.toThrow(/already in use/)
  }, 30_000)
})
