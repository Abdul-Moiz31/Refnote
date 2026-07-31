import { ipcMain } from 'electron';
import {
  getDocumentById,
  listDocuments,
  saveDocument,
} from '../storage/documentStore';
import { DOCUMENT_CHANNELS } from '../../shared/document';
import type { ProseMirrorJSONContent } from '../../shared/document';

export function registerDocumentIpcHandlers(): void {
  ipcMain.handle(DOCUMENT_CHANNELS.list, () => listDocuments());

  ipcMain.handle(DOCUMENT_CHANNELS.getById, (_event, id: string) =>
    getDocumentById(id),
  );

  ipcMain.handle(
    DOCUMENT_CHANNELS.save,
    (_event, id: string, content: ProseMirrorJSONContent) =>
      saveDocument(id, content),
  );
}
