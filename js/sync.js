/* TSMHST Portal — optional Supabase cloud sync (free tier).
   Off by default: until an administrator configures a Supabase project
   (Admin → Document vault → Cloud sync), the portal stays purely local.

   When configured, records for documents, payments (with proof
   descriptors) and assignment submissions sync to one Postgres table
   (cloud_records, jsonb payloads) and file blobs sync to a Storage
   bucket. Every device pushes its changes and pulls everyone else's, so
   a registrar's upload reaches every student's phone and the size cap
   rises from 20 MB (offline) to 50 MB per file. */
const Sync = (function () {
  const TABLES = ['documents', 'payments', 'submissions', 'checkins'];
  const FILE_FIELD = { documents: 'fileId', payments: 'proofFileId', submissions: 'fileId', checkins: null };
  const PULL_KEY = 'tsmhst.cloud.lastPull';
  const UPLOADED_KEY = 'tsmhst.cloud.uploaded';
  const OFFLINE_MAX = 20 * 1024 * 1024;
  const CLOUD_MAX = 50 * 1024 * 1024;
  const PUSH_DEBOUNCE = 8000;
  const TOMBSTONE_LIMIT = 200;

  let cfg = null;
  let uploaded = {};
  let pushTimer = null;
  let syncing = false;
  let failedOnce = false;

  function init() {
    loadCfg();
    try { uploaded = JSON.parse(localStorage.getItem(UPLOADED_KEY) || '{}'); } catch (e) { uploaded = {}; }
    if (configured()) setTimeout(syncNow, 4000);
  }

  function loadCfg() {
    try {
      const c = DB.data.meta && DB.data.meta.cloud;
      cfg = c && c.url && c.key
        ? { url: String(c.url).replace(/\/+$/, ''), key: c.key, bucket: c.bucket || 'portal-files' }
        : null;
    } catch (e) { cfg = null; }
  }

  function reload() {
    loadCfg();
    if (configured()) setTimeout(syncNow, 1500);
  }

  function configured() {
    return !!(cfg && DB.data.meta && DB.data.meta.cloud && DB.data.meta.cloud.enabled !== false);
  }

  function fileCap() { return configured() ? CLOUD_MAX : OFFLINE_MAX; }
  function lastSyncedAt() { return (DB.data.meta && DB.data.meta.cloudSyncedAt) || ''; }

  function headers(json) {
    const h = { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  function revOf(rec) {
    return rec.updatedAt || rec.verifiedAt || rec.gradedAt || rec.checkOutAt || rec.checkInAt || rec.createdAt || new Date().toISOString();
  }

  function markDirty() {
    if (!configured() || syncing) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { push().catch(noop); }, PUSH_DEBOUNCE);
  }

  function noop() { /* errors handled in syncNow */ }

  function failOnce(err) {
    console.warn('Cloud sync:', err);
    if (failedOnce) return;
    failedOnce = true;
    setTimeout(() => { failedOnce = false; }, 10 * 60 * 1000);
    if (typeof toast === 'function') toast('Cloud sync could not reach the server. Changes stay saved on this device and retry automatically.', 'info');
  }

  async function syncNow() {
    if (!configured() || syncing) return { pushed: 0, pulled: 0 };
    syncing = true;
    let pushed = 0, pulled = 0;
    try {
      pushed = await push();
      pulled = await pull();
      DB.data.meta.cloudSyncedAt = new Date().toISOString();
      DB.save();
    } catch (err) { failOnce(err); }
    finally { syncing = false; }
    return { pushed, pulled };
  }

  /* ---------------- Push ---------------- */

  async function pushRows(rows) {
    const res = await fetch(cfg.url + '/rest/v1/cloud_records', {
      method: 'POST',
      headers: Object.assign(headers(true), { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(rows)
    });
    if (!res.ok) throw new Error('cloud push failed (' + res.status + ')');
  }

  async function push() {
    if (!configured()) return 0;
    const rows = [];
    for (const table of TABLES) {
      const list = DB.data[table] || [];
      for (const rec of list) {
        rows.push({ table_name: table, id: rec.id, payload: rec, updated_at: revOf(rec), deleted: false });
      }
    }
    const tombstones = DB.data.cloudTombstones || [];
    for (const t of tombstones) {
      rows.push({ table_name: t.table, id: t.id, payload: {}, updated_at: t.at, deleted: true });
    }
    if (rows.length) {
      for (let i = 0; i < rows.length; i += 200) await pushRows(rows.slice(i, i + 200));
    }
    for (const table of TABLES) {
      const list = DB.data[table] || [];
      for (const rec of list) {
        const fileId = rec[FILE_FIELD[table]];
        if (!fileId || uploaded[fileId]) continue;
        const blob = await Blobs.get(fileId);
        if (!blob) continue;
        await uploadFile(fileId, blob);
      }
    }
    return rows.length;
  }

  async function uploadFile(fileId, blob) {
    const res = await fetch(cfg.url + '/storage/v1/object/' + encodeURIComponent(cfg.bucket) + '/' + encodeURIComponent(fileId), {
      method: 'POST',
      headers: Object.assign(headers(false), {
        'Content-Type': blob.type || 'application/octet-stream',
        'x-upsert': 'true'
      }),
      body: blob
    });
    if (!res.ok) throw new Error('file upload failed (' + res.status + ')');
    uploaded[fileId] = true;
    persistUploaded();
  }

  function persistUploaded() {
    try { localStorage.setItem(UPLOADED_KEY, JSON.stringify(uploaded)); } catch (e) { /* ignore */ }
  }

  /* Deletion marker so other devices remove the record too. */
  function tombstone(table, id) {
    if (!configured()) return;
    if (!Array.isArray(DB.data.cloudTombstones)) DB.data.cloudTombstones = [];
    DB.data.cloudTombstones.push({ table, id, at: new Date().toISOString() });
    if (DB.data.cloudTombstones.length > TOMBSTONE_LIMIT) {
      DB.data.cloudTombstones = DB.data.cloudTombstones.slice(-TOMBSTONE_LIMIT);
    }
    DB.save();
    markDirty();
  }

  /* ---------------- Pull ---------------- */

  async function pullRows(sinceIso) {
    let q = 'select=*&table_name=in.(' + TABLES.join(',') + ')&order=updated_at.asc&limit=1000';
    if (sinceIso) q += '&updated_at=gt.' + encodeURIComponent(sinceIso);
    const res = await fetch(cfg.url + '/rest/v1/cloud_records?' + q, { headers: headers(false) });
    if (!res.ok) throw new Error('cloud pull failed (' + res.status + ')');
    return res.json();
  }

  async function pull() {
    if (!configured()) return 0;
    const since = localStorage.getItem(PULL_KEY) || '';
    const rows = await pullRows(since);
    let changed = 0;
    let maxTs = since;
    for (const row of rows) {
      if (row.updated_at > maxTs) maxTs = row.updated_at;
      const list = DB.data[row.table_name];
      if (!list) continue;
      if (row.deleted) {
        const idx = list.findIndex(r => r.id === row.id);
        if (idx !== -1) { list.splice(idx, 1); changed++; }
        continue;
      }
      const rec = row.payload;
      if (!rec || !rec.id) continue;
      const idx = list.findIndex(r => r.id === rec.id);
      if (idx === -1) {
        list.push(rec);
        changed++;
        prefetchFile(rec, row.table_name);
      } else if (row.updated_at > revOf(list[idx])) {
        list[idx] = rec;
        changed++;
        prefetchFile(rec, row.table_name);
      }
    }
    if (changed) DB.save();
    localStorage.setItem(PULL_KEY, maxTs || new Date().toISOString());
    return changed;
  }

  function prefetchFile(rec, table) {
    const fileId = rec[FILE_FIELD[table]];
    if (!fileId) return;
    Blobs.get(fileId).then(b => { if (b) uploaded[fileId] = true, persistUploaded(); }).catch(noop);
  }

  /* Fallback used by Blobs.get when a file is missing locally — the
     registrar uploaded it on another device. */
  async function fetchFile(fileId) {
    if (!configured() || !fileId) return null;
    try {
      const res = await fetch(cfg.url + '/storage/v1/object/' + encodeURIComponent(cfg.bucket) + '/' + encodeURIComponent(fileId), { headers: headers(false) });
      if (!res.ok) return null;
      return await res.blob();
    } catch (e) { return null; }
  }

  async function testConnection(url, key) {
    try {
      const res = await fetch(String(url).replace(/\/+$/, '') + '/rest/v1/cloud_records?select=id&limit=1', {
        headers: { apikey: key, Authorization: 'Bearer ' + key }
      });
      if (res.ok) return { ok: true };
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'The key was rejected. Paste the anon public key from Supabase → Settings → API.' };
      if (res.status === 404) return { ok: false, error: 'The cloud_records table is missing. Run the setup SQL in the Supabase SQL editor first.' };
      return { ok: false, error: 'Supabase answered with status ' + res.status + '.' };
    } catch (e) {
      return { ok: false, error: 'Could not reach that project URL. Check the address (https://xxxx.supabase.co).' };
    }
  }

  return {
    init, reload, configured, config: () => cfg, fileCap, lastSyncedAt,
    markDirty, syncNow, tombstone, fetchFile, testConnection, TABLES
  };
})();
