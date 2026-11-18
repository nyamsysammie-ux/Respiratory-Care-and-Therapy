# TSMHST Portal: MongoDB add-on (v2)

Your app keeps working as it is. This add-on adds three things around it:

1. **Sign-in.** Nobody can open the portal or its data without an account.
2. **Shared data.** Everything your app saves in localStorage is stored in MongoDB.
   If two people change the same list at the same moment, both changes are kept (merged), not overwritten.
3. **Shared files.** Photos, payment proofs and assignment files that your app keeps in IndexedDB are stored in MongoDB (GridFS) and restored on any device.

## What is in this folder

```
tricent-mongodb-addon/
├── server.js, config.js, lib/     the backend
├── package.json, .env.example, .gitignore
└── public/
    ├── index.html                 YOUR index.html with 2 lines added (see Step 2)
    ├── mongo-sync.js              saved-data sync + sign-in check
    ├── mongo-files.js             IndexedDB file sync
    ├── login.html                 sign-in page
    ├── accounts.html              admin page: create / disable accounts, CSV import
    └── sync-test.html             a tiny test page (delete it when you are done testing)
```

## Step 1. Copy your app into `public/`

Copy the rest of your app into `public/`, next to the files above:
`css/`, `js/`, `assets/`, `manifest.webmanifest`, and any service worker file.
Keep the `index.html` from this zip (it is yours plus these two lines inside `<head>`):

```html
<script src="mongo-sync.js"></script>
<script src="mongo-files.js"></script>
```

They must stay before your other scripts.

## Step 2. Set your secrets

1. Copy `.env.example` to a new file called `.env`.
2. Replace `YOUR_PASSWORD` with the password of the database user `nyamsysammie_db_user`
   (special characters such as `@ : / ? # %` must be URL-encoded, or choose a password with letters and numbers only).
3. Choose `ADMIN_USERNAME` and `ADMIN_PASSWORD` (8+ characters). This creates the first administrator, only when no accounts exist yet. You are forced to choose a new password at first sign-in.

## Step 3. Atlas

Atlas > Network Access > Add IP Address. Use your current IP for testing. For Render use `0.0.0.0/0`, because Render's IP addresses change.

## Step 4. Try it on your computer

```bash
npm install
npm start
```

1. Open http://localhost:3000/ . You are sent to the sign-in page.
2. Sign in with your admin account and choose a new password.
3. Open http://localhost:3000/accounts.html to create lecturer and student accounts (or import a CSV: `username,full name,role,temporary password`).
4. Open http://localhost:3000/sync-test.html, click "Add 1", wait 3 seconds, then open the same page in another browser signed in as another user. The same number appears.

## Step 5. Deploy on Render

1. Put the folder in your GitHub repo (never commit `.env`).
2. The service must be a **Web Service** (a Static Site cannot run a server).
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Environment: add `MONGODB_URI`, `DB_NAME` (optional), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `MAX_FILE_MB` (optional).
4. Deploy, open your Render address, sign in, then delete `ADMIN_PASSWORD` from Render's settings.

## Step 6. Protect data by role (important, do this before real records go in)

Anyone who is signed in can read and write every saved key unless you add rules in `config.js`.

1. Open the running app, press F12, open the Console and run `MongoSync.keys()`.
   It lists `synced` keys (shared) and `local_only` keys (kept per device).
2. Add rules to `keyRules` in `config.js`, for example:

```js
keyRules: [
  { pattern: /^tsmhst\.users$/,   read: ["admin", "lecturer"], write: ["admin"] },
  { pattern: /^tsmhst\.results/,  read: ["admin", "lecturer", "student"], write: ["admin", "lecturer"] },
],
```

3. Check the `local_only` list. Keys whose names contain `theme`, `font`, `lang`, `session`, `token`, `remember` or `current user` are deliberately NOT shared, because they are per-device settings or "who is signed in here". If a real data key (for example a timetable called `tsmhst.sessions`) shows up in `local_only`, edit `EXCLUDE` at the top of `public/mongo-sync.js`.

## How it behaves

- Your app code is unchanged. It still reads and writes localStorage and IndexedDB; the add-on copies in the background.
- First run: if the database is empty, the data already in the browser is uploaded, so nothing is lost.
- Changes are sent within about 2 seconds. Other people's changes arrive within about 20 seconds as a "New data from another user is available. Refresh" notice (the page never reloads by itself, so nobody loses a half-typed form).
- If you are offline, changes wait on the device and are merged when you are back online.
- Signing out (button at the bottom-left) removes the shared data and files from that device.

## Limits you should know

- **Two sign-ins.** The server sign-in protects the data. Your app still has its own login screen and its own users list inside the saved data. Create each person in both places (accounts.html and your Users desk), with matching usernames.
- **Per-key, not per-record, privacy.** The server decides who may read a whole saved key, not a single student's row. If students' records live in one key that students can read, a student can read all of it with browser tools. Use `keyRules` (Step 6). Fully private per-student data needs the app itself to fetch only that student's rows from the server, which is a bigger change to the app.
- **Files are not private per person.** Any signed-in account can download a file if it knows its ID. IDs are long random-looking hashes, but they appear inside saved records, so the same key rules apply.
- **Merging is automatic, not magic.** Different items, or different fields of the same item, merge cleanly. If two people change the same field of the same item at the same moment, the later save wins for that field.
- **Not tested with your real js files.** The add-on was tested with a stand-in app and a real browser, not with your actual `js/` folder. Test with two accounts on two browsers before you rely on it.
- A lost or reset password cannot be recovered; an admin sets a new one on accounts.html.
