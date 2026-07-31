import { useEffect, useRef, useState } from 'react';
import type { ProseMirrorJSONContent } from '../../shared/document';
import { saveDocument } from '../data/documentsClient';

const SAVE_DEBOUNCE_MS = 500;

interface PendingSave {
  documentId: string;
  content: ProseMirrorJSONContent;
}

export interface DocumentAutosave {
  /** Queue content to be written after the debounce window. */
  scheduleSave: (content: ProseMirrorJSONContent) => void;
  /** Set when the last write attempt failed, cleared once one succeeds. */
  saveError: string | null;
}

/**
 * Debounced autosave for a single document. Any write still waiting on the
 * debounce is flushed when the document is swapped out or the app tears the
 * view down, so navigating away from an unsaved edit never drops it.
 */
export function useDocumentAutosave(documentId: string): DocumentAutosave {
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const flushPendingSave = () => {
    const pending = pendingSaveRef.current;
    if (!pending) {
      return;
    }
    pendingSaveRef.current = null;

    saveDocument(pending.documentId, pending.content).then(
      () => {
        if (isMountedRef.current) {
          setSaveError(null);
        }
      },
      () => {
        if (isMountedRef.current) {
          setSaveError('Could not save your changes.');
        }
      },
    );
  };

  const scheduleSave = (content: ProseMirrorJSONContent) => {
    pendingSaveRef.current = { documentId, content };
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      flushPendingSave();
    }, SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      flushPendingSave();
    };
    // `flushPendingSave` only touches refs, so it needs no dependency entry.
  }, [documentId]);

  return { scheduleSave, saveError };
}
