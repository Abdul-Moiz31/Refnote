import { contextBridge, ipcRenderer } from 'electron';
import { DOCUMENT_CHANNELS } from '../shared/document';
import type { ProseMirrorJSONContent } from '../shared/document';

contextBridge.exposeInMainWorld('documents', {
  list: () => ipcRenderer.invoke(DOCUMENT_CHANNELS.list),
  getById: (id: string) => ipcRenderer.invoke(DOCUMENT_CHANNELS.getById, id),
  save: (id: string, content: ProseMirrorJSONContent) =>
    ipcRenderer.invoke(DOCUMENT_CHANNELS.save, id, content),
});
