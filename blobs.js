/* TSMHST Portal — IndexedDB attachment store.
   File contents live in IndexedDB (free, built into every browser, holds
   hundreds of MB); the small record — id, name, mime, size — stays in
   localStorage. This raises the practical attachment cap from ~800 KB to
   ~20 MB per file without a backend. */
const Blobs = (function () {
  const DB_NAME = 'tsmhst.blobs.v1';
  const STORE = 'files';
  const VERSION = 1;
  let openPromise = null;

  function open() {
    if (openPromise) return openPromise;
    openPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('idb-unavailable')); return; }
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('idb-open-failed'));
      req.onblocked = () => reject(new Error('idb-blocked'));
    });
    openPromise.catch(() => { openPromise = null; });
    return openPromise;
  }

  function runTx(mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      let result;
      fn(t.objectStore(STORE), out => { result = out; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error || new Error('idb-transaction-failed'));
      t.onabort = () => reject(t.error || new Error('idb-transaction-aborted'));
    }));
  }

  async function ready() {
    try { await open(); return true; } catch (e) { return false; }
  }

  async function put(id, blob) {
    await runTx('readwrite', store => store.put(blob, id));
    return id;
  }

  async function get(id) {
    if (!id) return null;
    try {
      const local = await runTx('readonly', (store, out) => {
        const req = store.get(id);
        req.onsuccess = () => out(req.result || null);
      });
      if (local) return local;
    } catch (e) { /* fall through to cloud */ }
    // Missing locally (uploaded on another device) — fetch from Supabase
    // when cloud sync is configured, then cache it for offline use.
    if (typeof Sync !== 'undefined' && typeof Sync.fetchFile === 'function') {
      const remote = await Sync.fetchFile(id);
      if (remote) {
        try { await put(id, remote); } catch (e) { /* cache best-effort */ }
        return remote;
      }
    }
    return null;
  }

  async function del(id) {
    if (!id) return;
    try { await runTx('readwrite', store => store.delete(id)); } catch (e) { /* already gone */ }
  }

  async function keys() {
    try {
      return (await runTx('readonly', (store, out) => {
        const req = store.getAllKeys();
        req.onsuccess = () => out(req.result || []);
      })) || [];
    } catch (e) { return []; }
  }

  async function count() { return (await keys()).length; }

  /* One-time migration helper: turn a legacy base64 data URL stored in
     localStorage into a Blob so it can be moved into IndexedDB. */
  function fromDataURL(dataUrl) {
    try {
      const parts = String(dataUrl).split(',');
      if (parts.length !== 2 || parts[0].indexOf('data:') !== 0) return null;
      const mime = ((parts[0].match(/data:([^;]+)/) || [])[1]) || 'application/octet-stream';
      const bin = atob(parts[1]);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: mime });
    } catch (e) { return null; }
  }

  return { ready, put, get, del, keys, count, fromDataURL };
})();
