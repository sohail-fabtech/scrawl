# Driving scrawl as an agent

scrawl is a wireframing tool: an infinite canvas of UI components that render as
a hand-drawn sketch. A document is a flat map of nodes saved as
[`.scrawl.json`](format.md), with browser and agent edits using the same node model.

Choose the connection that matches where the drawing lives.

1. **The browser door.** For a drawing already open in Scrawl, use **Connect
   agent** and give its instructions to an agent with access to that same tab.
   Edits through WebMCP or `window.scrawl` autosave in browser storage. No
   download, installation or companion is needed.
2. **The local companion.** Human and agent edit a chosen disk file in the
   full editor, with MCP or HTTP tools and live updates.
3. **The file CLI.** You have a shell and want to create or edit a file directly.
4. **The library door.** You are writing TypeScript in this repo.

---

## The local companion

Clone this repository, use Node.js 24 and pnpm 10, then build the editor once:

```bash
git clone https://github.com/pablostanley/squig.git
cd scrawl
pnpm install --frozen-lockfile
pnpm build:local
pnpm scrawl serve /absolute/path/canvas.scrawl.json
```

The command prints a local editor URL and connection details. Open that URL
before drawing so the user can watch. A missing file is created; existing
files are validated before editing. The selected file is the source of truth.
Keep the process running. It binds only to `127.0.0.1` and serves the editor,
HTTP tools and MCP from that local origin. No database or account is involved.

If the drawing is already open on scrawl.sh, keep working in that tab using
the browser door below. Only export a `.scrawl.json` copy when the user wants
to move the drawing to a disk file, then start the companion for that file.
The website cannot infer its absolute path or silently link browser storage
to a downloaded copy.

### MCP clients

Use a stdio server entry with absolute paths in your client's MCP config:

```json
{
  "mcpServers": {
    "scrawl": {
      "command": "node",
      "args": [
        "--experimental-strip-types",
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--import", "/absolute/scrawl/scripts/register-loader.mjs",
        "/absolute/scrawl/scripts/scrawl.ts",
        "mcp", "/absolute/path/canvas.scrawl.json"
      ]
    }
  }
}
```

Replace both the checkout and document paths. The client starts the companion;
it also serves a local editor. Use the returned editor URL to work together.
Do not launch another `serve` or `mcp` process for the same file. To connect
another client to an already running companion, use that session's HTTP MCP
address and bearer token. Launch Node directly for stdio: package-manager
banners on stdout would corrupt the MCP protocol.

There is no published `npx scrawl` package. The optional Scrawl plugin supplies
a workflow skill; the checkout and selected file supply the runtime.

### Full agent tools

MCP prefixes tool names with `scrawl_`. The local HTTP equivalent is
`POST /api/v1/tools/{name}` with the same JSON input and the session's bearer
token. Use the actual loopback URL printed by the companion, never scrawl.sh.

- `scrawl_local_session` over MCP, or `GET /api/local/session` over HTTP: the editor URL, selected file path and connection addresses.
- `catalog`, `documents`, `get_document`: discover components and read the file.
- `edit_document`, `replace_document`: validated, atomic edits using the current revision.
- `history`, `restore`: bounded local snapshots and revision-checked restoration.
- `comment`, `resolve_comment`: feedback stored with the local document.
- `measure_text`, `render_document`, `export_document`: local measurement, SVG/PNG and portable JSON.

Call `scrawl_local_session` for the editor URL and connection details.
Start with `documents`, read `get_document`, then return the editor URL before
editing. Use explicit node IDs and small batches. Re-read after a stale revision
error; revision tokens describe content and must not be incremented by the client.
No-op saves add no snapshots. The companion keeps at most 50 history entries
and 16 MiB of history beside the file in a `.scrawl.json.history` directory;
older history expires. Save a separate copy or
use your own backup tools for versions you must keep.

Portable files may use up to 16 MiB, including comments. MCP responses are
capped at 8 MiB, including their protocol envelope. Larger results return an
`isError` tool result with `status: 413`, `filePath`, `editorUrl` and the
revision when available. The error says whether the operation completed or
the request failed. If it completed, the edit remains saved. Read the selected
`filePath` from disk and use `documents` for
the current revision before editing again; do not retry the mutation blindly.
For a large render, inspect the editor or export an image from the browser.

The full engine supports all six node types, layouts, grouping, connector
bindings, locks, variations and notes. Put feedback the user must see on the
canvas with `note`; structured comments are available to tools but have no
canvas comment UI. Rendering and font measurement run on the computer.
Your external agent's model calls still follow that agent's provider and billing.

Direct file edits made outside the companion are detected. Prefer MCP/HTTP
while a session is active so edits are serialized and history is retained.
Do not edit the selected file using the direct CLI at the same time.

Existing cloud canvas links are for read-only recovery. Export a local copy;
new workspaces and public editing are retired.

