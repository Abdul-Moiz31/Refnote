export interface ProseMirrorJSONContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorJSONContent[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
}

export interface Document extends DocumentSummary {
  content: ProseMirrorJSONContent;
}

export const DOCUMENT_CHANNELS = {
  list: 'documents:list',
  getById: 'documents:getById',
  save: 'documents:save',
} as const;

/**
 * The full surface the preload bridge exposes on `window.documents`.
 * Declared once here so the preload implementation and the renderer's
 * global type declaration can never drift apart.
 */
export interface DocumentsApi {
  list: () => Promise<DocumentSummary[]>;
  getById: (id: string) => Promise<Document | undefined>;
  save: (id: string, content: ProseMirrorJSONContent) => Promise<Document>;
}
