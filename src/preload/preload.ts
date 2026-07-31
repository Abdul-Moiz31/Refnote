import { contextBridge, ipcRenderer } from 'electron';
import { DOCUMENT_CHANNELS } from '../shared/document';
import type { DocumentsApi, ProseMirrorJSONContent } from '../shared/document';

// Only these three operations are exposed — never a general-purpose
// `invoke(channel, ...)` passthrough.
const documentsApi: DocumentsApi = {
  list: () => ipcRenderer.invoke(DOCUMENT_CHANNELS.list),
  getById: (id: string) => ipcRenderer.invoke(DOCUMENT_CHANNELS.getById, id),
  save: (id: string, content: ProseMirrorJSONContent) =>
    ipcRenderer.invoke(DOCUMENT_CHANNELS.save, id, content),
};

contextBridge.exposeInMainWorld('documents', documentsApi);
