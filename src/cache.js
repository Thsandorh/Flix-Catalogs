function clampInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function clampMs(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

// Small in-memory LRU cache with optional TTL.
// - Uses Map insertion order for LRU: newest at the end.
// - TTL is checked on get/has/set; expired entries are removed lazily.
function createLruTtlCache({ maxEntries = 1000, defaultTtlMs = 0 } = {}) {
  const max = Math.max(0, clampInt(maxEntries, 1000))
  const ttlDefault = Math.max(0, clampMs(defaultTtlMs, 0))
  const map = new Map()

  function nowMs() {
    return Date.now()
  }

  function isExpired(entry, now) {
    if (!entry) return true
    if (!entry.expiresAt) return false
    return entry.expiresAt <= now
  }

  function touch(key, entry) {
    // Move to the end (most recently used)
    map.delete(key)
    map.set(key, entry)
  }

  function evictIfNeeded() {
    if (!max) return
    while (map.size > max) {
      const oldestKey = map.keys().next().value
      if (oldestKey === undefined) break
      map.delete(oldestKey)
    }
  }

  function purgeSomeExpired() {
    // Avoid O(n) full sweeps; just trim a handful of oldest entries opportunistically.
    const now = nowMs()
    let checked = 0
    for (const [key, entry] of map) {
      if (checked >= 32) break
      checked += 1
      if (isExpired(entry, now)) map.delete(key)
    }
  }

  return {
    get(key) {
      const entry = map.get(key)
      if (!entry) return undefined
      const now = nowMs()
      if (isExpired(entry, now)) {
        map.delete(key)
        return undefined
      }
      touch(key, entry)
      return entry.value
    },
    has(key) {
      const entry = map.get(key)
      if (!entry) return false
      const now = nowMs()
      if (isExpired(entry, now)) {
        map.delete(key)
        return false
      }
      return true
    },
    set(key, value, ttlMs) {
      purgeSomeExpired()
      const ttl = Math.max(0, clampMs(ttlMs, ttlDefault))
      const expiresAt = ttl ? nowMs() + ttl : 0
      map.set(key, { value, expiresAt })
      evictIfNeeded()
    },
    delete(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    size() {
      return map.size
    }
  }
}

module.exports = {
  createLruTtlCache,
  clampInt,
  clampMs
}

