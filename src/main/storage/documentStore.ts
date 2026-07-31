import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  Document,
  DocumentSummary,
  ProseMirrorJSONContent,
} from '../../shared/document';

function paragraph(text: string): ProseMirrorJSONContent {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function doc(...paragraphs: ProseMirrorJSONContent[]): ProseMirrorJSONContent {
  return { type: 'doc', content: paragraphs };
}

const SEED_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    title: 'Welcome to Refnote',
    content: doc(
      paragraph('Welcome to Refnote. This is your first document.'),
      paragraph('Use it as a starting point for jotting down notes and ideas.'),
    ),
  },
  {
    id: 'doc-2',
    title: 'Meeting Notes',
    content: doc(
      paragraph('Discussed roadmap priorities for the next quarter.'),
      paragraph('Follow up with the design team about the new layout.'),
    ),
  },
  {
    id: 'doc-3',
    title: 'Reading List',
    content: doc(
      paragraph('Add books and articles here as you come across them.'),
      paragraph('Revisit this list at the end of the month.'),
    ),
  },
  {
    id: 'doc-4',
    title: 'Project Ideas',
    content: doc(
      paragraph('A place to capture rough ideas before they are fully formed.'),
      paragraph('Not every idea needs to go anywhere.'),
    ),
  },
  {
    id: 'doc-5',
    title: 'Getting Started',
    content: doc(
      paragraph('Documents are stored locally on your machine as plain JSON files.'),
      paragraph('Edit this document and your changes will be saved automatically.'),
    ),
  },
];

function getDocumentsDir(): string {
  return path.join(app.getPath('userData'), 'documents');
}

function getDocumentPath(id: string): string {
  return path.join(getDocumentsDir(), `${id}.json`);
}

let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initialize();
  }
  return initPromise;
}

async function initialize(): Promise<void> {
  const dir = getDocumentsDir();
  await fs.mkdir(dir, { recursive: true });
  const existing = await fs.readdir(dir);
  if (existing.some((name) => name.endsWith('.json'))) {
    return;
  }
  await Promise.all(
    SEED_DOCUMENTS.map((document) =>
      fs.writeFile(
        getDocumentPath(document.id),
        JSON.stringify(document, null, 2),
        'utf-8',
      ),
    ),
  );
}

async function readDocument(id: string): Promise<Document | undefined> {
  try {
    const raw = await fs.readFile(getDocumentPath(id), 'utf-8');
    return JSON.parse(raw) as Document;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  await ensureInitialized();
  const dir = getDocumentsDir();
  const files = (await fs.readdir(dir)).filter((name) => name.endsWith('.json'));
  const summaries = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), 'utf-8');
      const document = JSON.parse(raw) as Document;
      return { id: document.id, title: document.title };
    }),
  );
  return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getDocumentById(
  id: string,
): Promise<Document | undefined> {
  await ensureInitialized();
  return readDocument(id);
}

export async function saveDocument(
  id: string,
  content: ProseMirrorJSONContent,
): Promise<Document> {
  await ensureInitialized();
  const existing = await readDocument(id);
  if (!existing) {
    throw new Error(`Document not found: ${id}`);
  }
  const updated: Document = { ...existing, content };
  const finalPath = getDocumentPath(id);
  const tempPath = `${finalPath}.${process.pid}.tmp`;
  // Write to a temp file and rename into place so a concurrent read never
  // observes a partially written file.
  await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
  await fs.rename(tempPath, finalPath);
  return updated;
}
