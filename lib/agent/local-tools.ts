import { tools } from "./schema"

// Kept apart from local-service so pages can list the tools without bundling the renderer.
export const localTools = {
  catalog: tools.catalog,
  documents: { ...tools.documents, description: "Show the one local .scrawl.json file explicitly opened by this companion." },
  get_document: { ...tools.get_document, description: "Read the complete local file, variations, comments and revision token before editing. Revisions are opaque content tokens, not counters. MCP responses above 8 MiB return a bounded error with filePath and revision; read that selected file directly from disk." },
  edit_document: tools.edit_document,
  replace_document: { ...tools.replace_document, description: "Save editable canvas fields into the local .scrawl.json at the expected revision, retaining local comments and surviving variations." },
  history: { ...tools.history, description: "List up to 50 local saved states, including the current file. Older backups are also capped at 16 MiB." },
  restore: tools.restore,
  comment: tools.comment,
  resolve_comment: tools.resolve_comment,
  export_document: { ...tools.export_document, description: "Export the portable local .scrawl.json and implementation handoff, including variations and comments. Nothing is uploaded. MCP includes the canvas once under file; responses above 8 MiB return filePath and revision in a bounded error so you can read the selected file directly from disk." },
  measure_text: tools.measure_text,
  render_document: tools.render_document,
} as const
export type LocalToolName = keyof typeof localTools
