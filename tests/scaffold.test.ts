// @vitest-environment node
import { it, expect } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { scaffold, resolveTarget, templateRoot } from "../scripts/scaffold.mjs";
async function temporary(fn: (dir: string) => Promise<void>) {
  const parent = resolve(".work");
  await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, "unit-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
it("I-19 complete anchors skip, partial anchors preserve existing infrastructure and merge dependencies", async () => {
  await temporary(async (dir) => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        scripts: { build: "custom existing build" },
        dependencies: { react: "existing-version" },
        workspaces: undefined,
      }),
    );
    expect(
      (await scaffold(dir, { anchors: ["build", "kit", "index"] })).written,
    ).toEqual([]);
    await expect(scaffold(dir, { anchors: ["build"] })).rejects.toThrow(
      `Confirm scaffold target before writes: ${dir}`,
    );
    expect(await readdir(dir)).toEqual(["package.json"]);
    await scaffold(dir, { anchors: ["build"], confirmed: true });
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(pkg.scripts.build).toBe("custom existing build");
    expect(pkg.dependencies.react).toBe("existing-version");
    expect(pkg.dependencies.motion).toBeTruthy();
    expect(
      await readFile(join(dir, "src/presentation-kit/types.ts"), "utf8"),
    ).toContain("Step");
  });
});
it("I-20 standalone monorepo and existing-app resolution follows documented signals", () => {
  const root = "/root/project";
  expect(resolveTarget(root)).toBe(root);
  for (const flag of ["workspaces", "pnpm", "packages", "apps"])
    expect(resolveTarget(root, { [flag]: true })).toBe(
      join(root, "presentations"),
    );
  expect(resolveTarget(root, { anchors: ["kit"], workspaces: true })).toBe(
    root,
  );
});
it("I-21 template lookup uses module location independently of cwd", async () => {
  const previous = process.cwd();
  process.chdir("/");
  try {
    expect(templateRoot).toBe(
      join(previous, "skills/presentation/templates/bootstrap/"),
    );
    expect(
      await readFile(join(templateRoot, "package.json"), "utf8"),
    ).toContain("vite");
    expect(await readFile(resolve(templateRoot,'..','presentation/steps/01.tsx.template'),'utf8')).toContain("export const step");
  } finally {
    process.chdir(previous);
  }
});
it("I-7 kit contains only geometry and motion styling and no framework dependency", async () => {
  async function scan(dir: string): Promise<string> {
    let out = "";
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      out += e.isDirectory() ? await scan(p) : await readFile(p, "utf8");
    }
    return out;
  }
  const source = await scan("src/presentation-kit");
  expect(source).not.toMatch(
    /(?:backgroundColor|boxShadow|fontFamily|borderRadius|padding|margin|--theme|tailwind)/,
  );
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  expect(
    Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }),
  ).not.toContain("tailwindcss");
});
it("I-25 I-28 I-30 local sample CSS owns responsive chrome active states and attribution", async () => {
  const css = await readFile(
    "src/presentations/how-to-make-a-presentation/presentation.css",
    "utf8",
  );
  expect(css).toMatch(/@media\s*\(max-width:\s*900px\)/);
  expect(css).toMatch(/data-presentation-toc\]\s*\{\s*display:\s*none/);
  expect(css).toMatch(/data-presentation-active="true"/);
  expect(css).toMatch(/data-presentation-attribution/);
  expect(css).toContain("font-size: 12px");
  expect(css).toMatch(/entity-tray[^}]+border:\s*0;/);
  expect(css).toMatch(/entity-verify[^}]+color:\s*#205b3a/);
});

it("I-20 monorepo partial root build produces a complete independent child", async () => {
  await temporary(async (dir) => {
    const root = JSON.stringify({
      workspaces: ["packages/*"],
      scripts: { build: "preserve-root" },
    });
    await writeFile(join(dir, "package.json"), root);
    const result = await scaffold(dir, { anchors: ["build"], confirmed: true });
    expect(result.target).toBe(join(dir, "presentations"));
    expect(await readFile(join(dir, "package.json"), "utf8")).toBe(root);
    expect(
      JSON.parse(await readFile(join(result.target, "package.json"), "utf8"))
        .scripts.build,
    ).toBe("tsc -b && vite build");
    expect(
      await readFile(join(result.target, "tsconfig.json"), "utf8"),
    ).toBeTruthy();
  });
});
