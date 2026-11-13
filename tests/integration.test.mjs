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
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), "and-scene-"));
const logs = process.env.EVIDENCE_DIR || resolve(root, "artifacts/test-logs");
await mkdir(logs, { recursive: true });
const bootstrap = join(scratch, "materialized");
async function run(cwd, args, label, expected = 0, probe = {}) {
  const env = { ...process.env };
  if (probe.resources || probe.captures) {
    env.NODE_OPTIONS = `${env.NODE_OPTIONS || ""} --import=${pathToFileURL(join(root, "tests/browser-probe.mjs")).href}`;
    if (probe.resources) {
      env.AND_SCENE_RESOURCE_LOG = join(logs, `${label}.resources.jsonl`);
      await rm(env.AND_SCENE_RESOURCE_LOG, { force: true });
    }
    if (probe.captures) {
      env.AND_SCENE_CAPTURE_LOG = join(logs, `${label}.captures.jsonl`);
      await rm(env.AND_SCENE_CAPTURE_LOG, { force: true });
    }
  }
  const result = await new Promise((resolve, reject) => {
    const child = spawn("npm", args, { cwd, env });
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
async function observations(label, kind) {
  return (await readFile(join(logs, `${label}.${kind}.jsonl`), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}
async function assertDisposed(label, expectBrowser) {
  let resources = [];
  try {
    resources = await observations(label, "resources");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (expectBrowser) {
    assert.ok(
      resources.some((r) => r.kind === "preview"),
      "preview PID observed",
    );
    assert.ok(
      resources.some((r) => r.kind === "browser"),
      "browser PID observed",
    );
  }
  for (const resource of resources) {
    assert.ok(resource.pid > 0);
    assert.throws(
      () => process.kill(resource.pid, 0),
      { code: "ESRCH" },
      `${resource.kind} ${resource.pid} must have exited`,
    );
  }
  console.log(
    `${label}: asserted disposal of ${resources.map((r) => r.kind + " " + r.pid).join(", ") || "no started browser/preview"}`,
  );
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
function Scene({payload}:{payload:number}) { return <div data-presentation-layer="" style={{position:'absolute',inset:0}}><span style={{position:'absolute',left:100,top:100}}>collision one</span><span style={{position:'absolute',left:100,top:100}}>collision two</span><div data-presentation-allow-overlap="" style={{position:'absolute',left:400,top:100}}><span style={{position:'absolute'}}>allowed one</span><span style={{position:'absolute'}}>allowed two</span></div><span style={{position:'absolute',top:250}}>{payload}</span><div style={{opacity:0}}><span style={{position:'absolute',left:100,top:100}}>hidden collision</span></div><span key={payload} data-beat={payload} className="settled" style={{position:'absolute',top:280}}>settled</span><div data-presentation-controls style={{position:'absolute',left:100,top:320}}><button aria-label="Icon-only diagnostic" style={{width:160,height:40,background:'#ddd'}}><svg width="12" height="12"><circle cx="6" cy="6" r="4"/></svg></button></div><span style={{position:'absolute',left:105,top:325}}>icon body collision</span><div data-presentation-controls style={{position:'absolute',left:350,top:320}}><button aria-label="Padded diagnostic" style={{width:220,height:40,textAlign:'right'}}>own label</button></div><span style={{position:'absolute',left:355,top:325}}>padded body collision</span></div> }
const steps:Step<number>[]=[0,1].map(i=>({id:String(i),era:i?'second':'first',title:'Fixture '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'shared'}))
export default function Talk(){return <Presentation steps={steps} title="Fixture"/>}
`,
  );
  await writeFile(
    join(fixture, "fixture.css"),
    `[data-presentation-attribution]{font-size:8px} [data-presentation-toc]{position:absolute;top:60px} .settled {animation: arrive .8s linear both;} @keyframes arrive {from {opacity:0;transform:translateX(-100px)} to {opacity:1;transform:translateX(0)}}`,
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
    0,
    { captures: true },
  );
  assert.match(out, /ADVISORY: step 0: overlap/);
  assert.match(out, /indistinct active progress/);
  assert.match(out, /indistinct active toc/);
  assert.match(out, /unpolished attribution/);
  for (const step of [0, 1]) {
    assert.match(
      out,
      new RegExp(
        `step ${step}: overlap[^\\n]*(Icon-only diagnostic[^\\n]*icon body collision|icon body collision[^\\n]*Icon-only diagnostic)`,
      ),
    );
    assert.match(
      out,
      new RegExp(
        `step ${step}: overlap[^\\n]*(Padded diagnostic[^\\n]*padded body collision|padded body collision[^\\n]*Padded diagnostic)`,
      ),
    );
  }
  assert.doesNotMatch(out, /overlap[^\n]*(allowed|hidden)/);
  const dir = join(bootstrap, "artifacts/inspection/fixture/1440x900");
  assert.deepEqual(
    (await files(dir)).filter((n) => n.endsWith(".png")).sort(),
    ["step-01.png", "step-02.png"],
  );
  const report = JSON.parse(await readFile(join(dir, "report.json"), "utf8"));
  assert.equal(report.length, 2);
  const captures = await observations("INT-002-inspect", "captures");
  assert.deepEqual(
    captures.map((c) => c.step),
    [0, 1],
  );
  for (const capture of captures) {
    assert.equal(capture.beat, capture.step);
    assert.ok(capture.elapsedMs >= 950, JSON.stringify(capture));
    assert.equal(capture.opacity, 1);
    assert.equal(capture.running, false);
    assert.ok(["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(capture.transform));
  }
  console.log(
    "INT-002 independent pre-screenshot observations: " +
      JSON.stringify(captures),
  );
  // Mutation control: the same assertions must detect a removed settling wait.
  const helper = join(bootstrap, "scripts/inspect-presentation.mjs");
  const original = await readFile(helper, "utf8");
  assert.ok(original.includes("await page.waitForTimeout(options.settle);"));
  try {
    await writeFile(
      helper,
      original.replace("await page.waitForTimeout(options.settle);", ""),
    );
    await run(
      bootstrap,
      ["run", "inspect", "--", "fixture", "--settle", "950"],
      "INT-002-no-wait",
      0,
      { captures: true },
    );
    const premature = await observations("INT-002-no-wait", "captures");
    assert.equal(premature[1].step, 1);
    assert.equal(premature[1].beat, 1);
    assert.ok(premature[1].elapsedMs < 950);
    assert.equal(premature[1].running, true);
    assert.ok(premature[1].opacity < 1);
    console.log(
      "INT-002 removed-wait mutation detected: " + JSON.stringify(premature[1]),
    );
  } finally {
    await writeFile(helper, original);
  }

  assert.ok(report.every((r) => r.warnings.length >= 4));
  assert.ok(
    report.every((r) => r.warnings.every((w) => w.includes(`step ${r.step}:`))),
  );
  console.log(
    "INT-002: each step captured after settle, all warnings and overlap exemption passed",
  );
});
test("E2E-001 reference passes production verification across all nine steps", async () => {
  const out = await run(root, ["run", "verify"], "E2E-001-verify", 0, {
    resources: true,
  });
  await assertDisposed("E2E-001-verify", true);
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
  const label = `E2E-002-${name}`;
  const out = await run(dir, ["run", "verify"], label, 1, { resources: true });
  await assertDisposed(
    label,
    ["unregistered", "console", "pageerror", "render", "transition"].includes(
      name,
    ),
  );
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
