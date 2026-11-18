"use strict";
// The whole web server logic (no framework). `dl` is the data layer (MongoDB).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { mergeStrings } = require("./merge");
const auth = require("./auth");

const SID = "tsmhst_sid";
const ROLES = ["admin", "lecturer", "student"];
const MAX_JSON = 12 * 1024 * 1024;
const MAX_VALUE = 6 * 1024 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".pdf": "application/pdf",
};

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function createApp({ dl, config, env, publicDir }) {
  config = config || {};
  env = env || {};
  const root = path.resolve(publicDir);
  const sessionMs = (config.sessionDays || 7) * 86400000;
  const maxFile = (Number(env.MAX_FILE_MB) || 20) * 1024 * 1024;
  const limiter = new auth.LoginLimiter(); // per IP + username: 5 wrong passwords
  const userLimiter = new auth.LoginLimiter(20); // per username only, so faking the IP does not help

  // ---------- small helpers ----------
  function isHttps(req) {
    return !!(req.socket && req.socket.encrypted) || req.headers["x-forwarded-proto"] === "https";
  }

  function send(res, status, body, headers) {
    res.writeHead(status, Object.assign({ "Content-Length": Buffer.byteLength(body) }, headers));
    res.end(body);
  }

  function json(res, status, obj) {
    send(res, status, JSON.stringify(obj), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
  }

  function readBody(req, limit) {
    return new Promise((resolve, reject) => {
      const len = Number(req.headers["content-length"] || 0);
      if (len > limit) {
        req.resume();
        return reject(httpErr(413, "Too large"));
      }
      const chunks = [];
      let n = 0;
      let failed = false;
      req.on("data", (c) => {
        if (failed) return;
        n += c.length;
        if (n > limit) {
          failed = true;
          reject(httpErr(413, "Too large"));
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => {
        if (!failed) resolve(Buffer.concat(chunks));
      });
      req.on("error", (e) => reject(e));
    });
  }

  async function readJson(req) {
    const buf = await readBody(req, MAX_JSON);
    try {
      const v = JSON.parse(buf.toString("utf8") || "{}");
      if (v === null || typeof v !== "object") throw new Error("not an object");
      return v;
    } catch (e) {
      throw httpErr(400, "Invalid JSON");
    }
  }

  function publicUser(a) {
    return { username: a.username, name: a.name || a.username, role: a.role, mustChange: !!a.mustChange };
  }

  async function getSession(req) {
    const sid = auth.parseCookies(req.headers.cookie)[SID];
    if (!sid) return null;
    const tokenHash = auth.sha256(sid);
    const s = await dl.sessionGet(tokenHash);
    if (!s || s.expiresAtMs < Date.now()) return null;
    const acct = await dl.accountGet(s.username);
    if (!acct || acct.disabled) return null;
    return { tokenHash, user: publicUser(acct) };
  }

  async function startSession(req, res, username) {
    const token = auth.newToken();
    await dl.sessionCreate({ tokenHash: auth.sha256(token), username, expiresAtMs: Date.now() + sessionMs });
    return auth.serializeCookie(SID, token, { maxAgeSec: Math.floor(sessionMs / 1000), secure: isHttps(req) });
  }

  function clientIp(req) {
    const xf = req.headers["x-forwarded-for"];
    if (xf) return String(xf).split(",")[0].trim();
    return (req.socket && req.socket.remoteAddress) || "?";
  }

  function csrfCheck(req) {
    if (req.headers["x-requested-with"] !== "portal") throw httpErr(403, "Blocked request");
    const origin = req.headers.origin;
    if (origin) {
      let host = "";
      try {
        host = new URL(origin).host;
      } catch (e) {
        throw httpErr(403, "Blocked request");
      }
      if (host !== req.headers.host) throw httpErr(403, "Blocked request");
    }
  }

  function keyRule(key) {
    for (const r of config.keyRules || []) if (r.pattern.test(key)) return r;
    return null;
  }
  const canRead = (role, key) => {
    const r = keyRule(key);
    return !r || !r.read || r.read.includes(role);
  };
  const canWrite = (role, key) => {
    const r = keyRule(key);
    return !r || !r.write || r.write.includes(role);
  };

  function cleanUsername(u) {
    u = String(u || "").trim().toLowerCase();
    return /^[a-z0-9._@+-]{2,64}$/.test(u) ? u : null;
  }

  function cleanName(n, fallback) {
    n = String(n || "").trim().slice(0, 100);
    return n || fallback;
  }

  // ---------- security headers ----------
  function setSecurityHeaders(req, res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "same-origin");
    if (isHttps(req)) res.setHeader("Strict-Transport-Security", "max-age=15552000");
  }

  // ---------- main handler ----------
  async function handler(req, res) {
    try {
      setSecurityHeaders(req, res);
      const url = new URL(req.url, "http://localhost");
      const p = url.pathname;
      if (p.startsWith("/api/")) return await api(req, res, url, p);
      return await staticFile(req, res, p);
    } catch (e) {
      if (e && e.status) {
        if (!res.headersSent) return json(res, e.status, { error: e.message });
        return res.end();
      }
      console.error(e);
      if (!res.headersSent) return json(res, 500, { error: "Server error" });
      res.end();
    }
  }

  // ---------- API ----------
  async function api(req, res, url, p) {
    const m = req.method;
    if (m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE") csrfCheck(req);

    if (p === "/api/health" && m === "GET") {
      await dl.ping();
      return json(res, 200, { ok: true });
    }

    if (p === "/api/auth/login" && m === "POST") {
      const body = await readJson(req);
      const username = cleanUsername(body.username);
      const password = String(body.password || "");
      const limitKey = clientIp(req) + "|" + (username || "?");
      if (limiter.blocked(limitKey) || (username && userLimiter.blocked(username))) {
        throw httpErr(429, "Too many attempts. Try again in 15 minutes.");
      }
      const acct = username ? await dl.accountGet(username) : null;
      const ok = await auth.verifyPassword(password, acct && !acct.disabled ? acct.passHash : null);
      if (!ok || !acct) {
        limiter.fail(limitKey);
        if (username) userLimiter.fail(username);
        throw httpErr(401, "Wrong username or password");
      }
      limiter.reset(limitKey);
      userLimiter.reset(username);
      await dl.accountUpdate(username, { lastLoginAt: new Date().toISOString() });
      const cookie = await startSession(req, res, username);
      res.setHeader("Set-Cookie", cookie);
      return json(res, 200, { user: publicUser(acct) });
    }

    const sess = await getSession(req);

    if (p === "/api/auth/logout" && m === "POST") {
      if (sess) await dl.sessionDelete(sess.tokenHash);
      res.setHeader("Set-Cookie", auth.serializeCookie(SID, "", { maxAgeSec: 0, secure: isHttps(req) }));
      return json(res, 200, { ok: true });
    }

    if (!sess) throw httpErr(401, "Not signed in");
    const user = sess.user;

    if (p === "/api/auth/me" && m === "GET") return json(res, 200, { user });

    if (p === "/api/auth/password" && m === "POST") {
      const body = await readJson(req);
      const acct = await dl.accountGet(user.username);
      const next = String(body.next || "");
      if (!(await auth.verifyPassword(String(body.current || ""), acct.passHash))) {
        throw httpErr(400, "Current password is wrong");
      }
      if (next.length < 8 || next.length > 200) throw httpErr(400, "New password must be at least 8 characters");
      if (next === String(body.current)) throw httpErr(400, "Choose a different password");
      await dl.accountUpdate(user.username, { passHash: await auth.hashPassword(next), mustChange: false });
      await dl.sessionDeleteForUser(user.username, sess.tokenHash);
      return json(res, 200, { ok: true });
    }

    if (user.mustChange) throw httpErr(403, "Password change required");

    if (p.startsWith("/api/admin/")) {
      if (user.role !== "admin") throw httpErr(403, "Admins only");
      return await adminApi(req, res, p, user);
    }

    // ----- saved app data (localStorage mirror) -----
    if (p === "/api/store" && m === "GET") {
      const only = url.searchParams.get("keys");
      const wanted = only ? new Set(only.split(",")) : null;
      const items = {};
      for (const d of await dl.kvAll()) {
        if (wanted && !wanted.has(d.key)) continue;
        if (!canRead(user.role, d.key)) continue;
        items[d.key] = { v: d.value, rev: d.rev };
      }
      return json(res, 200, { items, user });
    }

    if (p === "/api/store/revs" && m === "GET") {
      const revs = {};
      for (const d of await dl.kvRevs()) if (canRead(user.role, d.key)) revs[d.key] = d.rev;
      return json(res, 200, { revs });
    }

    if (p === "/api/store/batch" && m === "POST") {
      const body = await readJson(req);
      const changes = Array.isArray(body.changes) ? body.changes : [];
      const removes = Array.isArray(body.removes) ? body.removes : [];
      if (changes.length + removes.length > 300) throw httpErr(413, "Too many changes");
      const results = {};
      for (const c of changes) {
        const key = c && c.key;
        if (typeof key !== "string" || !key || key.length > 200) continue;
        if (typeof c.to !== "string" || c.to.length > MAX_VALUE) {
          results[key] = { error: "invalid" };
          continue;
        }
        if (!(c.from === null || c.from === undefined || typeof c.from === "string")) {
          results[key] = { error: "invalid" };
          continue;
        }
        if (!canWrite(user.role, key)) {
          results[key] = { error: "forbidden" };
          continue;
        }
        results[key] = await applyChange(key, c.from === undefined ? null : c.from, c.to);
      }
      for (const r of removes) {
        const key = r && r.key;
        if (typeof key !== "string" || !key || key.length > 200) continue;
        if (!canWrite(user.role, key)) {
          results[key] = { error: "forbidden" };
          continue;
        }
        results[key] = await applyRemove(key, typeof r.from === "string" ? r.from : null);
      }
      return json(res, 200, { results });
    }

    // ----- files (photos, proofs, assignment files) -----
    if (p === "/api/files" && m === "POST") {
      const buf = await readBody(req, maxFile);
      if (!buf.length) throw httpErr(400, "Empty file");
      const sha = crypto.createHash("sha256").update(buf).digest("hex");
      const existing = await dl.fileBySha(sha);
      if (!existing) {
        let name = "file";
        try {
          name = decodeURIComponent(String(req.headers["x-file-name"] || "file"));
        } catch (e) {
          /* keep default */
        }
        const type = String(req.headers["content-type"] || "application/octet-stream").slice(0, 100);
        await dl.fileSave(buf, { name: name.slice(0, 200), type, sha });
      }
      return json(res, 200, { id: sha, size: buf.length, deduped: !!existing });
    }

    const fm = p.match(/^\/api\/files\/([a-f0-9]{64})$/);
    if (fm && m === "GET") {
      const f = await dl.fileOpen(fm[1]);
      if (!f) throw httpErr(404, "File not found");
      res.writeHead(200, {
        "Content-Type": f.type || "application/octet-stream",
        "Content-Length": f.size,
        "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(f.name || "file"),
        "Content-Security-Policy": "sandbox",
        "Cache-Control": "private, max-age=31536000, immutable",
      });
      f.stream.on("error", () => res.destroy());
      f.stream.pipe(res);
      return;
    }

    // ----- IndexedDB mirror -----
    if (p === "/api/idb" && m === "GET") {
      const db = url.searchParams.get("db");
      if (!db || db.length > 200) throw httpErr(400, "db is required");
      return json(res, 200, { records: await dl.idbList(db) });
    }

    if (p === "/api/idb/batch" && m === "POST") {
      const body = await readJson(req);
      const ops = Array.isArray(body.ops) ? body.ops : [];
      if (ops.length > 200) throw httpErr(413, "Too many operations");
      let done = 0;
      for (const o of ops) {
        if (!o || typeof o.db !== "string" || typeof o.store !== "string") continue;
        if (o.db.length > 200 || o.store.length > 200) continue;
        if (o.op === "clear") {
          await dl.idbClearStore(o.db, o.store);
          done++;
          continue;
        }
        if (typeof o.key !== "string" || o.key.length > 2000) continue;
        const id = o.db + "\u0000" + o.store + "\u0000" + o.key;
        const base = { db: o.db, store: o.store, key: o.key };
        if (o.op === "put" && typeof o.value === "string" && o.value.length <= MAX_VALUE) {
          await dl.idbPut(id, Object.assign(base, { value: o.value }));
          done++;
        } else if (o.op === "delete") {
          await dl.idbTombstone(id, base);
          done++;
        }
      }
      return json(res, 200, { ok: true, done });
    }

    throw httpErr(404, "Not found");
  }

  async function applyChange(key, from, to) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const cur = await dl.kvGet(key);
      const curVal = cur ? cur.value : null;
      const rev = cur ? cur.rev : 0;
      const merged = mergeStrings(from, to, curVal);
      if (cur && merged === curVal) return { value: curVal, rev };
      const newRev = await dl.kvCasSet(key, rev, merged);
      if (newRev !== null) return { value: merged, rev: newRev };
    }
    return { error: "busy" };
  }

  async function applyRemove(key, from) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const cur = await dl.kvGet(key);
      if (!cur) return { removed: true };
      // somebody changed it after this user last saw it: keep their version
      if (from !== null && cur.value !== from) return { value: cur.value, rev: cur.rev };
      if (await dl.kvCasDelete(key, cur.rev)) return { removed: true };
    }
    return { error: "busy" };
  }

  // ---------- admin: accounts ----------
  async function adminApi(req, res, p, me) {
    const m = req.method;

    if (p === "/api/admin/accounts" && m === "GET") {
      const list = await dl.accountList();
      return json(res, 200, {
        accounts: list.map((a) => ({
          username: a.username,
          name: a.name,
          role: a.role,
          disabled: !!a.disabled,
          mustChange: !!a.mustChange,
          lastLoginAt: a.lastLoginAt || null,
        })),
      });
    }

    async function createOne(a) {
      const username = cleanUsername(a && a.username);
      const role = String((a && a.role) || "student").toLowerCase();
      const password = String((a && a.password) || "");
      if (!username) return "Invalid username (letters, numbers, . _ - @ + , 2-64 characters)";
      if (!ROLES.includes(role)) return "Role must be admin, lecturer or student";
      if (password.length < 8 || password.length > 200) return "Password must be at least 8 characters";
      const ok = await dl.accountCreate({
        username,
        name: cleanName(a.name, username),
        role,
        passHash: await auth.hashPassword(password),
        mustChange: true,
        disabled: false,
        createdAt: new Date().toISOString(),
      });
      return ok ? null : "Username already exists";
    }

    if (p === "/api/admin/accounts" && m === "POST") {
      const body = await readJson(req);
      const err = await createOne(body);
      if (err) throw httpErr(err.includes("exists") ? 409 : 400, err);
      return json(res, 200, { ok: true });
    }

    if (p === "/api/admin/accounts/import" && m === "POST") {
      const body = await readJson(req);
      const list = Array.isArray(body.accounts) ? body.accounts : [];
      if (list.length > 2000) throw httpErr(413, "Import at most 2000 accounts at a time");
      let created = 0;
      const skipped = [];
      for (const a of list) {
        const err = await createOne(a);
        if (err) skipped.push({ username: String((a && a.username) || ""), reason: err });
        else created++;
      }
      return json(res, 200, { created, skipped });
    }

    const am = p.match(/^\/api\/admin\/accounts\/([^/]+)$/);
    if (am) {
      let username;
      try {
        username = cleanUsername(decodeURIComponent(am[1]));
      } catch (e) {
        username = null;
      }
      if (!username) throw httpErr(400, "Invalid username");
      const acct = await dl.accountGet(username);
      if (!acct) throw httpErr(404, "No such account");

      if (m === "PATCH") {
        const body = await readJson(req);
        const patch = {};
        if (body.name !== undefined) patch.name = cleanName(body.name, username);
        if (body.role !== undefined) {
          const role = String(body.role).toLowerCase();
          if (!ROLES.includes(role)) throw httpErr(400, "Invalid role");
          if (username === me.username && role !== "admin") throw httpErr(400, "You cannot remove your own admin role");
          patch.role = role;
        }
        if (body.disabled !== undefined) {
          if (username === me.username && body.disabled) throw httpErr(400, "You cannot disable yourself");
          patch.disabled = !!body.disabled;
        }
        if (body.password !== undefined) {
          const pw = String(body.password);
          if (pw.length < 8 || pw.length > 200) throw httpErr(400, "Password must be at least 8 characters");
          patch.passHash = await auth.hashPassword(pw);
          patch.mustChange = true;
        }
        await dl.accountUpdate(username, patch);
        if (patch.disabled || patch.passHash) await dl.sessionDeleteForUser(username, null);
        return json(res, 200, { ok: true });
      }

      if (m === "DELETE") {
        if (username === me.username) throw httpErr(400, "You cannot delete yourself");
        await dl.accountDelete(username);
        await dl.sessionDeleteForUser(username, null);
        return json(res, 200, { ok: true });
      }
    }

    throw httpErr(404, "Not found");
  }

  // ---------- static files (your app) ----------
  async function staticFile(req, res, p) {
    if (req.method !== "GET" && req.method !== "HEAD") throw httpErr(405, "Method not allowed");
    let rel;
    try {
      rel = decodeURIComponent(p);
    } catch (e) {
      throw httpErr(400, "Bad path");
    }
    if (rel.includes("\0")) throw httpErr(400, "Bad path");
    if (rel.endsWith("/")) rel += "index.html";
    if (rel.split("/").some((seg) => seg.startsWith(".") && seg !== "")) throw httpErr(404, "Not found");

    const abs = path.normalize(path.join(root, rel));
    if (abs !== root && !abs.startsWith(root + path.sep)) throw httpErr(403, "Forbidden");

    let st;
    try {
      st = await fs.promises.stat(abs);
    } catch (e) {
      throw httpErr(404, "Not found");
    }
    if (st.isDirectory()) {
      res.writeHead(301, { Location: p + "/" });
      return res.end();
    }

    const ext = path.extname(abs).toLowerCase();
    const isPage = ext === ".html";
    if (isPage && rel !== "/login.html") {
      const sess = await getSession(req);
      if (!sess) {
        res.writeHead(302, { Location: "/login.html?next=" + encodeURIComponent(req.url), "Cache-Control": "no-store" });
        return res.end();
      }
      if (rel === "/accounts.html" && sess.user.role !== "admin") {
        return send(res, 403, "Admins only", { "Content-Type": "text/plain; charset=utf-8" });
      }
    }

    const etag = '"' + st.size.toString(16) + "-" + Math.floor(st.mtimeMs).toString(16) + '"';
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": isPage ? "no-store" : "no-cache",
      ETag: etag,
    };
    if (!isPage && req.headers["if-none-match"] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    headers["Content-Length"] = st.size;
    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    const stream = fs.createReadStream(abs);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  }

  return handler;
}

module.exports = { createApp };
