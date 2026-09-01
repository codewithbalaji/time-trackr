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
