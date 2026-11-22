/* TSMHST Portal — sync server (MongoDB)
 *
 * A small REST bridge between the portal's browser sync module and a
 * MongoDB server. Run it on the ICT computer that can reach MongoDB:
 *
 *   npm install mongodb
 *   node server.js
 *
 * Environment variables:
 *   PORT       HTTP port for this server          (default 3000)
 *   MONGO_URL  MongoDB connection string          (default mongodb://127.0.0.1:27017)
 *   MONGO_DB   Database name                      (default tsmhst_portal)
 *
 * Endpoints used by the portal (js/sync.js):
 *   GET  /api/health                     → { ok, database, time }
 *   GET  /api/records?since=<ISO>        → { rows: [{ table, id, payload, updatedAt, deleted }] }
 *   POST /api/records   { rows: [...] }  → upsert merge, { ok, upserted }
 *   POST /api/files/<fileId>             → stores the body in GridFS, { ok }
 *   GET  /api/files/<fileId>             → returns the stored file
 */
'use strict';

const http = require('http');
const { MongoClient, GridFSBucket } = require('mongodb');

const PORT = Number(process.env.PORT || 3000);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGO_DB || 'tsmhst_portal';
const MAX_BODY = 64 * 1024 * 1024; // 64 MB — covers the 50 MB portal cap

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function send(res, status, body, extraHeaders) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, CORS, extraHeaders || {});
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  if (typeof data !== 'string' && !Buffer.isBuffer(data)) headers['Content-Type'] = 'application/json';
  res.writeHead(status, headers);
  res.end(data);
}

function readBody(req, res) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function readJson(req, res) {
  return readBody(req, res).then(buf => {
    if (!buf.length) return {};
    try { return JSON.parse(buf.toString('utf8')); }
    catch (e) { throw new Error('invalid JSON body'); }
  });
}

function streamFile(res, files, fileId) {
  return new Promise((resolve, reject) => {
    const cursor = files.find({ filename: fileId }).limit(1);
    cursor.next().then(meta => {
      if (!meta) { send(res, 404, { error: 'file not found' }); return resolve(); }
      const stream = files.openDownloadStream(meta._id);
      const headers = { 'Content-Type': (meta.metadata && meta.metadata.contentType) || 'application/octet-stream' };
      res.writeHead(200, Object.assign(headers, CORS));
      stream.on('data', chunk => res.write(chunk));
      stream.on('end', () => { res.end(); resolve(); });
      stream.on('error', reject);
    }).catch(reject);
  });
}

async function main() {
  const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(DB_NAME);
  const records = db.collection('records');
  const files = new GridFSBucket(db, { bucketName: 'files' });
  await records.createIndex({ table: 1, id: 1 }, { unique: true });
  await records.createIndex({ updatedAt: 1 });
  console.log('Connected to MongoDB:', MONGO_URL, '→ database', DB_NAME);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '');
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
    try {
      if (req.method === 'GET' && path === '/api/health') {
        await db.command({ ping: 1 });
        return send(res, 200, { ok: true, database: DB_NAME, time: new Date().toISOString() });
      }
      if (req.method === 'GET' && path === '/api/records') {
        const since = url.searchParams.get('since');
        const filter = {};
        if (since) filter.updatedAt = { $gt: since };
        const docs = await records.find(filter, { projection: { _id: 0 } })
          .sort({ updatedAt: 1 }).limit(5000).toArray();
        return send(res, 200, { ok: true, rows: docs });
      }
      if (req.method === 'POST' && path === '/api/records') {
        const body = await readJson(req, res);
        const rows = Array.isArray(body.rows) ? body.rows : [];
        if (!rows.length) return send(res, 400, { ok: false, error: 'no rows' });
        const ops = rows.map(r => ({
          replaceOne: {
            filter: { table: String(r.table || ''), id: String(r.id || '') },
            replacement: {
              table: String(r.table || ''), id: String(r.id || ''),
              payload: r.payload || {}, updatedAt: r.updatedAt || new Date().toISOString(),
              deleted: !!r.deleted
            },
            upsert: true
          }
        }));
        const result = await records.bulkWrite(ops, { ordered: false });
        return send(res, 200, { ok: true, upserted: result.upsertedCount + result.modifiedCount });
      }
      if (req.method === 'POST' && /^\/api\/files\/[^/]+$/.test(path)) {
        const fileId = decodeURIComponent(path.slice('/api/files/'.length));
        const data = await readBody(req, res);
        if (!data.length) return send(res, 400, { ok: false, error: 'empty file' });
        // Replace any previous upload with the same id (GridFS names are unique per bucket).
        const existing = await files.find({ filename: fileId }).toArray();
        for (const doc of existing) { try { files.delete(doc._id); } catch (e) { /* ignore */ } }
        await new Promise((resolve, reject) => {
          const upload = files.openUploadStream(fileId, {
            metadata: { contentType: req.headers['content-type'] || 'application/octet-stream' }
          });
          upload.on('finish', resolve);
          upload.on('error', reject);
          upload.end(data);
        });
        return send(res, 200, { ok: true, id: fileId });
      }
      if (req.method === 'GET' && /^\/api\/files\/[^/]+$/.test(path)) {
        const fileId = decodeURIComponent(path.slice('/api/files/'.length));
        return await streamFile(res, files, fileId);
      }
      return send(res, 404, { ok: false, error: 'unknown endpoint' });
    } catch (err) {
      console.error(req.method, path, err.message);
      if (!res.headersSent) send(res, 500, { ok: false, error: err.message });
      else res.end();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log('TSMHST sync server listening on http://0.0.0.0:' + PORT);
    console.log('Paste http://<this-computer-ip>:' + PORT + ' into the portal → Cloud sync → MongoDB sync server.');
  });
}

main().catch(err => {
  console.error('Failed to start:', err.message);
  console.error('Check that MongoDB is running (default port 27017) and reachable at', MONGO_URL);
  process.exit(1);
});
