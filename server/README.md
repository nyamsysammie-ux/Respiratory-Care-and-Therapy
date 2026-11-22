# TSMHST Portal — MongoDB sync server

Connects the portal's browser sync module to a MongoDB server. Records
(documents, payments, submissions, check-ins) are stored in a `records`
collection; file blobs (payment proofs, vault files, submissions) are
stored in a GridFS bucket called `files`. Both are created automatically
on first connect.

## Run it (on the ICT computer)

1. Install Node.js (18 or newer) and make sure MongoDB is running
   (default port **27017**).
2. Copy this `server` folder anywhere on that computer, then:

   ```
   npm install mongodb
   node server.js
   ```

3. The server listens on **http://0.0.0.0:3000**. Test it:
   `curl http://localhost:3000/api/health`
   → `{"ok":true,"database":"tsmhst_portal",...}`

4. Make the port reachable from other devices — open port **3000** in
   the firewall, e.g. on Windows:
   `netsh advfirewall firewall add rule name="TSMHST sync" dir=in action=allow protocol=TCP localport=3000`

## Connect the portal

On any admin account: **Document vault → Cloud sync → Backend:
MongoDB sync server** → paste `http://<this-computer-ip>:3000` → Save.
The portal tests the connection immediately, then pushes and pulls in
the background.

## Configuration (optional)

| Variable   | Default                      | Meaning                       |
|------------|------------------------------|-------------------------------|
| `PORT`     | `3000`                       | HTTP port of this server      |
| `MONGO_URL`| `mongodb://127.0.0.1:27017`  | MongoDB connection string     |
| `MONGO_DB` | `tsmhst_portal`              | Database name                 |

Example: `PORT=4000 MONGO_URL="mongodb://user:pass@10.0.0.5:27017" node server.js`

## Notes

- All endpoints answer CORS preflights, so the portal can call the
  server from any origin, including an installed PWA.
- Every device pushes its changes (debounced ~8 s after a save) and
  pulls everyone else's on boot; deletions propagate as tombstones.
- Files are keyed by unguessable ids; records are upserted
  last-write-wins on `updatedAt`.
- The server keeps no user accounts; treat the LAN as the trust
  boundary. For internet exposure, put it behind HTTPS (for example a
  Caddy/nginx reverse proxy with a certificate for the college domain).