## The file CLI

```bash
pnpm scrawl <command> [...]
```

Negative numbers need the equals form, because node's argument parser cannot
tell `-40` from a flag: `--x=-40`, not `--x -40`.

| command | what it does |
|---|---|
| `components [query]` | the library, one line each: kind, name, group, default size |
| `describe <kind>` | that component's default size, default props and legal prop values |
| `new <file> [--force]` | a blank document; `--force` replaces an existing file |
| `ls <file>` | what is on the sheet, bottom to top |
| `add <file> <kind>` | place a component |
| `text <file> "<words>"` | place a text layer |
| `shape <file> rect\|ellipse` | place a rectangle or an ellipse |
| `arrow <file>` | connect two nodes, or two points |
| `set <file> <id>` | change one node |
| `rm\|group\|front\|back <file> <id...>` | remove, group, reorder |
| `render <file>` | the drawing as SVG |
| `validate <file>` | does scrawl still read this file |

Before `new --force` replaces an invalid file, it preserves the original bytes
in `<file>.before-replace-<uuid>.bak` and prints that backup path. Valid files
use the normal bounded revision history. Replacement still respects the
per-file lock and 16 MiB file limit.

```bash
pnpm scrawl components card                 # kinds matching "card"
pnpm scrawl describe button                 # every prop a button takes
pnpm scrawl new signin.scrawl.json --name "sign in"
pnpm scrawl ls signin.scrawl.json
pnpm scrawl add signin.scrawl.json card --x 0 --y 0 --id card1
pnpm scrawl add signin.scrawl.json button --x 40 --y 200 --props '{"label":"Sign in"}' --id go
pnpm scrawl text signin.scrawl.json "the happy path" --x 40 --y 160 --size 20 --bold --id note
pnpm scrawl shape signin.scrawl.json rect --x=-24 --y=-24 --w 320 --h 300 --fill light --dashed
pnpm scrawl arrow signin.scrawl.json --from note --to go --style elbow
pnpm scrawl set signin.scrawl.json go --patch '{"w":180}'
pnpm scrawl rm signin.scrawl.json note
pnpm scrawl group signin.scrawl.json card1 go
pnpm scrawl front signin.scrawl.json go       # or back
pnpm scrawl render signin.scrawl.json --out signin.svg
pnpm scrawl validate signin.scrawl.json
```

Every mutating command prints the ids it touched. Anything you got wrong prints
one sentence on stderr and exits 1.

---

## The browser door

Use **Connect agent** in the current canvas and pass the copied instructions
to an agent that can access the existing tab. The drawing already autosaves;
inviting an agent does not require exporting it or creating a disk file.

Find the existing tab and match `window.scrawl.documentId()` to the document
ID in the invitation before reading or editing. With WebMCP, read
`scrawl_read_canvas` and match its `documentId`. A URL alone does not identify
a browser drawing. Opening that URL in another browser profile cannot
access the original profile's storage, and a new tab can open a different
drawing. If the agent cannot access the original tab, explain that browser
access is needed; do not silently create or import another canvas.

In a WebMCP-capable browser, scrawl registers structured canvas tools
automatically. Start with `scrawl_read_canvas`; see [WebMCP](webmcp.md) for
the tool catalog, compatibility and verification. The console API below
remains available in other browsers.

With the app open, `window.scrawl` edits the canvas somebody is watching. Every
call is synchronous, throws on bad input with a sentence worth reading, lands
in the undo stack (`⌘Z` takes it back) and autosaves.

```js
scrawl.version                      // the bridge's version
scrawl.documentId()                 // the current browser document's identity
scrawl.doc()                        // the whole document as a value
scrawl.serialize()                  // it as .scrawl.json text
scrawl.load(json)                   // replace the canvas with a document
scrawl.add(nodes)                   // nodes built by hand, in one undo step
scrawl.addComponent(kind, { x, y, w, h, props })
scrawl.addText("the happy path", { x, y, fontSize, w, align, bold, ink })
scrawl.addShape("rect", { x, y, w, h, fill, dashed })
scrawl.addArrow({ from, to, head, lineStyle })
scrawl.update(id, patch)
scrawl.remove(ids)
scrawl.group(ids)                   // the new group id, or null
scrawl.toFront(ids)                 // z-order: later is on top
scrawl.toBack(ids)
scrawl.select(ids)
scrawl.selection()                  // the ids currently selected
scrawl.zoomToFit()
scrawl.zoomTo(ids)
scrawl.bounds()                     // the world box the drawing covers
scrawl.components(query)            // the same index as `pnpm scrawl components`
scrawl.describe(kind)
scrawl.svg(ids)                     // markup for those nodes, or the whole sheet
```

```js
scrawl.addComponent("card", { x: 0, y: 0 })
scrawl.addText("empty state", { x: 0, y: -40, bold: true })
scrawl.zoomToFit()
```

