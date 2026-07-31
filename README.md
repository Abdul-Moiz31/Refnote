# Refnote

Refnote is a local desktop notes app built with Electron, React, and TipTap. You open a document from the sidebar, write in it, and link it to other documents by typing `@`, which inserts a clickable reference chip that takes you to the document it points at.

## Getting Started

Prerequisites: Node 20.19 or newer, and npm. (Electron's own package declares `>= 22.12.0` in its `engines` field, so npm may print an engine warning on Node 20. The app builds and runs anyway. Verified on Node 20.20.0.)

```bash
npm install
npm start
```

`npm start` runs `electron-forge start`, which builds the main, preload, and renderer bundles with Vite and opens the app window. On first launch, five sample documents are written to disk automatically. There is no other setup step.

Other scripts:

```bash
npm run lint          # eslint over .ts/.tsx
npm run format        # prettier, writes
npm run format:check  # prettier, verify only
npm run package       # packaged app, no installer
npm run make          # distributable installer
```

## Architecture

### The three-process split

```
src/main       Electron main process. Owns the window and all filesystem access.
src/preload    contextBridge layer. The only code that sees both ipcRenderer and window.
src/renderer   React app. No Node, no Electron, no filesystem.
src/shared     Types and IPC channel names imported by both sides.
```

The split is a security boundary, not a folder convention. The renderer runs web content, and web content is the part of an Electron app most likely to end up executing something you did not write. So it gets no Node access at all: `nodeIntegration` is off, `contextIsolation` is on, and the page carries a CSP that locks scripts, styles, and connections to `'self'` plus the localhost origins Vite's dev server needs.

That means the renderer cannot read or write a file even if it wanted to. Filesystem access lives entirely in `src/main/storage/documentStore.ts`, and the only way to reach it is through three named functions on the bridge.

The preload script matters here. It exposes exactly `list`, `getById`, and `save`, not a general `invoke(channel, ...args)` passthrough. A generic passthrough would hand the renderer the ability to call any registered IPC handler, which gives back most of what `contextIsolation` was protecting. Three functions is a surface you can reason about.

### How a save travels

Take autosaving an edit:

1. The user types. `useDocumentAutosave` debounces for 500ms.
2. It calls `saveDocument(id, content)` in `src/renderer/data/documentsClient.ts`, the one renderer module that talks to the bridge.
3. That calls `window.documents.save(id, content)`, exposed by `src/preload/preload.ts`.
4. Preload calls `ipcRenderer.invoke(DOCUMENT_CHANNELS.save, id, content)`. The channel name is a constant from `src/shared/document.ts`, so main and renderer cannot disagree about the string.
5. `src/main/ipc/documents.ts` handles it and calls `saveDocument` in the store. The IPC layer holds no storage logic of its own; it wraps each handler so a failure is logged in main and comes back as a rejected promise rather than an unhandled exception.
6. The store writes to a temp file and renames it into place, then returns the saved document.
7. The result travels back as a resolved promise. If it rejected, the editor shows a save error instead of failing silently.

Reads follow the same path in the other direction.

### Where documents live

One JSON file per document, in `documents/` inside Electron's per-app user data directory (`app.getPath('userData')`). On macOS that is `~/Library/Application Support/<app name>/documents/doc-1.json` and so on.

Each file holds `id`, `title`, and `content`, where content is the TipTap/ProseMirror JSON document. The files are meant to be readable: if you want to check that a reference stored an ID and not a title, you can just open one.

## Key Engineering Decisions

### JSON files on disk instead of a database

This is a single user, single writer, local app, and the entire access pattern is list all, get one, save one. There is no query a database would make easier, so adding one would mean a schema, a migration story, and a dependency in exchange for nothing.

Plain files are also the better debugging story. When I needed to confirm that references were stored by ID, I read the file. When I needed to test the missing-reference path, I edited a file to point at an ID that does not exist.

The one thing files do not give you for free is atomicity, so saves write to a temp file and `rename` into place. Rename is atomic on the platforms this targets, which means a read can never catch a half-written document.

### TipTap, even with formatting turned off

The reference chip is not styled text. It is a real inline atom node in the document schema with a `documentId` attribute and a React NodeView that resolves the title at render time. That is the requirement that picked the editor, not formatting.

Getting that on a plain textarea would mean inventing a serialization format and writing selection and caret handling around a widget the browser does not know about. TipTap gives schema-defined custom nodes, React NodeViews, and the `@` suggestion plugin directly, which is most of this feature.

So formatting being off is not TipTap going unused. The structured document model is the part being used.

### References store IDs, not names

A `documentReference` node stores only `{ documentId: "doc-3" }`. The title shown on the chip is looked up against the current document list every render.

The alternative, copying the title into the node, means every rename becomes a migration: find every document, walk its content tree, rewrite every matching node, and hope nothing failed halfway. With IDs, a rename is a change to one field in one file, and every chip pointing at it shows the new title the next time it renders. I verified this by renaming a document on disk and confirming both existing chips updated.

It also makes broken links honest. A name-based reference to a deleted document silently keeps showing a title that means nothing. An ID that resolves to nothing can render as "Unknown document," which is true.

### Mention logic is isolated

Everything about the reference feature lives in `src/renderer/editor/documentReference/`:

```
DocumentReferenceExtension.tsx   node schema, attributes, suggestion plugin
DocumentReferenceView.tsx        the chip NodeView, title resolution, click to navigate
MentionList.tsx                  the dropdown, filtering, keyboard selection
```

The editor view itself (`views/DocumentEditorView.tsx`) does document loading, autosave wiring, and rendering. It configures the extension with two callbacks, `getDocuments` and `onNavigate`, and knows nothing else about how mentions work.

The reason is that these two things change for unrelated reasons. Reference behaviour changes when you want fuzzy matching or backlinks. Editor setup changes when you want a different save strategy or a new view state. Keeping them separate means the extension has one clear contract and could be dropped into a different editor surface without untangling anything.

## Scope

These were left out on purpose. Each one is a decision, not an unfinished edge.

### No create or delete

The store exposes `listDocuments`, `getDocumentById`, and `saveDocument`. There is no create and no delete anywhere in the app or the UI, and documents are pre-seeded on first run.

Delete in particular is not a small feature here. Deleting a document breaks every reference pointing at it, which means deciding between trash with restore, blocking deletes that have inbound references, or accepting broken links. That is a real design conversation, and answering it badly is worse than not shipping it.

### No rich text formatting

`StarterKit` is explicitly configured with bold, italic, strike, underline, code, code blocks, headings, lists, blockquote, horizontal rules, and links all turned off. What is left is paragraphs, line breaks, undo/redo, and the reference node.

This is a deliberate change from the default. Leaving StarterKit alone would have shipped formatting that works through Cmd+B and markdown input rules while nothing in the UI says it exists, which is worse than not having it. The content model is still ProseMirror JSON, so turning any of it back on is a one-line change.

### No workspace or folder entity

Documents are a flat pool. There is no workspace record, no folder, and no tag in the data model or the UI.

Referencing is what actually provides structure here. Once documents can point at each other, the useful relationships are the links, and a folder tree is a second, weaker organizing system sitting next to them. Adding one would mean deciding what a workspace owns, whether references can cross workspaces, and what happens when they do. Nothing in the current requirements calls for that.

## Edge Cases Handled

- **Self-references.** A document can reference itself. It appears in its own `@` dropdown, inserts normally, and clicking it is a no-op rather than a reload or a crash.
- **Multiple references to the same document.** Each chip is an independent node. Two references to the same document in one paragraph both render and both navigate.
- **Missing or invalid reference IDs.** A `documentId` that resolves to nothing renders as "Unknown document" with a distinct style, a default cursor, and no click handler. The editor does not throw and the rest of the document renders normally.
- **Save before navigate.** Navigating away from an unsaved edit flushes the pending debounced save before the view unmounts. On top of that, the renderer's document client serializes writes per document ID and makes reads wait for a write still in flight, so editing a document, leaving, and immediately coming back cannot read the file mid-save.
- **No matches in the dropdown.** Typing a query that matches nothing shows an explicit "No matches" state rather than an empty box or a dropdown that vanishes.
- **Unreadable files.** One corrupt JSON file is skipped and logged instead of taking down the whole document list.

## What I'd Add With More Time

**Backlinks.** Show which documents reference the one you have open. References are already just `documentId` pointers, so this is a read-side query: walk every document's content tree for matching nodes. It needs a cache, since done naively it means opening every file on disk on every navigation.

**Search across documents.** Titles first, then full text over content. The title-matching logic already exists in the mention dropdown, so the first half is mostly moving that behind a shared function and giving it a UI.

**Undo and version history.** TipTap gives in-session undo already, but once the autosave debounce fires there is no way back to a previous saved state. I would keep the last N saves per document as sibling files, which fits the existing storage model and does not need a schema.
