// Replaces `vitest-localstorage-mock`, which assigned `globalThis.localStorage`
// directly. Vitest 5 forwards such assignments to the jsdom Window, whose
// `localStorage` is a getter-only accessor, so the plain assignment now throws.
// Defining the property sidesteps that, and keeps installing the storage in the
// `node` environment, where specs and `src` code still reach for the global.
const createStorage = () => {
  const store = new Map()
  // Plain methods rather than `vi.fn()`: this is the storage implementation,
  // not an assertion target, and no spec reads its call history. `vi.spyOn()`
  // still works on them (see tests/unit/lib/drafts.spec.js).
  return {
    get length() {
      return store.size
    },
    key: index => [...store.keys()][index] ?? null,
    getItem: key => store.get(String(key)) ?? null,
    // The Web Storage spec coerces both key and value to strings.
    setItem: (key, value) => {
      store.set(String(key), String(value))
    },
    removeItem: key => {
      store.delete(String(key))
    },
    clear: () => store.clear()
  }
}

const defineStorage = name =>
  Object.defineProperty(globalThis, name, {
    value: createStorage(),
    configurable: true,
    writable: true
  })

defineStorage('localStorage')
defineStorage('sessionStorage')
