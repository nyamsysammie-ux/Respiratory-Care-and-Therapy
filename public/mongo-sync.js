/*
 * Tricent MongoDB sync add-on.
 * Add ONE line to your index.html, BEFORE your other scripts:
 *   <script src="mongo-sync.js"></script>
 *
 * What it does:
 *  - On page load it pulls saved data from MongoDB into localStorage, so your
 *    existing app code keeps working unchanged.
 *  - Whenever your app changes localStorage, the change is sent to MongoDB.
 *  - The very first time (empty database) it uploads what is already in this
 *    browser's localStorage, so nothing is lost.
 */
(function () {
  "use strict";

  var CONFIG = {
    API: "/api", // same server that serves the app
    TOKEN: "", // must equal SYNC_TOKEN in .env, only if you set one
    // keys that should stay on each device and NOT go to MongoDB
    EXCLUDE: [/theme/i, /font.?size/i, /^lang/i],
    INTERVAL_MS: 2000,
  };

  var ls;
  try {
    ls = window.localStorage;
    ls.getItem("__probe__");
  } catch (e) {
    return; // localStorage blocked, nothing to sync
  }

  function skip(key) {
    for (var i = 0; i < CONFIG.EXCLUDE.length; i++) {
      if (CONFIG.EXCLUDE[i].test(key)) return true;
    }
    return false;
  }

  function authHeaders() {
    var h = { "Content-Type": "application/json" };
    if (CONFIG.TOKEN) h["x-sync-token"] = CONFIG.TOKEN;
    return h;
  }

  // snapshot = what MongoDB is known to hold for this browser
  var snapshot = {};
  var status = { online: false, lastSync: null, error: null };

  // ---- 1. Pull (synchronous so it finishes before your app scripts run) ----
  var remote = null;
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", CONFIG.API + "/store", false);
    if (CONFIG.TOKEN) xhr.setRequestHeader("x-sync-token", CONFIG.TOKEN);
    xhr.send();
    if (xhr.status === 200) remote = JSON.parse(xhr.responseText).items || {};
    else status.error = "Server answered " + xhr.status;
  } catch (e) {
    status.error = String(e);
  }

  var i, k;
  if (remote === null) {
    // Server unreachable: keep working locally, only sync later changes.
    console.warn("[mongo-sync] Server not reachable, working offline.", status.error);
    for (i = 0; i < ls.length; i++) {
      k = ls.key(i);
      if (!skip(k)) snapshot[k] = ls.getItem(k);
    }
  } else {
    status.online = true;
    var remoteKeys = Object.keys(remote);
    if (remoteKeys.length > 0) {
      // Database already has data: it wins over this browser's copy.
      remoteKeys.forEach(function (key) {
        if (skip(key)) return;
        ls.setItem(key, remote[key]);
        snapshot[key] = remote[key];
      });
    }
    // If the database is empty, snapshot stays empty, so the first flush
    // uploads everything already in localStorage (migration).
  }

  // ---- 2. Push changes ----
  var inflight = false;

  function diff() {
    var set = {}, remove = [], n = 0, key, val, j;
    for (j = 0; j < ls.length; j++) {
      key = ls.key(j);
      if (skip(key)) continue;
      val = ls.getItem(key);
      if (snapshot[key] !== val) {
        set[key] = val;
        n++;
      }
    }
    for (key in snapshot) {
      if (Object.prototype.hasOwnProperty.call(snapshot, key) && ls.getItem(key) === null) {
        remove.push(key);
        n++;
      }
    }
    return n ? { set: set, remove: remove } : null;
  }

  function flush() {
    if (inflight) return;
    var d = diff();
    if (!d) return;
    inflight = true;
    fetch(CONFIG.API + "/store/batch", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(d),
      keepalive: true,
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Server answered " + r.status);
        Object.keys(d.set).forEach(function (key) {
          snapshot[key] = d.set[key];
        });
        d.remove.forEach(function (key) {
          delete snapshot[key];
        });
        status.online = true;
        status.lastSync = new Date().toISOString();
        status.error = null;
      })
      .catch(function (e) {
        status.online = false;
        status.error = String(e);
      })
      .then(function () {
        inflight = false;
      });
  }

  // Catch changes quickly when the app uses setItem/removeItem...
  var rawSet = Storage.prototype.setItem;
  var rawRemove = Storage.prototype.removeItem;
  var timer = null;
  function soon() {
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }
  Storage.prototype.setItem = function () {
    rawSet.apply(this, arguments);
    if (this === ls) soon();
  };
  Storage.prototype.removeItem = function () {
    rawRemove.apply(this, arguments);
    if (this === ls) soon();
  };

  // ...and as a safety net, check regularly and when the tab is closed.
  setInterval(flush, CONFIG.INTERVAL_MS);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  flush(); // first upload (migration) happens right away

  window.MongoSync = { flush: flush, status: function () { return status; } };
})();
