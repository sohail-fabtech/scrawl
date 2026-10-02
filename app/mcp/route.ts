import { json } from "@/lib/agent/http"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
function retired() {
  return json({ error: "Scrawl MCP now runs on your computer with a local .scrawl.json file. Follow /docs/mcp to connect your agent. Recover existing online canvases at /connect.", code: "SCRAWL_LOCAL_ONLY", guide: "https://scrawl.jscrate.dev/docs/mcp" }, 410)
}
export const GET = retired
export const POST = retired
export const DELETE = retired
