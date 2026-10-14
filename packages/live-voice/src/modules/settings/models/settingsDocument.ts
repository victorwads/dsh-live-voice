/** Storage-format safety only: never interpret individual preference names or values. */
export type SettingsValue = null | boolean | number | string | SettingsValue[] | SettingsDocument;
export type SettingsDocument = { [key: string]: SettingsValue };
export const SETTINGS_MAX_BYTES = 64000;
export const SETTINGS_MAX_DEPTH = 16;
export class InvalidSettingsDocument extends Error {
  constructor() {
    super('invalid-settings');
  }
}

/** Validate and snapshot a plain JSON object without invoking getters or toJSON. */
export function settingsDocument(value: unknown): SettingsDocument {
  const seen = new Set<object>();
  const copy = (input: unknown, depth: number): SettingsValue => {
    if (depth > SETTINGS_MAX_DEPTH) throw new InvalidSettingsDocument();
    if (input === null) return null;
    if (typeof input === 'string' || typeof input === 'boolean') return input;
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    if (!input || typeof input !== 'object' || seen.has(input)) throw new InvalidSettingsDocument();
    const array = Array.isArray(input);
    if (
      !array &&
      Object.getPrototypeOf(input) !== Object.prototype &&
      Object.getPrototypeOf(input) !== null
    )
      throw new InvalidSettingsDocument();
    seen.add(input);
    const result: SettingsDocument = {};
    for (const key of Reflect.ownKeys(input)) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key))
        throw new InvalidSettingsDocument();
      const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
      if (!descriptor.enumerable || !('value' in descriptor)) throw new InvalidSettingsDocument();
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= (input as unknown[]).length))
        throw new InvalidSettingsDocument();
      result[key] = copy(descriptor.value, depth + 1);
    }
    seen.delete(input);
    if (array) {
      if (Object.keys(result).length !== (input as unknown[]).length)
        throw new InvalidSettingsDocument();
      return Array.from({ length: (input as unknown[]).length }, (_, i) => result[String(i)]);
    }
    return result;
  };
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new InvalidSettingsDocument();
  const result = copy(value, 0) as SettingsDocument;
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > SETTINGS_MAX_BYTES)
    throw new InvalidSettingsDocument();
  return result;
}

/** A patch replaces each supplied top-level value; omitted keys are untouched. */
export function mergeSettingsDocuments(...values: unknown[]): SettingsDocument {
  return settingsDocument(Object.assign({}, ...values.map((value) => settingsDocument(value))));
}
