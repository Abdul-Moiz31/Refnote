import type { DocumentsApi } from '../shared/document';

declare global {
  interface Window {
    documents: DocumentsApi;
  }
}

export {};
