'use client';

import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { PairField } from '@/lib/admin/resources';

type Row = Record<string, string>;

interface PairsFieldProps {
  id: string;
  value: Row[];
  fields: PairField[];
  itemLabel: string;
  onChange: (value: Row[]) => void;
}

// Ordered list of small structured items (for example label + URL).
export function PairsField({ id, value, fields, itemLabel, onChange }: PairsFieldProps) {
  function update(index: number, key: string, text: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, [key]: text } : row)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...value, Object.fromEntries(fields.map((field) => [field.key, '']))]);
  }

  return (
    <div className="pairs-field">
      {value.map((row, index) => (
        <fieldset key={index} className="pairs-field__row">
          <legend className="visually-hidden">
            {itemLabel} {index + 1}
          </legend>
          <div className="pairs-field__inputs">
            {fields.map((field) => (
              <label key={field.key} className="pairs-field__input">
                <span>{field.label}</span>
                {field.multiline ? (
                  <textarea rows={3} value={row[field.key] ?? ''} onChange={(event) => update(index, field.key, event.target.value)} />
                ) : (
                  <input
                    type={field.url ? 'url' : 'text'}
                    value={row[field.key] ?? ''}
                    placeholder={field.url ? 'https://' : undefined}
                    onChange={(event) => update(index, field.key, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="pairs-field__controls">
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
          </div>
        </fieldset>
      ))}
      <button id={id} type="button" className="abtn abtn--ghost abtn--small" onClick={add}>
        <FiPlus aria-hidden="true" /> Add {itemLabel}
      </button>
    </div>
  );
}
