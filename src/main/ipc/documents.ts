import { ipcMain } from 'electron';
import {
  getDocumentById,
  listDocuments,
  saveDocument,
} from '../storage/documentStore';
import { DOCUMENT_CHANNELS } from '../../shared/document';
import type { ProseMirrorJSONContent } from '../../shared/document';

/**
 * Wraps a handler so a storage failure is logged in the main process and
 * reaches the renderer as a rejected promise it can render, rather than an
 * unhandled exception.
 */
function handle<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => Promise<TResult>,
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...(args as TArgs));
    } catch (error) {
      console.error(`IPC handler failed for "${channel}":`, error);
      throw new Error(
        error instanceof Error ? error.message : `${channel} failed`,
      );
    }
  });
}

export function registerDocumentIpcHandlers(): void {
  handle(DOCUMENT_CHANNELS.list, () => listDocuments());

  handle(DOCUMENT_CHANNELS.getById, (id: string) => getDocumentById(id));

  handle(
    DOCUMENT_CHANNELS.save,
    (id: string, content: ProseMirrorJSONContent) => saveDocument(id, content),
  );
}
