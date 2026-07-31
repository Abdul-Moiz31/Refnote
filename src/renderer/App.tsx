import { useState } from 'react';
import DocumentListView from './views/DocumentListView';
import DocumentEditorView from './views/DocumentEditorView';

type View = { name: 'list' } | { name: 'editor'; documentId: string };

export default function App() {
  const [view, setView] = useState<View>({ name: 'list' });

  switch (view.name) {
    case 'editor':
      return (
        <DocumentEditorView
          documentId={view.documentId}
          onBack={() => setView({ name: 'list' })}
        />
      );
    case 'list':
    default:
      return (
        <DocumentListView
          onSelectDocument={(documentId) =>
            setView({ name: 'editor', documentId })
          }
        />
      );
  }
}
