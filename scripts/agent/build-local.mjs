import { spawnSync } from "node:child_process"
import { writeFileSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
const root = fileURLToPath(new URL("../../", import.meta.url))
// Invoke Node directly: Windows .cmd launchers require a shell.
const next = createRequire(import.meta.url).resolve("next/dist/bin/next")
rmSync(new URL("../../out/.scrawl-local-editor.json", import.meta.url), { force: true })
const result = spawnSync(process.execPath, [next, "build"], {
  cwd: root, stdio: "inherit", env: { ...process.env, WEBXDC: "0", SCRAWL_LOCAL_EXPORT: "1" },
})
if (result.status !== 0) process.exit(result.status || 1)
writeFileSync(new URL("../../out/.scrawl-local-editor.json", import.meta.url), JSON.stringify({ app: "scrawl", localEditor: true, version: 1 }))
