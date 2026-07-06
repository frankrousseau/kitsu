// Quota exceeded or storage disabled must not crash the calling feature:
// losing a preference is fine.
const safeSetItem = (key, item) => {
  try {
    localStorage.setItem(key, item)
  } catch (err) {
    console.error(err)
  }
}

export default {
  setPreference(key, item) {
    safeSetItem(key, item)
  },

  getPreference(key) {
    return localStorage.getItem(key)
  },

  setBoolPreference(key, value) {
    safeSetItem(key, value ? 'true' : 'false')
  },

  getBoolPreference(key, defaultValue = false) {
    const item = this.getPreference(key)
    return item === null ? defaultValue : item === 'true'
  },

  getIntPreference(key, defaultValue = 0) {
    const item = this.getPreference(key)
    const value = parseInt(item, 10)
    return isNaN(value) ? defaultValue : value
  },

  setObjectPreference(key, data) {
    safeSetItem(key, JSON.stringify(data))
  },

  getObjectPreference(key) {
    const item = this.getPreference(key)
    try {
      return JSON.parse(item)
    } catch (e) {
      return null
    }
  }
}
