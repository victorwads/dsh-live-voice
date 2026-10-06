import React from 'react';
import type { DiagnosticValue } from '../src/modules/core/diagnostics.js';
export function StateTree({
  name,
  value,
  omitted,
  depth = 0,
}: {
  name: string;
  value: DiagnosticValue;
  omitted: string;
  depth?: number;
}) {
  if (value === null || typeof value !== 'object')
    return (
      <div className="dlvd-leaf">
        <code>{name}</code>
        <span data-kind={typeof value}>{String(value)}</span>
      </div>
    );
  const entries = Object.entries(value);
  return (
    <details className="dlvd-branch" open={depth < 3}>
      <summary>
        <code>{name}</code>
        <small>
          {Array.isArray(value) ? '[' + entries.length + ']' : '{' + entries.length + '}'}
        </small>
      </summary>
      {entries.slice(0, 100).map(([key, child]) => (
        <StateTree key={key} name={key} value={child} omitted={omitted} depth={depth + 1} />
      ))}
      {entries.length > 100 && <p>{omitted}</p>}
    </details>
  );
}
