import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

async function reservePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

export async function startPreview() {
  const port = await reservePort()
  const base = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [
    fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
    'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort',
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`preview did not announce readiness on ${base}; ${output}`)), 10_000)
    const finish = (error) => { clearTimeout(timer); error ? reject(error) : resolve() }
    server.stdout.setEncoding('utf8')
    server.stderr.setEncoding('utf8')
    server.stdout.on('data', (chunk) => {
      output += chunk
      const plainOutput = output.replace(/\u001b\[[0-9;]*m/g, '')
      if (plainOutput.includes(base)) finish()
    })
    server.stderr.on('data', (chunk) => { output += chunk })
    server.once('error', (error) => finish(error))
    server.once('exit', (code, signal) => finish(new Error(`preview exited before readiness (code ${code}, signal ${signal}); ${output}`)))
  })
  try {
    await ready
    return { server, base }
  } catch (error) {
    await stopPreview(server)
    throw error
  }
}

export async function stopPreview(server) {
  if (server.exitCode !== null || server.signalCode !== null) return
  const exited = new Promise((resolve) => server.once('exit', resolve))
  server.kill('SIGTERM')
  await exited
}
