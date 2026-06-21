import '@testing-library/jest-dom'

// Node 25 may expose an incomplete localStorage object to jsdom. Keep tests
// deterministic with the browser API shape used by the application.
const storage = new Map()
const localStorageMock = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
  key: (index) => [...storage.keys()][index] ?? null,
  get length() { return storage.size },
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true })
if (globalThis.window) {
  Object.defineProperty(globalThis.window, 'localStorage', { value: localStorageMock, configurable: true })
}
