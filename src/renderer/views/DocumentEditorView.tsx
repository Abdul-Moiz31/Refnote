import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Document, DocumentSummary } from '../../shared/document';
import { DocumentReference } from '../editor/documentReference/DocumentReferenceExtension';

interface DocumentEditorViewProps {
  documentId: string;
  onBack: () => void;
}

const SAVE_DEBOUNCE_MS = 500;

export default function DocumentEditorView({
  documentId,
  onBack,
}: DocumentEditorViewProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const documentsRef = useRef<DocumentSummary[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    window.documents.list().then((summaries) => {
      if (!cancelled) {
        documentsRef.current = summaries;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        DocumentReference.configure({
          getDocuments: () => documentsRef.current,
          getCurrentDocumentId: () => documentId,
        }),
      ],
      content: '',
      onUpdate: ({ editor: updatedEditor }) => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          window.documents.save(documentId, updatedEditor.getJSON());
        }, SAVE_DEBOUNCE_MS);
      },
    },
    [documentId],
  );

  useEffect(() => {
    let cancelled = false;
    setDocument(null);
    setError(null);

    window.documents
      .getById(documentId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result) {
          setError('Document not found.');
          return;
        }
        setDocument(result);
        editor?.commands.setContent(result.content);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load document.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, editor]);

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
          <EditorContent editor={editor} />
        </>
      )}
    </div>
  );
}
