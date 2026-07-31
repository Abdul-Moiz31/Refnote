import { useEffect, useState } from 'react';
import type { Document } from '../../shared/document';
import { extractParagraphs } from '../lib/prosemirrorText';

interface DocumentEditorViewProps {
  documentId: string;
  onBack: () => void;
}

export default function DocumentEditorView({
  documentId,
  onBack,
}: DocumentEditorViewProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDocument(null);

    window.documents
      .getById(documentId)
      .then((result) => {
        if (!cancelled) {
          setDocument(result ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load document.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  return (
    <div>
      <button type="button" onClick={onBack}>
        Back
      </button>
      {error && <p>{error}</p>}
      {!error && !document && <p>Loading...</p>}
      {document && (
        <>
          <h1>{document.title}</h1>
          {extractParagraphs(document.content).map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </>
      )}
    </div>
  );
}
