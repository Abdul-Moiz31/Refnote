import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import SplashScreen from './layout/SplashScreen';
import Logo from './layout/Logo';
import DocumentEditorView from './views/DocumentEditorView';
import { useDocumentList } from './data/useDocumentList';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const { documents, isLoading, error } = useDocumentList();

  const activeDocument =
    documents?.find((summary) => summary.id === activeDocumentId) ?? null;

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <Logo size={22} />
          {activeDocument && (
            <div className="app-header-breadcrumb">
              <span>Documents</span>
              <span className="app-header-breadcrumb-sep">/</span>
              <span className="app-header-breadcrumb-title">
                {activeDocument.title}
              </span>
            </div>
          )}
        </header>
        <div className="app-body">
          <Sidebar
            documents={documents}
            isLoading={isLoading}
            error={error}
            activeDocumentId={activeDocumentId}
            onSelectDocument={setActiveDocumentId}
          />
          <main className="app-main">
            {documents && activeDocumentId ? (
              // Remounting per document keeps each document's editor and its
              // pending-save flush on a clean, self-contained lifecycle.
              <DocumentEditorView
                key={activeDocumentId}
                documentId={activeDocumentId}
                documents={documents}
                onOpenDocument={setActiveDocumentId}
              />
            ) : (
              <div className="empty-state">
                <Logo
                  size={40}
                  showWordmark={false}
                  className="empty-state-mark"
                />
                <p>Select a document from the sidebar to start writing.</p>
              </div>
            )}
          </main>
        </div>
      </div>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </>
  );
}
