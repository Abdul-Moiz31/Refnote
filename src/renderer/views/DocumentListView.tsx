import { useEffect, useState } from 'react';
import type { DocumentSummary } from '../../shared/document';

interface DocumentListViewProps {
  onSelectDocument: (id: string) => void;
}

export default function DocumentListView({
  onSelectDocument,
}: DocumentListViewProps) {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    window.documents
      .list()
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

  if (error) {
    return <p>{error}</p>;
  }

  if (!documents) {
    return <p>Loading...</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li key={document.id}>
          <button
            type="button"
            className="document-list-item"
            onClick={() => onSelectDocument(document.id)}
          >
            {document.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
