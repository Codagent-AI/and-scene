import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';
import { expect, it } from 'vitest';
const checkout = resolve(import.meta.dirname, '../..');
async function fingerprint(directory: string): Promise<string> {
  const digest = createHash('sha256');
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    digest.update(entry.name);
    digest.update(entry.isDirectory() ? await fingerprint(join(directory, entry.name)) : await readFile(join(directory, entry.name)));
  }
  return digest.digest('hex');
}
async function run(directory: string, args: string[]) {
  const result = await new Promise<{ code: number | null; output: string }>((done, reject) => {
    const child = spawn(process.execPath, ['scripts/inspect-presentation.mjs', ...args], { cwd: directory });
    let output = '';
    child.stdout.on('data', data => output += data);
    child.stderr.on('data', data => output += data);
    const timer = setTimeout(() => child.kill('SIGTERM'), 50000);
    child.on('error', reject);
    child.on('close', code => { clearTimeout(timer); done({ code, output }); });
  });
  const preview = result.output.match(/preview http:\/\/127\.0\.0\.1:(\d+) \(pid (\d+)\)/);
  if (preview) {
    const listening = await new Promise<boolean>(done => {
      const socket = createConnection({ host: '127.0.0.1', port: Number(preview[1]) });
      socket.once('connect', () => { socket.destroy(); done(true); });
      socket.once('error', () => { socket.destroy(); done(false); });
    });
    expect(listening, result.output).toBe(false);
    expect(() => process.kill(Number(preview[2]), 0), result.output).toThrow();
  }
  return result;
}
interface Report { steps: { index: number; id: string; screenshot: string; warnings: { kind: string; detail: string }[]; entities: { id: string; opacity: number }[] }[] }
it('INT-002 captures settled steps, diagnoses defects, exempts intentional overlap and preserves the checkout', async () => {
  const sourceTrees = await Promise.all(['src', 'scripts'].map(path => fingerprint(join(checkout, path))));
  const sourceRegistry = await readFile(join(checkout, 'src/presentations/index.ts'), 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-inspect-'));
  try {
    await cp(checkout, directory, { recursive: true, filter: source => !['node_modules', '.git', 'dist', 'artifacts'].includes(source.slice(checkout.length + 1).split('/')[0]) });
    await symlink(join(checkout, 'node_modules'), join(directory, 'node_modules'), 'dir');
    await writeFile(join(directory, 'src/presentations/index.ts'), `export const presentations = [
      { slug: 'defective', title: 'Defective', load: () => import('../../tests/fixtures/inspection/Talk') },
      { slug: 'clean', title: 'Clean', load: () => import('../../tests/fixtures/inspection/Talk').then(m => ({ default: m.Clean })) },
    ];`);
    const defective = await run(directory, ['defective']);
    expect(defective.code, defective.output).toBe(0);
    expect(defective.output).toContain('WARN step 1 (fixture-1) overlap:');
    expect(defective.output).toContain('active-chrome:');
    expect(defective.output).toContain('[data-presentation-attribution]');
    const folder = join(directory, 'artifacts/inspect/defective/1440x900');
    expect((await readdir(folder)).sort()).toEqual(['report.json', 'step-01.png', 'step-02.png', 'step-03.png']);
    const report: Report = JSON.parse(await readFile(join(folder, 'report.json'), 'utf8'));
    expect(report.steps.map(step => step.index)).toEqual([0, 1, 2]);
    expect(report.steps[0].warnings.some(w => w.kind === 'overlap')).toBe(true);
    expect(report.steps[1].warnings.some(w => w.kind === 'overlap'), JSON.stringify(report.steps[1].warnings)).toBe(false);
    for (const step of report.steps) {
      const png = await readFile(join(directory, step.screenshot));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(1440);
      expect(step.warnings.some(w => w.kind === 'active-chrome' && w.detail.includes('progress-item'))).toBe(true);
      expect(step.warnings.some(w => w.kind === 'active-chrome' && w.detail.includes('toc-item'))).toBe(true);
      expect(step.warnings.some(w => w.kind === 'attribution')).toBe(true);
    }
    expect(report.steps[2].entities.find(e => e.id === 'newcomer')?.opacity).toBe(1);
    const clean = await run(directory, ['clean', '--no-build']);
    expect(clean.code, clean.output).toBe(0);
    expect(clean.output).not.toContain('WARN');
    const narrow = await run(directory, ['clean', '--no-build', '--viewport', '390x844', '--settle', '900', '--out', 'artifacts/custom']);
    expect(narrow.code, narrow.output).toBe(0);
    expect(await readdir(join(directory, 'artifacts/custom'))).toHaveLength(4);
    const unknown = await run(directory, ['unknown', '--no-build']);
    expect(unknown.code).not.toBe(0);
    expect(unknown.output).toContain('not registered');
    expect(await readFile(join(checkout, 'src/presentations/index.ts'), 'utf8')).toBe(sourceRegistry);
    expect(await Promise.all(['src', 'scripts'].map(path => fingerprint(join(checkout, path))))).toEqual(sourceTrees);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
