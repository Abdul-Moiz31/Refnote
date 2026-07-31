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
  onOpenDocument: (documentId: string) => void;
  onTitleChange?: (title: string | null) => void;
}

const SAVE_DEBOUNCE_MS = 500;

export default function DocumentEditorView({
  documentId,
  onOpenDocument,
  onTitleChange,
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
    onTitleChange?.(null);

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
        onTitleChange?.(result.title);
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
  }, [documentId, editor, onTitleChange]);

  return (
    <div className="editor-view">
      {error && <p className="editor-message">{error}</p>}
      {!error && !document && <p className="editor-message">Loading...</p>}
      {document && (
        <div className="editor-surface">
          <div className="editor-content-wrapper">
            <h1 className="editor-title">{document.title}</h1>
            <EditorContent editor={editor} />
          </div>
        </div>
      )}
    </div>
  );
}
