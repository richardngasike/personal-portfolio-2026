'use client';

import { useState, type KeyboardEvent } from 'react';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';

interface ListFieldProps {
  id: string;
  value: string[];
  itemLabel: string;
  onChange: (value: string[]) => void;
}

// Ordered list of short text items: add, edit in place, reorder, remove.
export function ListField({ id, value, itemLabel, onChange }: ListFieldProps) {
  const [draft, setDraft] = useState('');

  function add() {
    const item = draft.trim();
    if (!item) return;
    if (!value.includes(item)) onChange([...value, item]);
    setDraft('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="list-field">
      {value.length > 0 ? (
        <ul className="list-field__items">
          {value.map((item, index) => (
            <li key={index} className="list-field__item">
              <input
                type="text"
                value={item}
                aria-label={`${itemLabel} ${index + 1}`}
                onChange={(event) => onChange(value.map((current, i) => (i === index ? event.target.value : current)))}
              />
              <button type="button" className="icon-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                <FiArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                aria-label="Move down"
              >
                <FiArrowDown aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove ${itemLabel} ${index + 1}`}
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="list-field__add">
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={`Add ${itemLabel}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
        />
        <button type="button" className="abtn abtn--ghost abtn--small" onClick={add}>
          <FiPlus aria-hidden="true" /> Add
        </button>
      </div>
    </div>
  );
}
