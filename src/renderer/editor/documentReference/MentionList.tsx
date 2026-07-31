import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { DocumentSummary } from '../../../shared/document';

export interface MentionListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

type MentionListProps = SuggestionProps<DocumentSummary>;

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (props.items.length === 0) {
          return false;
        }
        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length,
          );
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % props.items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (props.items.length === 0) {
      return (
        <div className="mention-dropdown">
          <div className="mention-dropdown-empty">No matches</div>
        </div>
      );
    }

    return (
      <div className="mention-dropdown">
        {props.items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={
              'mention-dropdown-item' +
              (index === selectedIndex ? ' is-selected' : '')
            }
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
    );
  },
);

MentionList.displayName = 'MentionList';

export default MentionList;
