import { useEffect, useState } from 'react';
import type { DocumentSummary } from '../../shared/document';
import { listDocuments } from './documentsClient';

export interface DocumentListState {
  documents: DocumentSummary[] | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads the document list once for the whole app. Both the sidebar and the
 * editor (which resolves reference chip titles) read from this one copy, so
 * there is no second fetch and no window where a chip renders before the
 * titles it needs are available.
 */
export function useDocumentList(): DocumentListState {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listDocuments()
      .then((result) => {
        if (!cancelled) {
          setDocuments(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load documents.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { documents, isLoading: !documents && !error, error };
}
