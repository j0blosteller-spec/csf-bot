import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, copyFile } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const dir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(dir, "dist");

await rm(distDir, { recursive: true, force: true });

await esbuild({
  entryPoints: [path.resolve(dir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: distDir,
  outExtension: { ".js": ".mjs" },
  logLevel: "info",
  external: ["*.node"],
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire } from 'module'; import { fileURLToPath as __furl } from 'url'; import { dirname as __dir } from 'path'; const require = createRequire(import.meta.url); const __filename = __furl(import.meta.url); const __dirname = __dir(__filename);`,
  },
});

// Copy image assets into dist/
await copyFile(path.resolve(dir, "src/bot/csf-logo.png"), path.resolve(distDir, "csf-logo.png"));
await copyFile(path.resolve(dir, "src/bot/banner.png"), path.resolve(distDir, "banner.png"));

console.log("Build complete — assets copied to dist/");
