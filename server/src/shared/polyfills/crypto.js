import { webcrypto } from 'node:crypto'

// MongoDB's CJS driver calls bare `crypto.getRandomValues()` (see mongodb/lib/utils.js).
// Ensure Web Crypto API is available on the global object before any driver code runs.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

if (!global.crypto) {
  global.crypto = globalThis.crypto
}
