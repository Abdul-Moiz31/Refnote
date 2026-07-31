import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type {
  Document,
  DocumentSummary,
  ProseMirrorJSONContent,
} from '../../shared/document';
import { DocumentReference } from '../editor/documentReference/DocumentReferenceExtension';

interface DocumentEditorViewProps {
  documentId: string;
  onBack: () => void;
  onOpenDocument: (documentId: string) => void;
}

const SAVE_DEBOUNCE_MS = 500;

export default function DocumentEditorView({
  documentId,
  onBack,
  onOpenDocument,
}: DocumentEditorViewProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const documentsRef = useRef<DocumentSummary[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    documentId: string;
    content: ProseMirrorJSONContent;
  } | null>(null);

  const writePendingSave = () => {
    const pending = pendingSaveRef.current;
    if (pending) {
      window.documents.save(pending.documentId, pending.content);
      pendingSaveRef.current = null;
    }
  };

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
          onNavigate: (targetDocumentId) => onOpenDocument(targetDocumentId),
        }),
      ],
      content: '',
      onUpdate: ({ editor: updatedEditor }) => {
        pendingSaveRef.current = {
          documentId,
          content: updatedEditor.getJSON() as ProseMirrorJSONContent,
        };
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveTimeoutRef.current = null;
          writePendingSave();
        }, SAVE_DEBOUNCE_MS);
      },
    },
    [documentId],
  );

  // Flush any pending debounced save before this document is swapped out,
  // whether by going back to the list or navigating to another document.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      writePendingSave();
    };
  }, [documentId]);

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
