import type {
  Document,
  DocumentSummary,
  ProseMirrorJSONContent,
} from '../shared/document';

declare global {
  interface Window {
    documents: {
      list: () => Promise<DocumentSummary[]>;
      getById: (id: string) => Promise<Document | undefined>;
      save: (
        id: string,
        content: ProseMirrorJSONContent,
      ) => Promise<Document>;
    };
  }
}

export {};
