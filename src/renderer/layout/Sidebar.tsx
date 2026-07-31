import { useEffect, useState } from 'react';
import type { DocumentSummary } from '../../shared/document';
import DocumentIcon from './DocumentIcon';

interface SidebarProps {
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
}

export default function Sidebar({
  activeDocumentId,
  onSelectDocument,
}: SidebarProps) {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    window.documents
      .list()
      .then((result) => {
        if (!cancelled) {
          setDocuments(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load documents.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-label">Documents</div>
        {error && <p className="sidebar-message">{error}</p>}
        {!error && !documents && <p className="sidebar-message">Loading...</p>}
        {!error && documents && documents.length === 0 && (
          <p className="sidebar-message">No documents yet.</p>
        )}
        {!error && documents && documents.length > 0 && (
          <ul className="document-list">
            {documents.map((document) => (
              <li key={document.id}>
                <button
                  type="button"
                  className={
                    'document-list-item' +
                    (document.id === activeDocumentId ? ' is-active' : '')
                  }
                  title={document.title}
                  onClick={() => onSelectDocument(document.id)}
                >
                  <DocumentIcon className="document-list-item-icon" />
                  <span className="document-list-item-title">
                    {document.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!error && documents && documents.length > 0 && (
        <div className="sidebar-footer">
          {documents.length} document{documents.length === 1 ? '' : 's'}
        </div>
      )}
    </aside>
  );
}
