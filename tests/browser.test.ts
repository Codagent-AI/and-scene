// @vitest-environment node
import { afterAll, expect, it } from "vitest";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  mkdir,
  writeFile,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { renamedApp, tree } from "./fixtures/renamed-app.mjs";
import { scaffold, resolveTarget } from "../skills/presentation/scaffold.mjs";
const exec = promisify(execFile);
const root = process.cwd(),
  dirs: string[] = [];
const evidence = process.env.EVIDENCE_DIR ?? resolve("artifacts/test-evidence");
async function run(cwd: string, args: string[], name: string) {
  let code = 0,
    stdout: string,
    stderr: string;
  try {
    const result = await exec("npm", args, {
      cwd,
      timeout: 180000,
      maxBuffer: 8e6,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    const e = error as { code: number; stdout: string; stderr: string };
    code = e.code;
    stdout = e.stdout;
    stderr = e.stderr;
  }
  await mkdir(evidence, { recursive: true });
  await writeFile(
    join(evidence, `${name}.txt`),
    `${stdout}\n${stderr}\nEXIT ${code}\n`,
  );
  return { code, output: stdout + stderr };
}
async function copyProject() {
  const dir = await mkdtemp(join(tmpdir(), "scene-browser-"));
  dirs.push(dir);
  for (const f of [
    "src",
    "scripts",
    "public",
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
  ])
    await cp(join(root, f), join(dir, f), { recursive: true });
  await symlink(join(root, "node_modules"), join(dir, "node_modules"), "dir");
  return dir;
}
afterAll(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
});
it("E2E-001 reference production verification observes nine steps and IPv4", async () => {
  const r = await run(root, ["run", "verify"], "E2E-001");
  expect(r.output).toContain("127.0.0.1");
  expect(r.code, r.output).toBe(0);
  for (let i = 0; i < 9; i++)
    expect(r.output).toContain(`render: step ${i} passed`);
  expect(r.output).toContain("PASS:");
  expect(r.output).toContain("cleaned up");
});
it("INT-001 bootstrap materializes outside the repository with aligned kit and scripts", async () => {
  const caller = await mkdtemp(join(tmpdir(), "foreign-caller-"));
  dirs.push(caller);
  const dir = join(caller, "app");
  const resolver = pathToFileURL(
    join(root, "skills/presentation/scaffold.mjs"),
  ).href;
  const materialized = await exec(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {scaffold} from ${JSON.stringify(resolver)}; console.log(JSON.stringify(await scaffold(${JSON.stringify(dir)},{install:false})))`,
    ],
    { cwd: caller, timeout: 180000 },
  );
  await mkdir(evidence, { recursive: true });
  await writeFile(
    join(evidence, "findings-INT-001-resolver.txt"),
    `cwd: ${caller}\n${materialized.stdout}\n${materialized.stderr}`,
  );
  expect(materialized.stdout).toContain(dir);
  const compare = async (relative: string) => {
    for (const item of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      const path = join(relative, item.name);
      if (item.isDirectory()) await compare(path);
      else
        expect(await readFile(join(dir, path), "utf8"), path).toBe(
          await readFile(join(root, path), "utf8"),
        );
    }
  };
  await compare("src/presentation-kit");
  await compare("scripts");
  const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  for (const name of [
    "react",
    "react-dom",
    "motion",
    "lucide-react",
    "vite",
    "typescript",
    "@vitejs/plugin-react",
    "@types/react",
    "@types/react-dom",
    "@types/node",
    "eslint",
    "typescript-eslint",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
    "globals",
    "@eslint/js",
    "playwright",
  ])
    expect(
      { ...pkg.dependencies, ...pkg.devDependencies }[name],
      name,
    ).toBeTruthy();
  expect(JSON.stringify(pkg)).not.toContain("tailwind");
  // Exercise real renamed contracts, then build/render them rather than token fixtures.
  await renamedApp(join(root, "skills/presentation/templates/bootstrap"), dir);
  await mkdir(join(dir, "apps"));
  expect(await resolveTarget(dir)).toBe(dir);
  const before = await tree(join(dir, "src"));
  expect((await scaffold(dir, { install: false })).reused).toBe(true);
  expect(await tree(join(dir, "src"))).toEqual(before);
  const installed = await run(
    dir,
    ["ci", "--prefer-offline", "--no-audit"],
    "INT-001-install",
  );
  expect(installed.code, installed.output).toBe(0);
  const verified = await run(dir, ["run", "verify"], "INT-001-verify");
  expect(verified.code, verified.output).toBe(0);
});
it("INT-002 helper captures settled steps and advisory diagnostics with overlap exemptions", async () => {
  const dir = await copyProject();
  await writeFile(
    join(dir, "src/presentations/how-to-make-a-presentation/Talk.tsx"),
    `import { Presentation } from '../../presentation-kit/Presentation'
function Fixture({payload}:{payload:number}){return <>
<style>{payload===0?'[data-presentation-attribution]{font-size:8px}':payload===1?'a{font-size:12px;font-family:monospace;color:rgb(12,34,56);text-decoration:none}':''}</style>
<style>{'@keyframes capture-proof {from {background:rgb(255,0,0)} to {background:rgb(0,255,0)}}'}</style>
<div key={payload} data-capture-proof style={{position:'absolute',left:840,top:340,width:20,height:20,zIndex:99999,animation:'capture-proof 600ms steps(1,end) forwards'}}/>
<span style={{position:'absolute',left:20,top:60}}>UNMARKED_A</span><span style={{position:'absolute',left:20,top:60}}>UNMARKED_B</span>
<div data-presentation-controls style={{position:'absolute',left:300,top:60}}><button aria-label="ICON_CONTROL" style={{width:60,height:40,padding:0}}><svg width="20" height="20"><circle cx="10" cy="10" r="8"/></svg></button><button aria-label="DOT_CONTROL" style={{position:'absolute',left:45,top:20,width:25,height:25,border:'3px solid red'}}/><span style={{position:'absolute',left:52,top:5}}>BORDER_TEXT</span></div>
<div style={{opacity:0}}><span style={{position:'absolute',left:20,top:120}}>HIDDEN_A</span><span style={{position:'absolute',left:20,top:120}}>HIDDEN_B</span></div>
<div data-presentation-allow-overlap=""><span style={{position:'absolute',left:20,top:170}}>ALLOWED_A</span><span style={{position:'absolute',left:20,top:170}}>ALLOWED_B</span><div data-presentation-controls><button aria-label="ALLOWED_ICON" style={{position:'absolute',left:20,top:170,width:50,height:30}}/></div></div></>}
const steps=[0,1,2].map(i=>({id:String(i),era:String(i),title:'Fixture '+i,caption:'Caption '+i,Scene:Fixture,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation title="Fixture" steps={steps}/>}`,
  );
  const build = await run(dir, ["run", "build"], "INT-002-build");
  expect(build.code, build.output).toBe(0);
  const r = await run(
    dir,
    ["run", "inspect", "--", "how-to-make-a-presentation"],
    "INT-002-inspect",
  );
  expect(r.code, r.output).toBe(0);
  expect(r.output).toContain("UNMARKED_A");
  expect(r.output).toContain("chrome: ICON_CONTROL / chrome: DOT_CONTROL");
  expect(r.output).toMatch(
    /BORDER_TEXT \/ chrome: ICON_CONTROL|chrome: ICON_CONTROL \/ BORDER_TEXT/,
  );
  expect(r.output).not.toContain("ALLOWED_ICON");
  expect(r.output).not.toContain("ALLOWED_A / ALLOWED_B");
  expect(r.output).not.toContain("HIDDEN_A / HIDDEN_B");
  expect(r.output).toContain("indistinct active progress");
  expect(r.output).toContain("indistinct active toc");
  expect(r.output).toContain("data-presentation-attribution");
  const dirOut = join(dir, "artifacts/inspection/how-to-make-a-presentation");
  const report = JSON.parse(
    await readFile(join(dirOut, "report.json"), "utf8"),
  );
  expect(report).toHaveLength(3);
  expect(report[0].warnings.join()).toContain("attribution:");
  expect(report[1].warnings.join()).not.toContain("attribution:");
  expect(report[2].warnings.join()).toContain("attribution:");
  expect(report[1].capturedAt - report[0].capturedAt).toBeGreaterThanOrEqual(
    850,
  );
  for (let i = 0; i < 3; i++) {
    expect(report[i].index).toBe(i);
    expect(report[i].settleMs).toBe(850);
    expect(
      (await readFile(join(dirOut, report[i].filename)))
        .subarray(1, 4)
        .toString(),
    ).toBe("PNG");
    expect(report[i].warnings.join()).toContain(`step ${i}`);
  }
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    for (const record of report) {
      const png = (await readFile(join(dirOut, record.filename))).toString(
        "base64",
      );
      const pixel = await page.evaluate(async (encoded) => {
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        // Canvas fit: width=1384, height=610, centered in stage y=100..710.
        const scale = 1384 / 880,
          x = Math.round(28 + 850 * scale),
          y = Math.round(405 - 190 * scale + 350 * scale);
        return [...context.getImageData(x, y, 1, 1).data];
      }, png);
      expect(
        pixel,
        `capture step ${record.index} must contain the completed green animation`,
      ).toEqual([0, 255, 0, 255]);
    }
  } finally {
    await browser.close();
  }
});
it("E2E-002 representative phase failures are nonzero actionable and clean preview processes", async () => {
  for (const fault of ["build", "sample", "console", "page", "transition"]) {
    const dir = await copyProject();
    if (fault === "build")
      await writeFile(
        join(dir, "src/broken.ts"),
        'const broken: number = "not a number"; export {broken}',
      );
    if (fault === "sample")
      await writeFile(
        join(dir, "src/presentations/index.ts"),
        `export const presentations: {slug:string;title:string;load:()=>Promise<{default:()=>null}>}[]=[]`,
      );
    if (fault === "console" || fault === "page") {
      const injected =
        fault === "console"
          ? "console.error('injected error')"
          : "throw new Error('injected page error')";
      await writeFile(
        join(dir, "src/presentations/how-to-make-a-presentation/Talk.tsx"),
        `
import { Presentation } from '../../presentation-kit/Presentation'
import type { SceneProps } from '../../presentation-kit/types'
import { STEPS as base } from './steps'
function Fault({payload}:SceneProps<number>) {
 if(payload===3) { ${injected} }
 const Scene=base[0].Scene
 return <Scene payload={payload}/>
}
const steps=base.map(s=>({...s,Scene:Fault}))
export default function Talk(){return <Presentation steps={steps} title="Reference"/>}
`,
      );
    }
    if (fault === "transition") {
      const path = join(dir, "src/presentation-kit/usePresentationNav.ts");
      await writeFile(
        path,
        (await readFile(path, "utf8")).replace("clamp(n + 1)", "clamp(n)"),
      );
    }
    const r = await run(dir, ["run", "verify"], `E2E-002-${fault}`);
    expect(r.code, r.output).not.toBe(0);
    expect(r.output).toContain("FAIL");
    expect(r.output).not.toContain("PASS:");
    if (fault === "build") expect(r.output).toContain("FAIL build");
    else {
      expect(r.output).toContain("cleaned up");
      if (fault === "console" || fault === "page")
        expect(r.output).toContain("step 3");
      if (fault === "transition") expect(r.output).toContain("step 1");
      const url = r.output.match(
        /preview: ready (http:\/\/127\.0\.0\.1:\d+)/,
      )?.[1];
      expect(url).toBeTruthy();
      await expect(fetch(url!)).rejects.toThrow();
    }
  }
});
