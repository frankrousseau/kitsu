export default {
  runPromiseMapAsSeries(array, promise) {
    return array.reduce((accumulatorPromise, item) => {
      return accumulatorPromise.then(() => promise(item))
    }, Promise.resolve())
  },

  runPromiseAsSeries(promises) {
    return promises.reduce((accumulatorPromise, promise) => {
      return accumulatorPromise.then(() => promise)
    }, Promise.resolve())
  },

  throttle(fn, delay) {
    let lastCall = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastCall < delay) return
      lastCall = now
      return fn(...args)
    }
  },

  debounce(fn, delay) {
    let timeout = null
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn.apply(this, args), delay)
    }
  }
}
