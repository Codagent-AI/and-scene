import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { expect, it } from 'vitest';

const checkout = resolve(import.meta.dirname, '../..');
const sample = 'src/presentations/how-to-make-a-presentation';
async function runCopy(change?: (directory: string) => Promise<void>, args: string[] = [], options: { missingBrowser?: boolean; signal?: 'SIGINT' | 'SIGTERM' } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-verify-'));
  try {
    await cp(checkout, directory, { recursive: true, filter: source => !['node_modules', '.git', 'dist', 'artifacts', '.inspection'].includes(source.slice(checkout.length + 1).split('/')[0]) });
    await symlink(join(checkout, 'node_modules'), join(directory, 'node_modules'), 'dir');
    if (change) await change(directory);
    const child = spawn(process.execPath, ['scripts/verify.mjs', ...args], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...(options.missingBrowser ? { PLAYWRIGHT_BROWSERS_PATH: join(directory, 'missing-browser') } : {}) } });
    let output = '';
    child.stdout.on('data', data => { output += data; if (options.signal && /verify: render .*step 1 .*PASS/.test(output)) { child.kill(options.signal); options.signal = undefined; } });
    child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => child.kill('SIGTERM'), 55000);
    const code = await new Promise<number | null>((done, reject) => { child.on('error', reject); child.on('close', done); });
    clearTimeout(timer);
    const preview = output.match(/preview (http:\/\/127\.0\.0\.1:(\d+)) \(pid (\d+)\)/);
    if (preview) {
      const listening = await new Promise<boolean>(done => {
        const socket = createConnection({ host: '127.0.0.1', port: Number(preview[2]) });
        socket.once('connect', () => { socket.destroy(); done(true); });
        socket.once('error', () => { socket.destroy(); done(false); });
      });
      expect(listening, output).toBe(false);
      expect(() => process.kill(Number(preview[3]), 0), output).toThrow();
    }
    return { code, output };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
async function edit(directory: string, file: string, transform: (text: string) => string) {
  const path = join(directory, file);
  await writeFile(path, transform(await readFile(path, 'utf8')));
}
function failed(result: { code: number | null; output: string }, phase: string, step?: number) {
  expect(result.code, result.output).not.toBe(0);
  expect(result.output).toContain(`verify: FAIL [${phase}]`);
  expect(result.output).not.toContain('verify: PASS');
  if (step) expect(result.output).toContain(`step ${step}`);
}
it('E2E-001 builds and renders nine normative steps against an IPv4 production preview', async () => {
  const result = await runCopy();
  expect(result.code, result.output).toBe(0);
  expect(result.output).toContain('verify: PASS');
  expect(result.output).toMatch(/preview http:\/\/127\.0\.0\.1:\d+/);
  expect(result.output).not.toContain('localhost');
  expect(result.output.match(/render.*step \d+ .*PASS/g)).toHaveLength(9);
  expect(result.output.match(/sample.*step \d+ .*PASS/g)).toHaveLength(9);
});
it('E2E-002 identifies a type/build fault', async () => {
  failed(await runCopy(directory => edit(directory, `${sample}/steps/01-topic.tsx`, text => text + '\nconst broken: number = "type fault";\nvoid broken;\n')), 'build');
});
it('E2E-002 rejects a missing reference registration', async () => {
  failed(await runCopy(directory => edit(directory, 'src/presentations/index.ts', text => text.replace(/\s*\{ slug:.*?\},/, ''))), 'sample');
});
it('E2E-002 reports the first out-of-order normative step', async () => {
  failed(await runCopy(directory => edit(directory, `${sample}/steps/index.tsx`, text => text.replace('[topic, interview', '[interview, topic'))), 'sample', 1);
});
it('E2E-002 reports a console error at its actual step and cleans up preview', async () => {
  failed(await runCopy(directory => edit(directory, `${sample}/steps/Scene.tsx`, text => text.replace('const { beat } = payload;', 'const { beat } = payload; if (beat === 7) console.error("injected console fault");'))), 'render', 7);
});
it('E2E-002 reports a page error at its actual step and cleans up preview', async () => {
  failed(await runCopy(directory => edit(directory, `${sample}/steps/Scene.tsx`, text => 'import { useEffect } from "react";\n' + text.replace('const { beat } = payload;', 'const { beat } = payload; useEffect(() => { if (beat === 7) setTimeout(() => { throw new Error("injected page fault"); }, 0); }, [beat]);'))), 'render', 7);
});
it('E2E-002 identifies the step whose keyboard transition is blocked', async () => {
  failed(await runCopy(directory => edit(directory, `${sample}/steps/Scene.tsx`, text => 'import { useEffect } from "react";\n' + text.replace('const { beat } = payload;', `const { beat } = payload; useEffect(() => { if (beat !== 6) return; const block = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') { event.preventDefault(); event.stopImmediatePropagation(); } }; window.addEventListener('keydown', block, true); return () => window.removeEventListener('keydown', block, true); }, [beat]);`))), 'render', 6);
});
it('supports a fresh scaffold without repository expectations', async () => {
  const result = await runCopy(directory => rm(join(directory, 'scripts/verify.expectations.json')), ['how-to-make-a-presentation']);
  expect(result.code, result.output).toBe(0);
  expect(result.output).toContain('sample: SKIP');
});
it('fails when there are no registered targets in a fresh scaffold', async () => {
  failed(await runCopy(async directory => {
    await rm(join(directory, 'scripts/verify.expectations.json'));
    await edit(directory, 'src/presentations/index.ts', text => text.replace(/\s*\{ slug:.*?\},/, ''));
  }), 'render');
});

it('reports an actionable Chromium installation command when the browser is missing', async () => {
  const result = await runCopy(undefined, [], { missingBrowser: true });
  failed(result, 'render');
  expect(result.output).toContain('npx playwright install chromium');
});
it('rejects an unknown requested slug', async () => {
  const result = await runCopy(undefined, ['unknown-presentation']);
  failed(result, 'render');
  expect(result.output).toContain('not registered');
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  it(`cleans up the live production browser and preview on ${signal}`, async () => {
    const result = await runCopy(undefined, [], { signal });
    failed(result, 'render');
    expect(result.output).toContain(`interrupted by ${signal}`);
  });
}
