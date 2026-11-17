// Tricent MongoDB add-on: serves your app AND stores its data in MongoDB Atlas.
require("dotenv").config();
const path = require("path");
const express = require("express");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "tricent";
const SYNC_TOKEN = process.env.SYNC_TOKEN || ""; // optional extra check

if (!URI) {
  console.error("Missing MONGODB_URI. Add it to .env (local) or Render > Environment.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "10mb" }));

const client = new MongoClient(URI);
let kv; // collection: one document per localStorage key

function checkToken(req, res, next) {
  if (SYNC_TOKEN && req.get("x-sync-token") !== SYNC_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/health", async (req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.json({ ok: true, db: DB_NAME });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Return every stored key/value
app.get("/api/store", checkToken, async (req, res) => {
  try {
    const docs = await kv.find({}).toArray();
    const items = {};
    for (const d of docs) items[d._id] = d.value;
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not read data" });
  }
});

// Save changes: { set: { key: "value" }, remove: ["key"] }
app.post("/api/store/batch", checkToken, async (req, res) => {
  try {
    const set = (req.body && req.body.set) || {};
    const remove = (req.body && req.body.remove) || [];
    const ops = [];
    for (const [key, value] of Object.entries(set)) {
      if (typeof value !== "string") continue;
      ops.push({
        updateOne: {
          filter: { _id: key },
          update: { $set: { value, updatedAt: new Date() } },
          upsert: true,
        },
      });
    }
    for (const key of remove) {
      if (typeof key === "string") ops.push({ deleteOne: { filter: { _id: key } } });
    }
    if (ops.length) await kv.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, changes: ops.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not save data" });
  }
});

// Your existing app files live in /public
app.use(express.static(path.join(__dirname, "public")));

client
  .connect()
  .then(() => {
    kv = client.db(DB_NAME).collection("kv");
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