---

## The library door

From node or a test inside this repo, [`lib/doc.ts`](../lib/doc.ts) provides
the shared node operations. It is pure: every function returns
a new document and leaves its input alone.

```ts
import { addNodes, componentNode, emptyDoc, nodesOf, serializeDoc, textNode } from "@/lib/doc"
import { renderSvg } from "@/lib/sketch/svg"

let doc = emptyDoc("pricing")
doc = addNodes(doc, [componentNode("pricing", { x: 0, y: 0 }), textNode("three tiers", { x: 0, y: -40 })])
writeFileSync("pricing.scrawl.json", serializeDoc(doc))
console.log(renderSvg(nodesOf(doc), doc.look))
```

Run it the way this repo runs any TypeScript from node:

```bash
node --experimental-strip-types --import ./scripts/register-loader.mjs yourfile.ts
```

---

## How to draw well

The loop: **list, describe, place, render, look, adjust.** List the library
(`pnpm scrawl components`, `scrawl_catalog`, `scrawl.components()`) before you
invent a component that already exists, describe the one you picked before
you guess at a prop name, then place things at their default sizes, render the
SVG, and actually read it before you say you are done. A wireframe you have not
looked at is a guess.

**Place at default sizes.** Every component ships the size it was drawn for.
Set `w` and `h` when the layout genuinely needs it, not as a reflex.

**Keep an 8px rhythm.** Positions and gaps in multiples of 8, and 16 to 24px of
air inside a container before its contents start. Things that line up read as
deliberate even in a sketch.

**Real words where a person reads them.** Button labels, nav items, headings,
empty states: write the actual copy. It is where half the design decisions
hide. For body copy nobody is meant to read, drop a `paragraph` or another
placeholder-line component rather than writing sentences to fill the space.

**Stay monochrome and low fidelity.** One ink on paper. No colour, no shadows,
no pixel-precision. The napkin look is the point: nothing looks decided, so the
feedback is about the idea.

**Variations go side by side.** Three takes on one screen belong on one sheet,
spaced apart with a text label over each saying what it is, not in three files.
Comparing is the whole reason to draw three.

**Group what belongs together.** A card and its contents, a nav and its items.
Then a person can move the idea instead of eleven rectangles.

**Lock the background.** If you draw a big rectangle behind everything, give it
`"locked": true` so nobody grabs it by accident when they start editing.

### Tidy up and exact spacing

Use `scrawl_edit_document` (MCP) or `POST /api/v1/tools/edit_document`
(local HTTP) with the document ID and expected revision, and these operations:

```json
[
  { "op": "tidy", "ids": ["a", "b", "c"], "gap": 16 },
  { "op": "spacing", "ids": ["a", "b", "c"], "axis": "x", "gap": 24 },
  { "op": "spacing", "ids": ["a", "b", "c"], "axis": "x", "gap": 24, "order": ["c", "a", "b"] }
]
```

Tidy infers rows from vertical overlap, aligns row tops, and uses a uniform gap.
Omit `gap` to use the median nonnegative existing gap (16 px when none exists).
Spacing measures visual bounds, supports unequal sizes, and anchors the leading
edge. `axis` is `x` or `y`; `gap` must be finite and nonnegative. Spatial `order`
must contain every selected ID exactly once. It changes positions, not layer
stacking. Locked nodes must be unlocked first. These commands need at least two
nodes and are atomic, revision checked edits. The generated `/openapi.json`
includes these operation schemas.

In the browser, use `window.scrawl.tidy(ids, gap?)` and
`window.scrawl.spacing(ids, { axis, gap, order? })`. Each call is one undo step.

On the canvas, select two or more objects and choose **Tidy up** from the
selection’s bottom-right grid button, inspector, or context menu. Hover a uniform
gap to reveal its pink handle; dragging changes matching gaps on the same axis.
The live label shows pixels. Arrow keys adjust a focused gap by 1 px, or 10 with
Shift. Enter exact horizontal or vertical gaps in the inspector, including when
existing gaps differ. Drag a centre ring to reorder within its row or column.
Click rings to mark items, then drag **Resize width** or **Resize height** to
resize the marked items while retaining the gaps. Escape cancels a drag;
undo restores the whole gesture. Spacing is geometry, not a persistent layout
constraint: ordinary move/resize controls still work freely.

For marked resizing through MCP or REST, use
`{ "op": "spacing_resize", "ids": ["a", "b", "c"], "marked": ["b"], "axis": "x", "delta": 20 }`.
`marked` must be a subset of `ids`; `axis` chooses width (`x`) or height (`y`).
The browser equivalent is `window.scrawl.resizeSpaced(ids, marked, axis, delta)`.
Focused rings reorder with arrow keys; focused resize controls change sizes by
1 px with arrow keys, or 10 px with Shift.
