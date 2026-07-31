# Refnote

A desktop notes app built with Electron, React, and TipTap. Documents are stored as local JSON files and can reference each other via `@`-mentions.

## Features

- **A list of your documents.** Open the app and see all your notes at a glance.
- **A real text editor.** Click a document to open it and start typing — bold, italic, headings, and lists all work, and your changes save automatically as you type.
- **Link documents to each other with `@`.** Type `@` anywhere in a document and start typing a title to search your other documents. Pick one and it's inserted as a little pill/chip showing that document's title.
- **Click a reference to jump there.** Click any of those pills and you're taken straight to the document it points to. If you had unsaved changes in the document you were leaving, they're saved first so nothing is lost.
- **Nothing breaks if a link goes stale.** If a reference ever points to a document that isn't there, it shows up clearly as "Unknown document" instead of crashing the app.

## Technologies used

- **Electron** — lets us build a desktop app (with its own window, running on your machine) using web technology instead of a native language like Swift or C++.
- **React** — the library used to build the actual screens (the document list, the editor page) out of reusable pieces.
- **TipTap** — the rich text editor itself. It's what turns a plain text box into something that understands bold, headings, lists, and our custom "document reference" pills.
- **Vite** — the build tool that turns all the source code into something Electron can actually run, and gives fast reloads during development.
- **TypeScript** — JavaScript with type-checking added, so a whole class of bugs (passing the wrong kind of value around) gets caught before the app even runs.
- **Plain JSON files on disk** — instead of a database, each document is just saved as a `.json` file on your computer. Simple to look at, simple to back up, no extra software to install.

## Running the app

Requires Node 22.12+ (Electron's tooling depends on it) and npm.

```bash
npm install
npm start
```

This launches the Electron app via `electron-forge`, with Vite powering the dev build for the main, preload, and renderer bundles. On first run, five sample documents are seeded automatically into the app's user data directory — no setup required.

Other scripts:

```bash
npm run lint    # eslint over .ts/.tsx
npm run package # produce a packaged app (no installer)
npm run make    # produce a distributable installer/artifact
```

## Architecture

### Main / preload / renderer split

- **`src/main`** — the Electron main process. Owns the `BrowserWindow`, and hosts all filesystem access. `src/main/storage/documentStore.ts` is the only module that touches disk; `src/main/ipc/documents.ts` exposes it over three `ipcMain.handle` channels and contains no storage logic of its own.
- **`src/preload`** — a thin `contextBridge` layer. It's the only file with access to both `ipcRenderer` and the eventual `window` the page sees. It exposes a narrow `window.documents` API (`list`, `getById`, `save`) rather than a general-purpose IPC passthrough, so the renderer can never reach arbitrary main-process/Node capability.
- **`src/renderer`** — the React app. No Node or Electron APIs are available here directly (`nodeIntegration` is off, `contextIsolation` is on by default); everything renderer-side goes through `window.documents`.
- **`src/shared`** — types and IPC channel name constants imported by both main and renderer, so the contract between them is defined once, not duplicated on each side.

This split exists for the standard Electron security reason: the renderer loads web content and should be treated as untrusted, so filesystem access is confined to the main process and reached only through an explicit, narrow, typed bridge.

### Why filesystem storage

Documents are plain JSON files (one per document) in `app.getPath('userData')/documents`. For a single-user local desktop app with no sync or multi-writer concerns, a real database is unnecessary complexity — plain files are trivially inspectable, debuggable, and portable, and the access pattern (list all, get one, save one) doesn't need queries a database would justify. Saves write to a temp file and `rename` into place so a concurrent read never observes a half-written file.

### Why TipTap

The brief calls for rich structured content (ProseMirror/TipTap JSON) rather than plain text, plus a custom inline node type for document references with its own NodeView and `@`-mention behavior. TipTap is a thin, extensible layer over ProseMirror that gives us schema-defined custom nodes, React-rendered NodeViews, and a suggestion/mention utility out of the box, which is exactly this shape of requirement — building the same on raw ProseMirror or a non-extensible editor would mean reimplementing the parts TipTap already provides.

### Why ID-based references

A `documentReference` node stores only `documentId` — never a copied title. The display title is resolved at render time by looking up the id against the current document list. This means renaming a document (if that ever ships) doesn't require finding and rewriting every reference to it, and a reference to a document that's gone missing degrades to an explicit "Unknown document" state instead of showing stale, silently-wrong data.

## Intentionally out of scope

- **Create/delete documents.** Only `listDocuments`, `getDocumentById`, and `saveDocument` (content update) exist. The brief scoped this down explicitly; adding create/delete would also require deciding on trash/undo semantics for delete, which is a bigger design surface than "wire up an editor."
- **Rich text beyond StarterKit's basics.** Bold/italic/headings/lists are available because they come free with `@tiptap/starter-kit`, but there's no toolbar, no formatting UI, and no custom marks — the task was about the reference system, not building a full editing experience.
- **A "workspace" entity.** There's exactly one implicit workspace (the app's user data directory). Multi-workspace support, folders, or tagging would need a real data model decision (a workspace record, ownership, migration path) that nothing in the current requirements calls for.
- **Renaming documents.** Since there's no create, and titles are only ever set at seed time, there was no requirement driving a rename flow — though the ID-based reference design means adding one later wouldn't touch the reference system at all.

## What I'd add next

- **Backlinks.** Since references are just `documentId` pointers, a "referenced by" panel is a matter of scanning all documents for nodes matching the current id and surfacing the results — no schema change needed, just a read-side query (probably cached, since it means opening every document on disk).
- **Search.** Right now `listDocuments` returns everything; a real search box (title first, full-text over content second) would help once the document count grows past what fits on one screen, and could reuse the same title-matching logic already in the mention dropdown.
- **Undo/redo across saves.** TipTap's history extension gives in-session undo for free, but there's no way to recover a previous *saved* version once the debounce fires and overwrites the file. Simple version history (keep the last N saves, or a append-only log) would make the autosave behavior feel safer.
- **Delete (with trash).** The current no-delete constraint is deliberate for this pass, but any real notes app needs it eventually — with a trash/undo step given how much reference integrity depends on documents not disappearing out from under a `documentReference` node.
