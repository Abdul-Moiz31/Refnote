import type { DocumentSummary } from '../../shared/document';
import DocumentIcon from './DocumentIcon';

interface SidebarProps {
  documents: DocumentSummary[] | null;
  isLoading: boolean;
  error: string | null;
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
}

export default function Sidebar({
  documents,
  isLoading,
  error,
  activeDocumentId,
  onSelectDocument,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-label">Documents</div>
        {error && <p className="sidebar-message">{error}</p>}
        {isLoading && <p className="sidebar-message">Loading...</p>}
        {documents && documents.length === 0 && (
          <p className="sidebar-message">No documents yet.</p>
        )}
        {documents && documents.length > 0 && (
          <ul className="document-list">
            {documents.map((summary) => (
              <li key={summary.id}>
                <button
                  type="button"
                  className={
                    'document-list-item' +
                    (summary.id === activeDocumentId ? ' is-active' : '')
                  }
                  title={summary.title}
                  onClick={() => onSelectDocument(summary.id)}
                >
                  <DocumentIcon className="document-list-item-icon" />
                  <span className="document-list-item-title">
                    {summary.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {documents && documents.length > 0 && (
        <div className="sidebar-footer">
          {documents.length} document{documents.length === 1 ? '' : 's'}
        </div>
      )}
    </aside>
  );
}
