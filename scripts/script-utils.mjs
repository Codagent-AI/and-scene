import { spawn } from 'node:child_process'

export function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}`))
    })
  })
}

export async function closePreview(browser, server) {
  try {
    await browser?.close()
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.httpServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  }
}
