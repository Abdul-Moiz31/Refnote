import type { MouseEvent } from 'react';
import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import type { DocumentReferenceOptions } from './DocumentReferenceExtension';

const MISSING_DOCUMENT_LABEL = 'Unknown document';

export default function DocumentReferenceView({
  node,
  extension,
}: NodeViewProps) {
  const options = extension.options as DocumentReferenceOptions;
  const documentId = node.attrs.documentId as string | null;
  // Only the id is stored on the node; the title is resolved here at render
  // time, so it always reflects the document's current title.
  const target = options
    .getDocuments()
    .find((summary) => summary.id === documentId);

  return (
    <NodeViewWrapper
      as="span"
      className={'document-reference-chip' + (target ? '' : ' is-missing')}
      title={target ? `Open ${target.title}` : MISSING_DOCUMENT_LABEL}
      onMouseDown={(event: MouseEvent) => event.preventDefault()}
      onClick={() => {
        if (target) {
          options.onNavigate(target.id);
        }
      }}
    >
      {target ? target.title : MISSING_DOCUMENT_LABEL}
    </NodeViewWrapper>
  );
}
