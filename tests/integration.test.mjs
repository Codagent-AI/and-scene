import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  cp,
  readFile,
  writeFile,
  mkdir,
  readdir,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), "and-scene-"));
const logs = process.env.EVIDENCE_DIR || resolve(root, "artifacts/test-logs");
await mkdir(logs, { recursive: true });
const bootstrap = join(scratch, "materialized");
async function run(cwd, args, label, expected = 0) {
  const result = await new Promise((resolve, reject) => {
    const child = spawn("npm", args, { cwd, env: process.env });
    let output = "";
    child.stdout.on("data", (b) => (output += b));
    child.stderr.on("data", (b) => (output += b));
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, output }));
  });
  await writeFile(
    join(logs, `${label}.txt`),
    `COMMAND: npm ${args.join(" ")}\nCWD: ${cwd}\n${result.output}\nEXIT: ${result.code}\n`,
  );
  assert.equal(result.code, expected, result.output);
  return result.output;
}
async function materializeFixture(dir) {
  await cp(join(root, "skills/presentation/templates/bootstrap"), dir, {
    recursive: true,
  });
  const fixture = join(dir, "src/presentations/fixture");
  await mkdir(fixture, { recursive: true });
  await writeFile(
    join(fixture, "Talk.tsx"),
    `import { Presentation } from '../../presentation-kit/Presentation'
import type { Step } from '../../presentation-kit/types'
import './fixture.css'
function Scene({payload}:{payload:number}) { return <div data-presentation-layer="" style={{position:'absolute',inset:0}}><span style={{position:'absolute',left:100,top:100}}>collision one</span><span style={{position:'absolute',left:100,top:100}}>collision two</span><div data-presentation-allow-overlap="" style={{position:'absolute',left:400,top:100}}><span style={{position:'absolute'}}>allowed one</span><span style={{position:'absolute'}}>allowed two</span></div><span style={{position:'absolute',top:250}}>{payload}</span><div style={{opacity:0}}><span style={{position:'absolute',left:100,top:100}}>hidden collision</span></div><span className="settled" style={{position:'absolute',top:280}}>settled</span></div> }
const steps:Step<number>[]=[0,1].map(i=>({id:String(i),era:i?'second':'first',title:'Fixture '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'shared'}))
export default function Talk(){return <Presentation steps={steps} title="Fixture"/>}
`,
  );
  await writeFile(
    join(fixture, "fixture.css"),
    `[data-presentation-attribution]{font-size:8px} [data-presentation-toc]{position:absolute;top:60px} .settled {animation: arrive .2s linear both;} @keyframes arrive {from {opacity:0;transform:translateX(-100px)} to {opacity:1;transform:translateX(0)}}`,
  );
  const registry = join(dir, "src/presentations/index.ts");
  await writeFile(
    registry,
    (await readFile(registry, "utf8")).replace(
      "RegistryEntry[] = []",
      "RegistryEntry[] = [{slug:'fixture',title:'Fixture',load:()=>import('./fixture/Talk')}]",
    ),
  );
}
async function files(dir) {
  return (await readdir(dir, { withFileTypes: true })).flatMap((e) =>
    e.isDirectory() ? [] : [e.name],
  );
}
before(async () => {
  await materializeFixture(bootstrap);
});
after(async () => {
  await rm(scratch, { recursive: true, force: true });
});
test("INT-001 materialized bootstrap builds, renders, is complete and byte-aligned", async () => {
  await run(bootstrap, ["ci", "--no-audit", "--no-fund"], "INT-001-install");
  const pkg = JSON.parse(
    await readFile(join(bootstrap, "package.json"), "utf8"),
  );
  for (const dep of ["react", "react-dom", "motion", "lucide-react"])
    assert.ok(pkg.dependencies[dep]);
  for (const dep of [
    "vite",
    "@vitejs/plugin-react",
    "typescript",
    "@types/react",
    "@types/react-dom",
    "@types/node",
    "eslint",
    "typescript-eslint",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
    "playwright",
  ])
    assert.ok(pkg.devDependencies[dep]);
  assert.ok(
    !Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some((n) =>
      n.includes("tailwind"),
    ),
  );
  async function compare(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      const rel = join(relative, entry.name);
      if (entry.isDirectory()) await compare(rel);
      else
        assert.equal(
          await readFile(join(root, rel), "utf8"),
          await readFile(join(bootstrap, rel), "utf8"),
          rel,
        );
    }
  }
  await compare("src/presentation-kit");
  await compare("scripts");
  const out = await run(
    bootstrap,
    ["run", "verify", "--", "--presentation", "fixture"],
    "INT-001-verify",
  );
  assert.match(out, /PASS/);
  assert.match(out, /step 1 \/ 1 clean/);
  const kit = await readFile(
    join(bootstrap, "src/presentation-kit/nodes/Primitives.tsx"),
    "utf8",
  );
  assert.ok(!/background|boxShadow|fontFamily|border:/.test(kit));
  console.log(
    "INT-001: anchors, dependencies, external-CWD build/route and kit/script parity passed",
  );
});
test("INT-002 inspection captures settled artifacts and advisory defects", async () => {
  try {
    await access(join(bootstrap, "node_modules"));
  } catch {
    await run(bootstrap, ["ci", "--no-audit", "--no-fund"], "INT-002-install");
  }
  try {
    await access(join(bootstrap, "dist/index.html"));
  } catch {
    await run(bootstrap, ["run", "build"], "INT-002-build");
  }

  const out = await run(
    bootstrap,
    ["run", "inspect", "--", "fixture", "--settle", "950"],
    "INT-002-inspect",
  );
  assert.match(out, /ADVISORY: step 0: overlap/);
  assert.match(out, /indistinct active progress/);
  assert.match(out, /indistinct active toc/);
  assert.match(out, /unpolished attribution/);
  assert.doesNotMatch(out, /overlap[^\n]*(allowed|hidden)/);
  const dir = join(bootstrap, "artifacts/inspection/fixture/1440x900");
  assert.deepEqual(
    (await files(dir)).filter((n) => n.endsWith(".png")).sort(),
    ["step-01.png", "step-02.png"],
  );
  const report = JSON.parse(await readFile(join(dir, "report.json"), "utf8"));
  assert.equal(report.length, 2);
  assert.ok(report.every((r) => r.waitedMs >= 950));
  assert.ok(report.every((r) => r.warnings.length >= 4));
  assert.ok(
    report.every((r) => r.warnings.every((w) => w.includes(`step ${r.step}:`))),
  );
  console.log(
    "INT-002: each step captured after settle, all warnings and overlap exemption passed",
  );
});
test("E2E-001 reference passes production verification across all nine steps", async () => {
  const out = await run(root, ["run", "verify"], "E2E-001-verify");
  assert.match(out, /PASS: build, sample and render verification/);
  assert.match(out, /127\.0\.0\.1/);
  for (let i = 0; i < 9; i++)
    assert.match(out, new RegExp(`render: step ${i} / 8 clean`));
  console.log(
    "E2E-001: whole-app build, registered sample, normative browser metadata and nine clean indices passed",
  );
});
async function faultCopy(name, change) {
  const dir = join(scratch, name);
  await mkdir(dir);
  for (const entry of [
    "src",
    "public",
    "scripts",
    "package.json",
    "package-lock.json",
    "index.html",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
  ])
    await cp(join(root, entry), join(dir, entry), { recursive: true });
  await symlink(join(root, "node_modules"), join(dir, "node_modules"), "dir");
  await change(dir);
  // Record preview starts and assert that none survive a failing verifier.
  const runtime = join(dir, "scripts/browser-runtime.mjs");
  let body = await readFile(runtime, "utf8");
  body = body.replace(
    "import { spawn }",
    "import { appendFileSync } from 'node:fs'\nimport { spawn }",
  );
  body = body.replace(
    /let startup\s*=\s*['"][ '"]*['"]\s*;/,
    (match) =>
      "appendFileSync('preview-pids.txt',String(child.pid)+'\\n');" + match,
  );
  await writeFile(runtime, body);
  const out = await run(dir, ["run", "verify"], `E2E-002-${name}`, 1);
  let pids = [];
  try {
    pids = (await readFile(join(dir, "preview-pids.txt"), "utf8"))
      .trim()
      .split("\n")
      .map(Number);
  } catch {}
  if (["console", "pageerror", "render", "transition"].includes(name))
    assert.ok(pids.length > 0, "fault must start an observed preview");
  for (const pid of pids)
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  return out;
}
async function edit(dir, relative, fn) {
  const path = join(dir, relative);
  await writeFile(path, fn(await readFile(path, "utf8")));
}
test("E2E-002 failures name phase and step and dispose preview subprocesses", async () => {
  assert.match(
    await faultCopy("build", (d) =>
      writeFile(
        join(d, "src/broken.ts"),
        'const broken: number = "no"; export {broken}',
      ),
    ),
    /FAIL \[build\]/,
  );
  assert.match(
    await faultCopy("missing", (d) =>
      rm(join(d, "src/presentations/how-to-make-a-presentation/outline.json")),
    ),
    /FAIL \[build\]|FAIL \[sample\]/,
  );
  assert.match(
    await faultCopy("unregistered", (d) =>
      edit(d, "src/presentations/index.ts", (s) =>
        s.replace(
          /export const presentations: RegistryEntry\[\] = \[[\s\S]*?\];/,
          "export const presentations: RegistryEntry[] = [];",
        ),
      ),
    ),
    /render at step 0/,
  );
  assert.match(
    await faultCopy("order", (d) =>
      edit(
        d,
        "src/presentations/how-to-make-a-presentation/outline.json",
        (s) => JSON.stringify(JSON.parse(s).reverse()),
      ),
    ),
    /FAIL \[sample\]/,
  );
  assert.match(
    await faultCopy("console", (d) =>
      edit(
        d,
        "src/presentations/how-to-make-a-presentation/steps/index.tsx",
        (s) =>
          s.replace(
            /(export function SampleScene[\s\S]*?\)\s*\{)/,
            "$1 if(payload.beat===2) console.error('injected console');",
          ),
      ),
    ),
    /console at step 2/,
  );
  assert.match(
    await faultCopy("pageerror", (d) =>
      edit(
        d,
        "src/presentations/how-to-make-a-presentation/steps/index.tsx",
        (s) =>
          s.replace(
            /(export function SampleScene[\s\S]*?\)\s*\{)/,
            "$1 if(payload.beat===3) setTimeout(()=>{throw new Error('injected pageerror')},0);",
          ),
      ),
    ),
    /pageerror at step 3/,
  );
  assert.match(
    await faultCopy("render", (d) =>
      edit(
        d,
        "src/presentations/how-to-make-a-presentation/steps/index.tsx",
        (s) =>
          s.replace(
            /(export function SampleScene[\s\S]*?\)\s*\{)/,
            "$1 if(payload.beat===0) throw new Error('injected render');",
          ),
      ),
    ),
    /step 0/,
  );
  assert.match(
    await faultCopy("transition", (d) =>
      edit(d, "src/presentation-kit/usePresentationNav.ts", (s) =>
        s.replace("move(1)", "move(0)"),
      ),
    ),
    /transition at step 1/,
  );
  console.log(
    "E2E-002: build, missing/reordered sample, console, pageerror, render and stuck-transition faults all failed actionably; previews cleaned",
  );
});
