"use strict";
const crypto = require("crypto");

const N = 16384, R = 8, P = 1;

function scrypt(password, salt, n, r, p) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

let dummyHash = null;

async function verifyPassword(password, stored) {
  if (!stored) {
    // keep timing similar for unknown users
    if (!dummyHash) dummyHash = await hashPassword("dummy-password-for-timing");
    stored = dummyHash;
    await verifyAgainst(password, stored);
    return false;
  }
  return verifyAgainst(password, stored);
}

async function verifyAgainst(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  const got = await scrypt(password, salt, Number(parts[1]), Number(parts[2]), Number(parts[3]));
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch (e) {
        out[k] = v;
      }
    }
  }
  return out;
}

function serializeCookie(name, value, opts) {
  let s = name + "=" + encodeURIComponent(value) + "; Path=/; HttpOnly; SameSite=Lax";
  if (opts && opts.maxAgeSec !== undefined) s += "; Max-Age=" + opts.maxAgeSec;
  if (opts && opts.secure) s += "; Secure";
  return s;
}

// Blocks a key after `max` wrong passwords for 15 minutes.
class LoginLimiter {
  constructor(max) {
    this.max = max || 5;
    this.map = new Map();
  }
  blocked(key) {
    const e = this.map.get(key);
    if (!e) return false;
    if (e.until && e.until > Date.now()) return true;
    if (e.until && e.until <= Date.now()) this.map.delete(key);
    return false;
  }
  fail(key) {
    const now = Date.now();
    const e = this.map.get(key) || { count: 0, first: now, until: 0 };
    if (now - e.first > 15 * 60 * 1000) {
      e.count = 0;
      e.first = now;
    }
    e.count++;
    if (e.count >= this.max) e.until = now + 15 * 60 * 1000;
    this.map.set(key, e);
    if (this.map.size > 5000) {
      for (const [k, v] of this.map) if (!v.until || v.until < now) this.map.delete(k);
    }
  }
  reset(key) {
    this.map.delete(key);
  }
}

module.exports = { hashPassword, verifyPassword, newToken, sha256, parseCookies, serializeCookie, LoginLimiter };
