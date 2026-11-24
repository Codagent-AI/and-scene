import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
export async function preview() {
 const port = await new Promise((resolvePort, reject) => { const socket = createServer(); socket.once('error', reject); socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolvePort(port)) }) })
 const base = `http://127.0.0.1:${port}`
 const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(port),'--strictPort'], { stdio: 'ignore' })
 try { for (let i=0;i<100;i++) { if (server.exitCode !== null) throw Error('Preview exited before readiness'); try { if ((await fetch(base)).ok) return { server, base } } catch {} await new Promise(r=>setTimeout(r,100)) } throw Error('Preview readiness timed out') } catch(e) { server.kill(); throw e }
}
export async function browser() { return chromium.launch({ headless: true }) }
export async function stop(server, instance) { await instance?.close(); if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => { server.once('exit', resolve); setTimeout(resolve, 2000).unref() }) } }
