import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import type { DocumentReferenceOptions } from './DocumentReferenceExtension';

export default function DocumentReferenceView({
  node,
  extension,
}: NodeViewProps) {
  const options = extension.options as DocumentReferenceOptions;
  const documentId = node.attrs.documentId as string | null;
  const target = options
    .getDocuments()
    .find((document) => document.id === documentId);

  return (
    <NodeViewWrapper as="span" className="document-reference-chip">
      {target ? target.title : 'Unknown document'}
    </NodeViewWrapper>
  );
}
