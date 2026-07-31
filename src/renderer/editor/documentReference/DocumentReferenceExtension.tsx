import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import { Suggestion } from '@tiptap/suggestion';
import type { DocumentSummary } from '../../../shared/document';
import DocumentReferenceView from './DocumentReferenceView';
import MentionList, { type MentionListHandle } from './MentionList';

export interface DocumentReferenceOptions {
  /** Resolves reference titles and populates the `@` dropdown. */
  getDocuments: () => DocumentSummary[];
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
          const normalizedQuery = query.trim().toLowerCase();
          const summaries = this.options.getDocuments();

          if (!normalizedQuery) {
            return summaries;
          }
          return summaries.filter((summary) =>
            summary.title.toLowerCase().includes(normalizedQuery),
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
