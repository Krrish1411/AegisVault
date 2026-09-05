import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Polyfill crypto.randomUUID and getRandomValues if missing in test environment
if (!globalThis.crypto) {
  // @ts-expect-error test polyfill
  globalThis.crypto = {};
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () =>
    '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (
        Number(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0]! & (15 >> (Number(c) / 4)))
      ).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
}
