"use strict";
// Three-way merge for JSON values.
//   base   = what the user's app started from
//   local  = what the user's app wrote
//   remote = what the server holds now (may include other people's changes)
// Result keeps both people's changes. Only when both change the very same
// field (a scalar) does the local (newer) change win.

const ID_FIELDS = ["id", "_id", "uuid"];

function isObj(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function merge3(base, local, remote) {
  if (deepEqual(local, remote)) return local;
  if (deepEqual(base, remote)) return local;
  if (deepEqual(base, local)) return remote;
  if (isObj(local) && isObj(remote) && (base === undefined || isObj(base))) {
    return mergeObjects(base || {}, local, remote);
  }
  if (Array.isArray(local) && Array.isArray(remote) && (base === undefined || Array.isArray(base))) {
    return mergeArrays(base || [], local, remote);
  }
  return local; // same scalar changed by both: the newer (local) change wins
}

// Shared rule for "present / absent" entries (object keys, list items by id)
function mergeEntry(hasB, b, hasL, l, hasR, r) {
  // returns { keep: boolean, value }
  if (!hasL && !hasR) return { keep: false };
  if (hasL && hasR) return { keep: true, value: merge3(hasB ? b : undefined, l, r) };
  if (hasL) {
    if (hasB) {
      // removed remotely: drop it only if local did not edit it
      return deepEqual(b, l) ? { keep: false } : { keep: true, value: l };
    }
    return { keep: true, value: l }; // added locally
  }
  if (hasB) {
    // removed locally: drop it only if remote did not edit it
    return deepEqual(b, r) ? { keep: false } : { keep: true, value: r };
  }
  return { keep: true, value: r }; // added remotely
}

function mergeObjects(base, local, remote) {
  const out = {};
  const keys = new Set([...Object.keys(remote), ...Object.keys(local), ...Object.keys(base)]);
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  for (const k of keys) {
    const e = mergeEntry(has(base, k), base[k], has(local, k), local[k], has(remote, k), remote[k]);
    if (e.keep) out[k] = e.value;
  }
  return out;
}

function findIdField(arrays) {
  let any = false;
  for (const f of ID_FIELDS) {
    let ok = true;
    for (const arr of arrays) {
      for (const item of arr) {
        any = true;
        if (!isObj(item) || !(typeof item[f] === "string" || typeof item[f] === "number")) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }
    if (ok && any) return f;
    any = false;
  }
  return null;
}

function primKey(x) {
  return typeof x + ":" + String(x);
}

function allPrimitive(arrays) {
  for (const arr of arrays) {
    for (const x of arr) {
      if (x !== null && typeof x === "object") return false;
    }
  }
  return true;
}

function mergeArrays(base, local, remote) {
  const idf = findIdField([base, local, remote]);
  if (idf) {
    const map = (arr) => {
      const m = new Map();
      for (const it of arr) m.set(primKey(it[idf]), it);
      return m;
    };
    const mb = map(base);
    const ml = map(local);
    const mr = map(remote);
    const order = [];
    const seen = new Set();
    for (const it of remote.concat(local)) {
      const k = primKey(it[idf]);
      if (!seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    }
    const out = [];
    for (const k of order) {
      const e = mergeEntry(mb.has(k), mb.get(k), ml.has(k), ml.get(k), mr.has(k), mr.get(k));
      if (e.keep) out.push(e.value);
    }
    return out;
  }
  if (allPrimitive([base, local, remote])) {
    const sb = new Set(base.map(primKey));
    const sl = new Set(local.map(primKey));
    const added = local.filter((x) => !sb.has(primKey(x)));
    const removed = new Set(base.filter((x) => !sl.has(primKey(x))).map(primKey));
    const out = remote.filter((x) => !removed.has(primKey(x)));
    const have = new Set(out.map(primKey));
    for (const x of added) {
      if (!have.has(primKey(x))) {
        out.push(x);
        have.add(primKey(x));
      }
    }
    return out;
  }
  return local; // list without ids: cannot merge safely, newer change wins
}

function tryParse(s) {
  if (typeof s !== "string") return { ok: false };
  try {
    return { ok: true, v: JSON.parse(s) };
  } catch (e) {
    return { ok: false };
  }
}

// Merge three stored strings (localStorage values). `from` may be null (new key).
// Returns the string that should be stored on the server.
function mergeStrings(from, to, cur) {
  if (to === cur) return cur;
  if (from === cur) return to;
  if (from === to) return cur; // I did not change it; keep what is on the server
  if (cur === null || cur === undefined) return to;
  const b = from === null || from === undefined ? { ok: true, v: undefined } : tryParse(from);
  const l = tryParse(to);
  const r = tryParse(cur);
  if (!b.ok || !l.ok || !r.ok) return to; // not JSON: newer change wins
  const merged = merge3(b.v, l.v, r.v);
  if (deepEqual(merged, r.v)) return cur;
  if (deepEqual(merged, l.v)) return to;
  return JSON.stringify(merged);
}

module.exports = { merge3, mergeStrings, deepEqual };
