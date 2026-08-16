import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));
const viteCliPath = fileURLToPath(new URL("node_modules/vite/bin/vite.js", import.meta.url));
const prerenderScriptPath = fileURLToPath(new URL("scripts/prerender.mjs", import.meta.url));

function staticPrerender(): Plugin {
  let isSsrBuild = false;

  return {
    name: "noland-static-prerender",
    apply: "build",
    configResolved(config) {
      isSsrBuild = Boolean(config.build.ssr);
    },
    closeBundle() {
      if (isSsrBuild) return;

      execFileSync(
        process.execPath,
        [viteCliPath, "build", "--ssr", "src/entry-server.tsx", "--outDir", "dist-ssr"],
        { cwd: projectDirectory, stdio: "inherit" },
      );
      execFileSync(process.execPath, [prerenderScriptPath], {
        cwd: projectDirectory,
        stdio: "inherit",
      });
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), staticPrerender()],
});
