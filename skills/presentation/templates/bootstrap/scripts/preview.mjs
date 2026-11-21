import { preview } from 'vite'

try {
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  process.once('disconnect', () => { void server.close() })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') throw new Error('Preview has no TCP address')
  process.send({ port: address.port })
} catch (error) {
  console.error(error)
  process.exitCode = 1
  process.disconnect()
}
