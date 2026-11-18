"use strict";
// Tricent portal server: serves your app from /public and stores its data in MongoDB.
const http = require("http");
const path = require("path");
const { loadEnv } = require("./lib/env");

loadEnv(path.join(__dirname, ".env"));

const { MongoClient } = require("mongodb");
const { createMongoDl } = require("./lib/mongo-dl");
const { createApp } = require("./lib/app");
const auth = require("./lib/auth");
const config = require("./config");

const PORT = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "tricent";

if (!URI) {
  console.error("Missing MONGODB_URI. Put it in .env (on your computer) or Render > Environment.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  console.log("Connected to MongoDB");
  const dl = await createMongoDl(client, DB_NAME);

  // Create the first administrator if there are no accounts yet.
  if ((await dl.accountCount()) === 0) {
    const u = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
    const p = process.env.ADMIN_PASSWORD || "";
    if (u && p.length >= 8) {
      await dl.accountCreate({
        username: u,
        name: "Administrator",
        role: "admin",
        passHash: await auth.hashPassword(p),
        mustChange: true,
        disabled: false,
        createdAt: new Date().toISOString(),
      });
      console.log('Created first admin account "' + u + '" (you must change the password at first login).');
    } else {
      console.warn("NO ACCOUNTS EXIST. Set ADMIN_USERNAME and ADMIN_PASSWORD (8+ characters) and restart.");
    }
  }

  const handler = createApp({ dl, config, env: process.env, publicDir: path.join(__dirname, "public") });
  http.createServer(handler).listen(PORT, () => console.log("Server running on port " + PORT));
}

main().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
