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
      paragraph(
        'Documents are stored locally on your machine as plain JSON files.',
      ),
      paragraph(
        'Edit this document and your changes will be saved automatically.',
      ),
    ),
  },
];

const DOCUMENTS_DIR_NAME = 'documents';
const DOCUMENT_FILE_EXTENSION = '.json';

function getDocumentsDir(): string {
  return path.join(app.getPath('userData'), DOCUMENTS_DIR_NAME);
}

function getDocumentPath(id: string): string {
  return path.join(getDocumentsDir(), `${id}${DOCUMENT_FILE_EXTENSION}`);
}

let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    // Reset on failure so a later call can retry rather than being stuck
    // with a permanently rejected promise.
    initPromise = initialize().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

/**
 * Creates the documents directory and, only when it holds no documents at
 * all, seeds the starter set. An existing install is never overwritten.
 */
async function initialize(): Promise<void> {
  const dir = getDocumentsDir();
  await fs.mkdir(dir, { recursive: true });
  const existing = await fs.readdir(dir);
  if (existing.some((name) => name.endsWith(DOCUMENT_FILE_EXTENSION))) {
    return;
  }
  await Promise.all(SEED_DOCUMENTS.map((seed) => writeDocumentFile(seed)));
}

/**
 * Writes to a temp file and renames into place, so a concurrent read never
 * observes a partially written file.
 */
async function writeDocumentFile(document: Document): Promise<void> {
  const finalPath = getDocumentPath(document.id);
  const tempPath = `${finalPath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(document, null, 2), 'utf-8');
  await fs.rename(tempPath, finalPath);
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
  const files = (await fs.readdir(dir)).filter((name) =>
    name.endsWith(DOCUMENT_FILE_EXTENSION),
  );
  const summaries = await Promise.all(
    files.map(async (file): Promise<DocumentSummary | null> => {
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8');
        const parsed = JSON.parse(raw) as Document;
        return { id: parsed.id, title: parsed.title };
      } catch (error) {
        // One unreadable file should not take down the whole list.
        console.error(`Skipping unreadable document file "${file}":`, error);
        return null;
      }
    }),
  );
  return summaries
    .filter((summary): summary is DocumentSummary => summary !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
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
  const updated: Document = { id: existing.id, title: existing.title, content };
  await writeDocumentFile(updated);
  return updated;
}
