import type {
  Document,
  DocumentSummary,
  ProseMirrorJSONContent,
} from '../../shared/document';

/**
 * The single place the renderer talks to `window.documents`. UI components
 * import from here rather than reaching for the bridge themselves.
 *
 * On top of the raw bridge this serializes writes per document id, and makes
 * reads wait for any write still in flight for the same document. Without
 * that, navigating away from an edit and straight back could read the file
 * before the flushed save had landed.
 */
const pendingWrites = new Map<string, Promise<Document>>();

/** Resolves once `promise` settles, successfully or not. */
async function settled(promise: Promise<unknown>): Promise<void> {
  try {
    await promise;
  } catch {
    // The caller only needs to know the write finished; the originating
    // caller of saveDocument is the one that reports the failure.
  }
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return window.documents.list();
}

export async function getDocumentById(
  id: string,
): Promise<Document | undefined> {
  const inFlight = pendingWrites.get(id);
  if (inFlight) {
    await settled(inFlight);
  }
  return window.documents.getById(id);
}

export function saveDocument(
  id: string,
  content: ProseMirrorJSONContent,
): Promise<Document> {
  const previous = pendingWrites.get(id);
  const write = (previous ? settled(previous) : Promise.resolve()).then(
    (): Promise<Document> => window.documents.save(id, content),
  );

  pendingWrites.set(id, write);
  void settled(write).then(() => {
    if (pendingWrites.get(id) === write) {
      pendingWrites.delete(id);
    }
  });

  return write;
}
