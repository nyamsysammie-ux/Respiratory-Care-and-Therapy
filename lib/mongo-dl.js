"use strict";
// Data layer: everything the server stores in MongoDB.
const { GridFSBucket } = require("mongodb");

async function createMongoDl(client, dbName) {
  const db = client.db(dbName);
  const kv = db.collection("kv");
  const accounts = db.collection("accounts");
  const sessions = db.collection("sessions");
  const idb = db.collection("idb_records");
  const filesColl = db.collection("files.files");
  const bucket = new GridFSBucket(db, { bucketName: "files" });

  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await idb.createIndex({ db: 1 });
  await filesColl.createIndex({ "metadata.sha256": 1 });

  const toAccount = (d) => (d ? Object.assign({}, d, { username: d._id }) : null);

  return {
    async ping() {
      await client.db("admin").command({ ping: 1 });
    },

    // ----- accounts -----
    accountCount: () => accounts.countDocuments({}),
    async accountGet(u) {
      return toAccount(await accounts.findOne({ _id: u }));
    },
    async accountList() {
      return (await accounts.find({}).sort({ _id: 1 }).toArray()).map(toAccount);
    },
    async accountCreate(doc) {
      const d = Object.assign({}, doc, { _id: doc.username });
      delete d.username;
      try {
        await accounts.insertOne(d);
        return true;
      } catch (e) {
        if (e && e.code === 11000) return false;
        throw e;
      }
    },
    async accountUpdate(u, patch) {
      await accounts.updateOne({ _id: u }, { $set: patch });
    },
    async accountDelete(u) {
      await accounts.deleteOne({ _id: u });
    },

    // ----- sessions -----
    async sessionCreate(s) {
      await sessions.insertOne({
        _id: s.tokenHash,
        username: s.username,
        expiresAt: new Date(s.expiresAtMs),
      });
    },
    async sessionGet(tokenHash) {
      const s = await sessions.findOne({ _id: tokenHash });
      return s ? { username: s.username, expiresAtMs: s.expiresAt.getTime() } : null;
    },
    async sessionDelete(tokenHash) {
      await sessions.deleteOne({ _id: tokenHash });
    },
    async sessionDeleteForUser(username, exceptHash) {
      const filter = { username };
      if (exceptHash) filter._id = { $ne: exceptHash };
      await sessions.deleteMany(filter);
    },

    // ----- saved app data -----
    async kvAll() {
      return (await kv.find({}).toArray()).map((d) => ({ key: d._id, value: d.value, rev: d.rev }));
    },
    async kvRevs() {
      return (await kv.find({}, { projection: { rev: 1 } }).toArray()).map((d) => ({ key: d._id, rev: d.rev }));
    },
    async kvGet(key) {
      const d = await kv.findOne({ _id: key });
      return d ? { key: d._id, value: d.value, rev: d.rev } : null;
    },
    // Writes only if nobody changed the key since `expectedRev`. Returns new rev or null.
    async kvCasSet(key, expectedRev, value) {
      try {
        const r = await kv.updateOne(
          { _id: key, rev: expectedRev },
          { $set: { value, updatedAt: new Date() }, $inc: { rev: 1 } },
          { upsert: expectedRev === 0 }
        );
        if (r.matchedCount === 1 || r.upsertedCount === 1) return expectedRev + 1;
        return null;
      } catch (e) {
        if (e && e.code === 11000) return null;
        throw e;
      }
    },
    async kvCasDelete(key, expectedRev) {
      const r = await kv.deleteOne({ _id: key, rev: expectedRev });
      return r.deletedCount === 1;
    },

    // ----- IndexedDB mirror -----
    async idbList(dbn) {
      return (await idb.find({ db: dbn }).toArray()).map((d) => ({
        store: d.store,
        key: d.key,
        value: d.deleted ? null : d.value,
        deleted: !!d.deleted,
      }));
    },
    async idbPut(id, doc) {
      await idb.replaceOne({ _id: id }, Object.assign({}, doc, { deleted: false, updatedAt: new Date() }), { upsert: true });
    },
    async idbTombstone(id, doc) {
      await idb.replaceOne(
        { _id: id },
        Object.assign({}, doc, { value: null, deleted: true, updatedAt: new Date() }),
        { upsert: true }
      );
    },
    async idbClearStore(dbn, store) {
      await idb.updateMany(
        { db: dbn, store, deleted: { $ne: true } },
        { $set: { value: null, deleted: true, updatedAt: new Date() } }
      );
    },

    // ----- files (GridFS), addressed by their SHA-256 -----
    async fileBySha(sha) {
      const f = await filesColl.findOne({ "metadata.sha256": sha });
      return f ? { size: f.length } : null;
    },
    fileSave(buf, meta) {
      return new Promise((resolve, reject) => {
        const up = bucket.openUploadStream(meta.name, { metadata: { sha256: meta.sha, type: meta.type } });
        up.on("error", reject);
        up.on("finish", () => resolve());
        up.end(buf);
      });
    },
    async fileOpen(sha) {
      const f = await filesColl.findOne({ "metadata.sha256": sha });
      if (!f) return null;
      return {
        stream: bucket.openDownloadStream(f._id),
        type: (f.metadata && f.metadata.type) || "application/octet-stream",
        name: f.filename,
        size: f.length,
      };
    },
  };
}

module.exports = { createMongoDl };
