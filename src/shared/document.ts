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
