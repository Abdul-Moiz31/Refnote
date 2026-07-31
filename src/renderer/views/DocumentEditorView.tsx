import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import type {
  Document,
  DocumentSummary,
  ProseMirrorJSONContent,
} from '../../shared/document';
import { DocumentReference } from '../editor/documentReference/DocumentReferenceExtension';
import { useDocumentAutosave } from '../editor/useDocumentAutosave';
import { getDocumentById } from '../data/documentsClient';

interface DocumentEditorViewProps {
  documentId: string;
  documents: DocumentSummary[];
  onOpenDocument: (documentId: string) => void;
}

// Formatting is deliberately out of scope: only paragraphs, line breaks and
// undo/redo are kept from StarterKit, so there are no marks or block types
// the app does not intend to support.
const STARTER_KIT_OPTIONS = {
  blockquote: false,
  bold: false,
  bulletList: false,
  code: false,
  codeBlock: false,
  heading: false,
  horizontalRule: false,
  italic: false,
  link: false,
  listItem: false,
  listKeymap: false,
  orderedList: false,
  strike: false,
  underline: false,
} as const;

export default function DocumentEditorView({
  documentId,
  documents,
  onOpenDocument,
}: DocumentEditorViewProps) {
  const [loadedDocument, setLoadedDocument] = useState<Document | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { scheduleSave, saveError } = useDocumentAutosave(documentId);

  // Reference chips resolve their title through this on every render, so it
  // has to track the latest list rather than the one at editor-creation time.
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const editor = useEditor({
    extensions: [
      StarterKit.configure(STARTER_KIT_OPTIONS),
      DocumentReference.configure({
        getDocuments: () => documentsRef.current,
        onNavigate: onOpenDocument,
      }),
    ],
    content: '',
    onUpdate: ({ editor: updatedEditor }) => {
      scheduleSave(updatedEditor.getJSON() as ProseMirrorJSONContent);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    let cancelled = false;

    getDocumentById(documentId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result) {
          setLoadError('Document not found.');
          return;
        }
        setLoadedDocument(result);
        // `emitUpdate: false` — loading is not an edit, and letting it fire
        // onUpdate would queue a pointless save of what was just read.
        editor.commands.setContent(result.content, { emitUpdate: false });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Failed to load document.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, editor]);

  if (loadError) {
    return <p className="editor-message">{loadError}</p>;
  }

  return (
    <div className="editor-view">
      {!loadedDocument && <p className="editor-message">Loading...</p>}
      {loadedDocument && (
        <div className="editor-surface">
          <div className="editor-content-wrapper">
            <h1 className="editor-title">{loadedDocument.title}</h1>
            {saveError && <p className="editor-save-error">{saveError}</p>}
            <EditorContent editor={editor} />
          </div>
        </div>
      )}
    </div>
  );
}
