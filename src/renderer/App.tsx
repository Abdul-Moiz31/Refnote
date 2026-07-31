import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import SplashScreen from './layout/SplashScreen';
import Logo from './layout/Logo';
import DocumentEditorView from './views/DocumentEditorView';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string | null>(null);

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <Logo size={22} />
          {documentId && documentTitle && (
            <div className="app-header-breadcrumb">
              <span>Documents</span>
              <span className="app-header-breadcrumb-sep">/</span>
              <span className="app-header-breadcrumb-title">
                {documentTitle}
              </span>
            </div>
          )}
        </header>
        <div className="app-body">
          <Sidebar
            activeDocumentId={documentId}
            onSelectDocument={setDocumentId}
          />
          <main className="app-main">
            {documentId ? (
              <DocumentEditorView
                documentId={documentId}
                onOpenDocument={setDocumentId}
                onTitleChange={setDocumentTitle}
              />
            ) : (
              <div className="empty-state">
                <Logo size={40} showWordmark={false} className="empty-state-mark" />
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
