# Tricent MongoDB add-on

Adds a MongoDB database to your existing app without rewriting it. Your app keeps using localStorage; this add-on copies that data to MongoDB and loads it back on every page load.

## Folder layout

```
tricent-mongodb-addon/
├── server.js            the backend (Express + MongoDB)
├── package.json
├── .env.example         copy to .env
├── .gitignore
└── public/
    ├── mongo-sync.js    the browser add-on
    ├── sync-test.html   a test page
    └── (your app files go here)
```

## Step 1. Add your app

Copy ALL your existing app files (index.html, css, js, images, manifest, service worker...) into the `public/` folder.

## Step 2. Add one line to your index.html

Inside `<head>`, before your other `<script>` tags:

```html
<script src="mongo-sync.js"></script>
```

## Step 3. Set your password

1. Copy `.env.example` to a new file called `.env`
2. Replace `YOUR_PASSWORD` with the password of the database user `nyamsysammie_db_user`
3. If the password has special characters (`@ : / ? # %`), URL-encode them, or reset it to letters and numbers only in Atlas (Database Access).

## Step 4. Allow connections in Atlas

Atlas > Network Access > Add IP Address. Use your current IP for testing. For Render use `0.0.0.0/0` (Render IPs change).

## Step 5. Test on your computer

```bash
npm install
npm start
```

Open http://localhost:3000/sync-test.html, click "Add 1", wait 3 seconds, then open the page in another browser. The same number should show up. In Atlas > Browse Collections you will see database `tricent`, collection `kv`.

Then open http://localhost:3000/ to use your real app.

## Step 6. Deploy on Render

1. Put this whole folder in your GitHub repo (do NOT commit `.env`).
2. On Render the service must be a **Web Service** (a "Static Site" cannot run a server). Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Environment > add `MONGODB_URI` (the full string with your password) and optionally `DB_NAME`.
4. Deploy.

## How it behaves

- First time: if the database is empty, the data already in the browser is uploaded (nothing is lost).
- After that: MongoDB data is loaded when the page opens, and every change is sent within about 2 seconds.
- Theme, font size and language stay on each device. Change this list in `mongo-sync.js` (`EXCLUDE`).

## Limits you should know

- **Not synced yet:** files and photos stored in IndexedDB (payment proofs, assignment files, profile photos). They stay on that device. Syncing them needs a file store such as MongoDB GridFS, which is a good next step.
- **Last write wins:** if two people change the same record list at the same moment, the later save overwrites the earlier one. Other users see new data after refreshing the page.
- **Security:** anyone who can open the site can reach `/api/store`. That is fine for testing, but before real student records go in you should add real logins on the server. Setting `SYNC_TOKEN` is only a light barrier because the token is visible in the browser.
