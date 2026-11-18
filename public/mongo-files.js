/*
 * Tricent MongoDB file sync: IndexedDB (photos, payment proofs, assignment files) <-> MongoDB.
 * Add to index.html right after mongo-sync.js and BEFORE your other scripts:
 *   <script src="mongo-files.js"></script>
 *
 * It watches your app's IndexedDB writes (no changes to your app code needed):
 *  - new/changed records are copied to the server; files go to MongoDB GridFS
 *  - deleted records are marked deleted on the server
 *  - when the app opens a database, records missing on this device are restored
 *    from the server, and records only on this device are uploaded
 */
(function () {
  "use strict";
  if (!window.indexedDB || !window.IDBFactory || !window.IDBObjectStore) return;

  var CONFIG = {
    API: "/api",
    ONLY_DBS: [], // e.g. ["tsmhst"]; empty = every database the app opens
    SKIP_DBS: [/^mongo-/, /^firebase/i, /^workbox/i, /^localforage-cache/i],
    MAX_FILE_MB: 20, // keep equal to MAX_FILE_MB on the server
  };
  var MAX_BYTES = CONFIG.MAX_FILE_MB * 1024 * 1024;

  var HDR = { "X-Requested-With": "portal" };
  var origOpen = IDBFactory.prototype.open;
  var origPut = IDBObjectStore.prototype.put;
  var origAdd = IDBObjectStore.prototype.add;
  var origDelete = IDBObjectStore.prototype.delete;
  var origClear = IDBObjectStore.prototype.clear;

  var suppress = 0; // >0 while we write restored data, so it is not re-uploaded
  var known = {};
  var status = { queued: 0, sent: 0, restored: 0, errors: [], disabled: false };

  function ui() {
    return window.MongoSyncUI;
  }
  function tracked(name) {
    if (status.disabled) return false;
    var i;
    for (i = 0; i < CONFIG.SKIP_DBS.length; i++) if (CONFIG.SKIP_DBS[i].test(name)) return false;
    if (CONFIG.ONLY_DBS.length) return CONFIG.ONLY_DBS.indexOf(name) >= 0;
    return true;
  }
  function err(msg, e) {
    status.errors.push(msg + (e ? ": " + e : ""));
    if (status.errors.length > 20) status.errors.shift();
    console.warn("[mongo-files] " + msg, e || "");
  }
  function rememberDb(name) {
    if (known[name]) return;
    known[name] = true;
    try {
      window.localStorage.setItem("mongo-sync.dbs", JSON.stringify(Object.keys(known)));
    } catch (e) {}
  }

  // ---------- value <-> JSON text ----------
  var uploads = new WeakMap();

  function uploadBlob(blob) {
    if (uploads.has(blob)) return uploads.get(blob);
    var p;
    if (blob.size > MAX_BYTES) {
      p = Promise.reject(new Error("file larger than " + CONFIG.MAX_FILE_MB + " MB"));
    } else if (blob.size === 0) {
      p = Promise.resolve("");
    } else {
      p = fetch(CONFIG.API + "/files", {
        method: "POST",
        headers: Object.assign({ "Content-Type": blob.type || "application/octet-stream", "X-File-Name": encodeURIComponent(blob.name || "file") }, HDR),
        body: blob,
      }).then(function (r) {
        if (!r.ok) throw new Error("upload failed (" + r.status + ")");
        return r.json().then(function (j) {
          return j.id;
        });
      });
    }
    uploads.set(blob, p);
    return p;
  }

  function isBytes(v) {
    return v instanceof ArrayBuffer || ArrayBuffer.isView(v);
  }

  function enc(v) {
    var t = typeof v;
    if (v === undefined || v === null) return Promise.resolve(null);
    if (t === "boolean" || t === "string") return Promise.resolve(v);
    if (t === "number") return Promise.resolve(isFinite(v) ? v : { __t: "num", v: String(v) });
    if (t === "bigint") return Promise.resolve({ __t: "big", v: v.toString() });
    if (v instanceof Date) return Promise.resolve({ __t: "date", v: v.getTime() });
    if (v instanceof Blob) {
      return uploadBlob(v).then(function (id) {
        return { __t: "blob", id: id, type: v.type, size: v.size, name: v.name, lm: v.lastModified };
      });
    }
    if (isBytes(v)) {
      var kind = v instanceof ArrayBuffer ? "ArrayBuffer" : v.constructor.name;
      var u8 = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      return uploadBlob(new Blob([u8])).then(function (id) {
        return { __t: "buf", id: id, kind: kind, size: u8.byteLength };
      });
    }
    if (Array.isArray(v)) return Promise.all(v.map(enc));
    if (v instanceof Map) {
      return Promise.all(Array.from(v.entries()).map(function (e) {
        return Promise.all([enc(e[0]), enc(e[1])]);
      })).then(function (arr) {
        return { __t: "map", v: arr };
      });
    }
    if (v instanceof Set) {
      return Promise.all(Array.from(v.values()).map(enc)).then(function (arr) {
        return { __t: "set", v: arr };
      });
    }
    if (t === "object") {
      var keys = Object.keys(v);
      return Promise.all(keys.map(function (k) {
        return enc(v[k]);
      })).then(function (vals) {
        var o = {};
        keys.forEach(function (k, i) {
          o[k] = vals[i];
        });
        return Object.prototype.hasOwnProperty.call(v, "__t") ? { __t: "obj", v: o } : o;
      });
    }
    return Promise.resolve(null); // functions etc. cannot be stored in IndexedDB anyway
  }

  var blobCache = {};
  function download(id) {
    if (!blobCache[id]) {
      blobCache[id] = id
        ? fetch(CONFIG.API + "/files/" + id, { headers: HDR }).then(function (r) {
            if (!r.ok) throw new Error("download failed (" + r.status + ")");
            return r.blob();
          })
        : Promise.resolve(new Blob([]));
    }
    return blobCache[id];
  }

  function dec(v) {
    if (v === null || typeof v !== "object") return Promise.resolve(v);
    if (Array.isArray(v)) return Promise.all(v.map(dec));
    switch (v.__t) {
      case "num":
        return Promise.resolve(Number(v.v));
      case "big":
        return Promise.resolve(BigInt(v.v));
      case "date":
        return Promise.resolve(new Date(v.v));
      case "blob":
        return download(v.id).then(function (b) {
          var blob = b.slice(0, b.size, v.type || b.type);
          if (v.name !== undefined && typeof File === "function") {
            try {
              return new File([blob], v.name, { type: v.type, lastModified: v.lm });
            } catch (e) {}
          }
          return blob;
        });
      case "buf":
        return download(v.id).then(function (b) {
          return b.arrayBuffer().then(function (ab) {
            if (v.kind === "ArrayBuffer") return ab;
            var C = window[v.kind];
            return C ? new C(ab) : new Uint8Array(ab);
          });
        });
      case "map":
        return Promise.all(v.v.map(function (e) {
          return Promise.all([dec(e[0]), dec(e[1])]);
        })).then(function (arr) {
          return new Map(arr);
        });
      case "set":
        return Promise.all(v.v.map(dec)).then(function (arr) {
          return new Set(arr);
        });
      case "obj":
        return decObject(v.v);
      default:
        return decObject(v);
    }
  }
  function decObject(o) {
    var keys = Object.keys(o);
    return Promise.all(keys.map(function (k) {
      return dec(o[k]);
    })).then(function (vals) {
      var out = {};
      keys.forEach(function (k, i) {
        out[k] = vals[i];
      });
      return out;
    });
  }

  function encKey(k) {
    // keys never hold blobs; Dates/arrays/numbers/strings only
    if (k instanceof Date) return { __t: "date", v: k.getTime() };
    if (Array.isArray(k)) return k.map(encKey);
    if (typeof k === "number" && !isFinite(k)) return { __t: "num", v: String(k) };
    if (k instanceof ArrayBuffer || ArrayBuffer.isView(k)) return null;
    return k;
  }
  function decKey(k) {
    if (k && typeof k === "object" && !Array.isArray(k)) {
      if (k.__t === "date") return new Date(k.v);
      if (k.__t === "num") return Number(k.v);
    }
    if (Array.isArray(k)) return k.map(decKey);
    return k;
  }

  function getPath(obj, path) {
    var parts = String(path).split("."), o = obj, i;
    for (i = 0; i < parts.length; i++) {
      if (o === null || o === undefined) return undefined;
      o = o[parts[i]];
    }
    return o;
  }
  function setPath(obj, path, val) {
    var parts = String(path).split("."), o = obj, i;
    for (i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] === null || typeof o[parts[i]] !== "object") o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
  }

  // ---------- upload queue ----------
  var queue = [];
  var running = false;
  var idleWaiters = [];

  function enqueue(task) {
    queue.push(task);
    status.queued = queue.length;
    if (!running) run();
  }

  function run() {
    running = true;
    var batch = queue.splice(0, queue.length);
    status.queued = 0;
    Promise.all(batch.map(function (t) {
      return t();
    }))
      .then(function (ops) {
        ops = ops.filter(Boolean);
        var chunks = [], i;
        for (i = 0; i < ops.length; i += 40) chunks.push(ops.slice(i, i + 40));
        return chunks.reduce(function (p, c) {
          return p.then(function () {
            return fetch(CONFIG.API + "/idb/batch", {
              method: "POST",
              headers: Object.assign({ "Content-Type": "application/json" }, HDR),
              body: JSON.stringify({ ops: c }),
            }).then(function (r) {
              if (r.status === 401 || r.status === 403) {
                if (ui()) ui().goLogin();
                throw new Error("signed out");
              }
              if (!r.ok) throw new Error("server answered " + r.status);
              status.sent += c.length;
            });
          });
        }, Promise.resolve());
      })
      .catch(function (e) {
        err("could not send files to the server", e && e.message);
      })
      .then(function () {
        running = false;
        if (queue.length) run();
        else {
          var w = idleWaiters.splice(0, idleWaiters.length);
          w.forEach(function (f) {
            f();
          });
        }
      });
  }

  function whenIdle() {
    return new Promise(function (resolve) {
      if (!running && !queue.length) resolve();
      else idleWaiters.push(resolve);
    });
  }

  function putTask(db, store, key, clone) {
    return function () {
      return enc(clone).then(
        function (value) {
          return { op: "put", db: db, store: store, key: JSON.stringify(encKey(key)), value: JSON.stringify(value) };
        },
        function (e) {
          err("skipped one record in " + store, e && e.message);
          return null;
        }
      );
    };
  }

  // ---------- watch the app's writes ----------
  function watchWrite(orig) {
    return function (value, key) {
      var req = orig.apply(this, arguments);
      try {
        var store = this;
        var dbName = store.transaction.db.name;
        if (suppress || !tracked(dbName)) return req;
        var storeName = store.name;
        var keyPath = store.keyPath;
        var clone;
        try {
          clone = structuredClone(value);
        } catch (e) {
          err("cannot copy a record in " + storeName, e && e.message);
          return req;
        }
        var ok = false, newKey = null;
        req.addEventListener("success", function () {
          ok = true;
          newKey = req.result;
        });
        store.transaction.addEventListener("complete", function () {
          if (!ok) return;
          if (keyPath !== null && keyPath !== undefined && typeof keyPath === "string" && clone && typeof clone === "object") {
            if (getPath(clone, keyPath) === undefined) setPath(clone, keyPath, newKey);
          }
          enqueue(putTask(dbName, storeName, newKey, clone));
        });
      } catch (e) {
        err("could not watch a write", e && e.message);
      }
      return req;
    };
  }
  IDBObjectStore.prototype.put = watchWrite(origPut);
  IDBObjectStore.prototype.add = watchWrite(origAdd);

  IDBObjectStore.prototype.delete = function (key) {
    var req = origDelete.apply(this, arguments);
    try {
      var store = this;
      var dbName = store.transaction.db.name;
      if (suppress || !tracked(dbName)) return req;
      if (typeof IDBKeyRange !== "undefined" && key instanceof IDBKeyRange) {
        err("range delete in " + store.name + " is not synced");
        return req;
      }
      var storeName = store.name;
      var ok = false;
      req.addEventListener("success", function () {
        ok = true;
      });
      store.transaction.addEventListener("complete", function () {
        if (!ok) return;
        enqueue(function () {
          return Promise.resolve({ op: "delete", db: dbName, store: storeName, key: JSON.stringify(encKey(key)) });
        });
      });
    } catch (e) {
      err("could not watch a delete", e && e.message);
    }
    return req;
  };

  IDBObjectStore.prototype.clear = function () {
    var req = origClear.apply(this, arguments);
    try {
      var store = this;
      var dbName = store.transaction.db.name;
      if (suppress || !tracked(dbName)) return req;
      var storeName = store.name;
      var ok = false;
      req.addEventListener("success", function () {
        ok = true;
      });
      store.transaction.addEventListener("complete", function () {
        if (!ok) return;
        enqueue(function () {
          return Promise.resolve({ op: "clear", db: dbName, store: storeName });
        });
      });
    } catch (e) {
      err("could not watch clear()", e && e.message);
    }
    return req;
  };

  // ---------- when the app opens a database: restore + upload what is missing ----------
  IDBFactory.prototype.open = function (name) {
    var req = origOpen.apply(this, arguments);
    try {
      if (tracked(name)) {
        rememberDb(name);
        req.addEventListener("success", function () {
          setTimeout(function () {
            scheduleReconcile(name);
          }, 0);
        });
      }
    } catch (e) {
      err("could not watch open()", e && e.message);
    }
    return req;
  };

  function reqP(r) {
    return new Promise(function (resolve, reject) {
      r.onsuccess = function () {
        resolve(r.result);
      };
      r.onerror = function () {
        reject(r.error);
      };
    });
  }

  // Runs once per database per page load (apps often open the same database many times).
  var reconciled = {};
  var lastTry = {};
  function scheduleReconcile(name) {
    var now = Date.now();
    if (reconciled[name] || (lastTry[name] && now - lastTry[name] < 30000)) return;
    lastTry[name] = now;
    reconcile(name).then(
      function () {
        reconciled[name] = true;
      },
      function (e) {
        err("sync of database " + name + " failed", e && e.message);
      }
    );
  }

  function reconcile(name) {
    return fetch(CONFIG.API + "/idb?db=" + encodeURIComponent(name), { headers: HDR }).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        if (ui()) ui().goLogin();
        throw new Error("signed out");
      }
      if (!r.ok) throw new Error("server answered " + r.status);
      return r.json().then(function (data) {
        var byStore = {};
        data.records.forEach(function (rec) {
          (byStore[rec.store] = byStore[rec.store] || {})[rec.key] = rec;
        });
        // our own short-lived connection, so the app closing its connection does not matter
        return new Promise(function (resolve, reject) {
          var o = origOpen.call(window.indexedDB, name);
          o.onerror = function () {
            reject(o.error);
          };
          o.onsuccess = function () {
            var conn = o.result;
            conn.onversionchange = function () {
              conn.close();
            };
            var stores = Array.prototype.slice.call(conn.objectStoreNames);
            stores
              .reduce(function (p, storeName) {
                return p.then(function () {
                  return reconcileStore(name, conn, storeName, byStore[storeName] || {});
                });
              }, Promise.resolve())
              .then(
                function () {
                  conn.close();
                  resolve();
                },
                function (e) {
                  conn.close();
                  reject(e);
                }
              );
          };
        });
      });
    });
  }

  function reconcileStore(dbName, db, storeName, serverRecs) {
    var tx = db.transaction(storeName, "readonly");
    var st = tx.objectStore(storeName);
    var keyPath = st.keyPath;
    return reqP(st.getAllKeys()).then(function (keys) {
      var local = {};
      keys.forEach(function (k) {
        local[JSON.stringify(encKey(k))] = { key: k };
      });

      // 1. server has it, this device does not (or server says deleted)
      var restore = [], removeLocal = [];
      Object.keys(serverRecs).forEach(function (ek) {
        var rec = serverRecs[ek];
        if (rec.deleted) {
          if (local[ek]) removeLocal.push(local[ek].key);
        } else if (!local[ek]) {
          restore.push(rec);
        }
      });
      // 2. this device has it, server has never heard of it: upload
      var restoredCount = 0;
      var chain = Promise.resolve();
      Object.keys(local).forEach(function (ek) {
        if (serverRecs[ek]) return;
        var item = local[ek];
        chain = chain.then(function () {
          return reqP(db.transaction(storeName, "readonly").objectStore(storeName).get(item.key))
            .then(function (value) {
              enqueue(putTask(dbName, storeName, item.key, structuredClone(value)));
            })
            .catch(function (e) {
              err("cannot upload a record in " + storeName, e && e.message);
            });
        });
      });
      restore.forEach(function (rec) {
        chain = chain.then(function () {
          return dec(JSON.parse(rec.value)).then(function (value) {
            return new Promise(function (resolve) {
              var key = decKey(JSON.parse(rec.key));
              var t = db.transaction(storeName, "readwrite");
              var s = t.objectStore(storeName);
              suppress++;
              try {
                var hasInline = keyPath !== null && keyPath !== undefined;
                var chk = s.getKey(key);
                chk.onsuccess = function () {
                  if (chk.result !== undefined) return; // app wrote it meanwhile
                  suppress++;
                  try {
                    if (hasInline) {
                      if (typeof keyPath === "string" && value && typeof value === "object" && getPath(value, keyPath) === undefined) {
                        setPath(value, keyPath, key);
                      }
                      origPut.call(s, value);
                    } else {
                      origPut.call(s, value, key);
                    }
                    restoredCount++;
                  } finally {
                    suppress--;
                  }
                };
              } finally {
                suppress--;
              }
              t.oncomplete = resolve;
              t.onerror = resolve;
              t.onabort = resolve;
            });
          }).catch(function (e) {
            err("could not restore a record in " + storeName, e && e.message);
          });
        });
      });
      removeLocal.forEach(function (k) {
        chain = chain.then(function () {
          return new Promise(function (resolve) {
            var t = db.transaction(storeName, "readwrite");
            suppress++;
            try {
              origDelete.call(t.objectStore(storeName), k);
            } finally {
              suppress--;
            }
            t.oncomplete = resolve;
            t.onerror = resolve;
            t.onabort = resolve;
          });
        });
      });
      return chain.then(function () {
        if (restoredCount || removeLocal.length) {
          status.restored += restoredCount;
          if (ui()) ui().notify("Files from the server were added to this device. Refresh to see them.", true);
        }
      });
    });
  }

  window.MongoFiles = {
    flush: whenIdle,
    status: function () {
      return status;
    },
  };
})();
