/*
 * Tricent MongoDB sync: saved data (localStorage) <-> MongoDB, with sign-in.
 * Add to index.html BEFORE your other scripts:
 *   <script src="mongo-sync.js"></script>
 *   <script src="mongo-files.js"></script>
 *
 *  - Pulls saved data from the server before your app starts, so your app
 *    code keeps working unchanged.
 *  - Sends every change to the server. If someone else changed the same list
 *    at the same time, the server merges both changes instead of overwriting.
 *  - If you are not signed in, sends you to /login.html.
 */
(function () {
  "use strict";

  var CONFIG = {
    API: "/api",
    LOGIN_URL: "/login.html",
    // Keys that stay on each device and are NOT shared (settings, who is logged in on this device...)
    EXCLUDE: [/^mongo-sync\./, /theme/i, /font/i, /^tsmhst\.lang$/, /lang/i, /session/i, /current.?user/i, /token/i, /remember/i],
    INTERVAL_MS: 2000, // how often changes are checked
    POLL_MS: 20000, // how often other people's changes are checked
    SHOW_SIGNOUT: true,
    CLEAR_LOCAL_ON_SIGNOUT: true, // wipe this device's copy of the data when signing out
  };

  var ls;
  try {
    ls = window.localStorage;
    ls.getItem("__probe__");
  } catch (e) {
    return;
  }
  var rawSet = Storage.prototype.setItem;
  var rawRemove = Storage.prototype.removeItem;

  function skip(key) {
    for (var i = 0; i < CONFIG.EXCLUDE.length; i++) if (CONFIG.EXCLUDE[i].test(key)) return true;
    return false;
  }
  function lsGet(k) {
    return ls.getItem(k);
  }
  function lsSet(k, v) {
    rawSet.call(ls, k, v);
  }
  function lsDel(k) {
    rawRemove.call(ls, k);
  }

  function goLogin() {
    try {
      document.documentElement.style.visibility = "hidden";
    } catch (e) {}
    location.replace(CONFIG.LOGIN_URL + "?next=" + encodeURIComponent(location.pathname + location.search));
  }

  // ---------- tiny notice bar ----------
  var notice = null;
  function notify(text, withRefresh) {
    function show() {
      if (!notice) {
        notice = document.createElement("div");
        notice.setAttribute("role", "status");
        notice.style.cssText =
          "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;max-width:92vw;" +
          "background:#1f2a1c;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:10px 14px;border-radius:10px;" +
          "box-shadow:0 4px 18px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center";
        document.body.appendChild(notice);
      }
      notice.textContent = "";
      var span = document.createElement("span");
      span.textContent = text;
      notice.appendChild(span);
      if (withRefresh) {
        var b = document.createElement("button");
        b.textContent = "Refresh";
        b.style.cssText = "background:#7ac143;color:#10200a;border:0;border-radius:6px;padding:6px 10px;font:inherit;font-weight:600;cursor:pointer";
        b.onclick = function () {
          location.reload();
        };
        notice.appendChild(b);
      }
      var x = document.createElement("button");
      x.textContent = "x";
      x.setAttribute("aria-label", "Dismiss");
      x.style.cssText = "background:none;border:0;color:#fff;font:inherit;cursor:pointer;opacity:.7";
      x.onclick = function () {
        notice.remove();
        notice = null;
      };
      notice.appendChild(x);
    }
    if (document.body) show();
    else document.addEventListener("DOMContentLoaded", show);
  }
  window.MongoSyncUI = { notify: notify, goLogin: goLogin };

  // ---------- state ----------
  var appView = {}; // key -> last value the APP wrote/loaded (merge base)
  var seen = {}; // key -> last value we saw in localStorage
  var revs = {}; // key -> server revision we know
  var me = null;
  var status = { online: false, lastSync: null, error: null, user: null };

  function headers() {
    return { "Content-Type": "application/json", "X-Requested-With": "portal" };
  }

  // ---------- 1. pull before the app starts (synchronous on purpose) ----------
  var pending = {};
  try {
    pending = JSON.parse(lsGet("mongo-sync.pending") || "{}") || {};
  } catch (e) {
    pending = {};
  }

  var remote = null;
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", CONFIG.API + "/store", false);
    xhr.setRequestHeader("X-Requested-With", "portal");
    xhr.send();
    if (xhr.status === 200) {
      var parsed = JSON.parse(xhr.responseText);
      remote = parsed.items || {};
      me = parsed.user || null;
      status.user = me;
    } else if (xhr.status === 401 || xhr.status === 403) {
      goLogin();
      return;
    } else {
      status.error = "Server answered " + xhr.status;
    }
  } catch (e) {
    status.error = String(e);
  }

  var i, k;
  if (remote === null) {
    console.warn("[mongo-sync] Server not reachable, working offline.", status.error);
    for (i = 0; i < ls.length; i++) {
      k = ls.key(i);
      if (skip(k)) continue;
      seen[k] = lsGet(k);
      appView[k] = Object.prototype.hasOwnProperty.call(pending, k) ? pending[k].from : lsGet(k);
    }
  } else {
    status.online = true;
    Object.keys(remote).forEach(function (key) {
      if (skip(key)) return;
      revs[key] = remote[key].rev;
      if (Object.prototype.hasOwnProperty.call(pending, key)) {
        // this device has changes that were never sent: keep them, merge later
        appView[key] = pending[key].from;
        seen[key] = lsGet(key);
      } else {
        lsSet(key, remote[key].v);
        appView[key] = remote[key].v;
        seen[key] = remote[key].v;
      }
    });
    // keys only on this device (first run / migration): appView stays undefined so they upload as new
    for (i = 0; i < ls.length; i++) {
      k = ls.key(i);
      if (skip(k) || Object.prototype.hasOwnProperty.call(seen, k)) continue;
      seen[k] = lsGet(k);
      if (Object.prototype.hasOwnProperty.call(pending, k)) appView[k] = pending[k].from;
    }
  }

  // ---------- 2. push changes ----------
  var inflight = false;

  function collect() {
    var changes = [], removes = [], key, val, j;
    for (j = 0; j < ls.length; j++) {
      key = ls.key(j);
      if (skip(key)) continue;
      val = lsGet(key);
      if (seen[key] !== val) {
        changes.push({ key: key, from: appView[key] === undefined ? null : appView[key], to: val });
      }
    }
    for (key in seen) {
      if (Object.prototype.hasOwnProperty.call(seen, key) && lsGet(key) === null) {
        removes.push({ key: key, from: appView[key] === undefined ? null : appView[key] });
      }
    }
    return changes.length || removes.length ? { changes: changes, removes: removes } : null;
  }

  function savePending(batch) {
    try {
      var p = {};
      batch.changes.forEach(function (c) {
        p[c.key] = { from: c.from };
      });
      batch.removes.forEach(function (c) {
        p[c.key] = { from: c.from };
      });
      rawSet.call(ls, "mongo-sync.pending", JSON.stringify(p));
    } catch (e) {}
  }
  function clearPending() {
    try {
      lsDel("mongo-sync.pending");
    } catch (e) {}
  }

  function flush() {
    if (inflight) return Promise.resolve(false);
    var batch = collect();
    if (!batch) {
      clearPending();
      return Promise.resolve(true);
    }
    inflight = true;
    return fetch(CONFIG.API + "/store/batch", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(batch),
      keepalive: JSON.stringify(batch).length < 60000,
    })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          savePending(batch);
          goLogin();
          throw new Error("signed out");
        }
        if (!r.ok) throw new Error("Server answered " + r.status);
        return r.json();
      })
      .then(function (data) {
        var results = data.results || {};
        var mergedAny = false;
        batch.changes.forEach(function (c) {
          var res = results[c.key];
          if (!res) return;
          if (res.error === "forbidden" || res.error === "invalid") {
            console.warn("[mongo-sync] Not saved to the server (" + res.error + "): " + c.key);
            appView[c.key] = c.to;
            seen[c.key] = c.to;
            return;
          }
          if (res.error) return; // busy: retry next round
          appView[c.key] = c.to; // the app's own value stays the merge base
          revs[c.key] = res.rev;
          seen[c.key] = c.to;
          if (res.value !== c.to && lsGet(c.key) === c.to) {
            // server combined my change with someone else's
            lsSet(c.key, res.value);
            seen[c.key] = res.value;
            mergedAny = true;
          }
        });
        batch.removes.forEach(function (c) {
          var res = results[c.key];
          if (!res) return;
          if (res.removed) {
            delete appView[c.key];
            delete seen[c.key];
            delete revs[c.key];
          } else if (res.value !== undefined) {
            // someone else changed it after I last saw it: restore their version
            lsSet(c.key, res.value);
            appView[c.key] = res.value;
            seen[c.key] = res.value;
            revs[c.key] = res.rev;
            mergedAny = true;
          } else {
            delete seen[c.key];
            delete appView[c.key];
          }
        });
        status.online = true;
        status.error = null;
        status.lastSync = new Date().toISOString();
        if (!collect()) clearPending();
        if (mergedAny) notify("Another user changed some of the same data. Refresh to see everything.", true);
        return true;
      })
      .catch(function (e) {
        status.online = false;
        status.error = String(e);
        savePending(batch);
        return false;
      })
      .then(function (ok) {
        inflight = false;
        return ok;
      });
  }

  // catch changes quickly when the app uses setItem / removeItem...
  var timer = null;
  function soon() {
    clearTimeout(timer);
    timer = setTimeout(flush, 400);
  }
  Storage.prototype.setItem = function () {
    rawSet.apply(this, arguments);
    if (this === ls) soon();
  };
  Storage.prototype.removeItem = function () {
    rawRemove.apply(this, arguments);
    if (this === ls) soon();
  };
  // ...and check regularly as a safety net
  setInterval(flush, CONFIG.INTERVAL_MS);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  flush();

  // ---------- 3. see other people's changes ----------
  function pollRemote() {
    if (document.visibilityState === "hidden" || inflight) return;
    fetch(CONFIG.API + "/store/revs", { headers: { "X-Requested-With": "portal" } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          goLogin();
          throw new Error("signed out");
        }
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data) return;
        var changed = [], key;
        for (key in data.revs) {
          if (!skip(key) && revs[key] !== data.revs[key]) changed.push(key);
        }
        var gone = [];
        for (key in revs) {
          if (!(key in data.revs)) gone.push(key);
        }
        if (!changed.length && !gone.length) return;
        var p = changed.length
          ? fetch(CONFIG.API + "/store?keys=" + encodeURIComponent(changed.join(",")), { headers: { "X-Requested-With": "portal" } }).then(function (r) {
              return r.json();
            })
          : Promise.resolve({ items: {} });
        return p.then(function (d) {
          var updated = false;
          Object.keys(d.items || {}).forEach(function (key) {
            var now = lsGet(key);
            if ((now === null ? undefined : now) !== seen[key]) return; // I have unsent edits here: they will be merged on save
            if (now !== d.items[key].v) updated = true;
            lsSet(key, d.items[key].v);
            seen[key] = d.items[key].v;
            revs[key] = d.items[key].rev;
          });
          gone.forEach(function (key) {
            if (lsGet(key) !== seen[key]) return;
            lsDel(key);
            delete seen[key];
            delete revs[key];
            updated = true;
          });
          if (updated) notify("New data from another user is available.", true);
        });
      })
      .catch(function () {});
  }
  setInterval(pollRemote, CONFIG.POLL_MS);

  // ---------- 4. sign out ----------
  function signOut() {
    var go = function () {
      return fetch(CONFIG.API + "/auth/logout", { method: "POST", headers: headers() }).catch(function () {});
    };
    flush()
      .then(function (ok) {
        if (!ok && collect() && !window.confirm("Some changes could not be saved yet. Sign out anyway and lose them?")) {
          return false;
        }
        return Promise.resolve(window.MongoFiles ? window.MongoFiles.flush() : true).then(function () {
          return go().then(function () {
            if (CONFIG.CLEAR_LOCAL_ON_SIGNOUT) {
              var keys = [], j;
              for (j = 0; j < ls.length; j++) if (!skip(ls.key(j))) keys.push(ls.key(j));
              keys.forEach(lsDel);
              clearPending();
              try {
                rawSet.call(ls, "mongo-sync.wipe", "1");
              } catch (e) {}
            }
            location.replace(CONFIG.LOGIN_URL);
            return true;
          });
        });
      })
      .catch(function () {});
  }

  function addSignOutButton() {
    if (!CONFIG.SHOW_SIGNOUT || !me) return;
    var b = document.createElement("button");
    b.textContent = "Sign out (" + (me.name || me.username) + ")";
    b.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:2147483000;opacity:.55;background:#fff;color:#222;border:1px solid #bbb;" +
      "border-radius:14px;padding:4px 10px;font:12px system-ui,sans-serif;cursor:pointer";
    b.onmouseenter = function () {
      b.style.opacity = "1";
    };
    b.onmouseleave = function () {
      b.style.opacity = ".55";
    };
    b.onclick = signOut;
    document.body.appendChild(b);
  }
  if (document.body) addSignOutButton();
  else document.addEventListener("DOMContentLoaded", addSignOutButton);

  window.MongoSync = {
    flush: flush,
    signOut: signOut,
    status: function () {
      return status;
    },
    keys: function () {
      var out = { synced: [], local_only: [] }, j, key;
      for (j = 0; j < ls.length; j++) {
        key = ls.key(j);
        (skip(key) ? out.local_only : out.synced).push(key);
      }
      return out;
    },
  };
})();
