import type { ProseMirrorJSONContent } from '../../shared/document';

export function extractParagraphs(node: ProseMirrorJSONContent): string[] {
  if (!node.content) {
    return [];
  }

  return node.content
    .filter((child) => child.type === 'paragraph')
    .map((paragraph) =>
      (paragraph.content ?? [])
        .filter((child) => child.type === 'text')
        .map((child) => child.text ?? '')
        .join(''),
    );
}
