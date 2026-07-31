import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { DocumentSummary } from '../../../shared/document';
import DocumentReferenceView from './DocumentReferenceView';
import MentionList, { type MentionListHandle } from './MentionList';

export interface DocumentReferenceOptions {
  getDocuments: () => DocumentSummary[];
  getCurrentDocumentId: () => string | null;
  onNavigate: (documentId: string) => void;
}

export const DocumentReference = Node.create<DocumentReferenceOptions>({
  name: 'documentReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addOptions() {
    return {
      getDocuments: () => [],
      getCurrentDocumentId: () => null,
      onNavigate: () => undefined,
    };
  },

  addAttributes() {
    return {
      documentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-document-id'),
        renderHTML: (attributes) => ({
          'data-document-id': attributes.documentId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-document-reference]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-document-reference': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentReferenceView);
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<DocumentSummary>({
        editor: this.editor,
        char: '@',
        allowSpaces: false,
        items: ({ query }) => {
          const currentDocumentId = this.options.getCurrentDocumentId();
          const normalizedQuery = query.trim().toLowerCase();

          return this.options
            .getDocuments()
            .filter((document) => document.id !== currentDocumentId)
            .filter((document) =>
              normalizedQuery
                ? document.title.toLowerCase().includes(normalizedQuery)
                : true,
            );
        },
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, {
              type: this.name,
              attrs: { documentId: props.id },
            })
            .run();
        },
        render: () => {
          let component: ReactRenderer<MentionListHandle> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });
              unmount = props.mount(component.element as HTMLElement);
            },
            onUpdate: (props) => {
              component?.updateProps(props);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                unmount?.();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
