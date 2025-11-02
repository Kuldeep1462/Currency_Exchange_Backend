const store = new Map();

function set(key, value) {
  store.set(key, { value, ts: Date.now() });
}

function get(key, ttlSeconds = 60) {
  const item = store.get(key);
  if (!item) return null;
  const age = (Date.now() - item.ts) / 1000;
  if (age > ttlSeconds) {
    store.delete(key);
    return null;
  }
  return item.value;
}

function clear(key) {
  store.delete(key);
}

module.exports = { set, get, clear };
