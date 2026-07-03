/* To-Do Life Dashboard — application entry point */

// ---------------------------------------------------------------------------
// StorageService — safe localStorage wrapper (Requirements 5.1, 5.2, 5.3)
// ---------------------------------------------------------------------------
const StorageService = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback; // malformed JSON - silent recovery
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
