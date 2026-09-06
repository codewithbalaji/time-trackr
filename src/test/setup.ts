import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement these Pointer Events / scroll APIs, which Radix
// UI's interactive primitives (Select, Combobox, etc.) call internally --
// without these no-op polyfills, opening one in a test throws
// "target.hasPointerCapture is not a function".
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// This jsdom setup exposes a `localStorage` object with no working methods, so
// anything that reads or writes it throws. ThemeProvider survives that (every
// access is wrapped in try/catch, since private windows and blocked site data
// throw in real browsers too) but then can't be tested. Install a plain
// in-memory implementation when the real one is unusable.
if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size
      },
    },
  })
}
