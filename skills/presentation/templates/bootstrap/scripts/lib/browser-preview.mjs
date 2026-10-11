import { createServer } from 'node:net';
const pause = ms => new Promise(done => setTimeout(done, ms));
export function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(done => {
    const kill = signal => {
      try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal); }
      catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
    };
    const timer = setTimeout(() => kill('SIGKILL'), 2000);
    child.once('close', () => { clearTimeout(timer); done(); });
    kill('SIGTERM');
  });
}
export async function freePort() {
  const server = createServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  return port;
}
export async function ready(url, preview) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (preview.exitCode !== null || preview.signalCode !== null) throw new Error('preview exited before readiness; check the Vite preview output');
    try { if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return; } catch { /* retry until preview is ready */ }
    await pause(100);
  }
  throw new Error('preview did not become ready within 10 seconds');
}
