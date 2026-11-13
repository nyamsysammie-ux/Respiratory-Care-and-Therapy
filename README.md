# TSMHST Portal — App Release

**Tricent School of Medical Health Science and Technology (TSMHST)**
Version 1.6.0 · Build 13 November 2026

This folder contains the finished portal app, a one-click preview for this PC, and this guide.
Everything is in: `C:\Users\Seth Nyamasege\Desktop\TSMHST Portal App`

---

## 1. What is in this folder

```
TSMHST Portal App\
├── README.md                  ← this guide
├── Preview on this PC.bat     ← double-click to try the portal on this computer
├── preview.ps1                ← the local preview server used by the .bat file
├── TSMHST-Portal-App.zip      ← the upload package (all app files at the top level)
└── app\                       ← the actual app (this is what gets published)
    ├── index.html
    ├── manifest.webmanifest
    ├── package.json         ← project metadata (name and version 1.6.0; no build step)
    ├── sw.js
    ├── css\app.css
    ├── js\  (i18n.js, data.js, store.js, ui.js, views.js, views-admin.js, app.js)
    ├── js\vendor\qrcode.js  ← QR code generator used for class sign-in
    └── assets\  (logo and app icons)
```

The `app` folder is the complete, self-contained portal. It needs no server-side software — only static file hosting.

---

## 2. Try it on this PC (2 minutes)

1. Open `C:\Users\Seth Nyamasege\Desktop\TSMHST Portal App`.
2. Double-click **`Preview on this PC.bat`**.
3. If Windows shows a security prompt, choose **More info → Run anyway** (the file only starts a local preview server).
4. Your browser opens automatically at **http://localhost:5500/**.
5. Keep the black preview window open while you test. Close it when you are finished.

Notes:
- The preview works only on this computer. A phone cannot open `localhost` — to use the portal on a phone, publish it as described in section 4.
- Do not open `index.html` by double-clicking it. The app needs a web address (http/https) so its service worker, install prompt and offline mode work. Always use the `.bat` file.

---

## 3. Demo accounts (for testing only)

The app ships with sample data so every screen can be tested immediately. Passwords are case-sensitive.

| Role | Sign-in ID | Password |
|---|---|---|
| Owner (app settings only) | `owner@tsmhst.co.ke` | `Owner@2026` |
| College Director | `director@tsmhst.co.ke` | `Director@2026` |
| College Principal | `principal@tsmhst.co.ke` | `Principal@2026` |
| Campus Admin | `campus@tsmhst.co.ke` | `Campus@2026` |
| Registrar | `admin@tsmhst.co.ke` | `Admin@2026` |
| Examination Officer | `exams@tsmhst.co.ke` | `Exams@2026` |
| Quality Assurance Officer | `quality@tsmhst.co.ke` | `Quality@2026` |
| Accounts Clerk (Finance) | `accounts@tsmhst.co.ke` | `Accounts@2026` |
| Secretary | `secretary@tsmhst.co.ke` | `Secretary@2026` |
| Lecturer | `j.ochieng@tsmhst.co.ke` | `Lecturer@2026` |
| Student | `TSMHST/CH/2026/001` | `Student@2026` |
| Student Council | `council@tsmhst.co.ke` | `Council@2026` |

The sign-in screen has three tabs:

- **Sign in** — existing accounts.
- **Register** — students, lecturers and college admin staff. Students choose their campus and current semester (1–9, three semesters per academic year); lecturers choose their campus. Admin registrations list the roles Principal, Accounts Clerk, Campus Admin, Registrar, Quality Assurance Officer, Examination Officer and Secretary.
- **Executive** — Director, Deputy Director and General Admin, grouped under one tab; these accounts oversee all campuses.

Registration approvals follow the college hierarchy:

| New account | Approved by |
|---|---|
| Principal, Director | Owner (under **Settings**) |
| Deputy Director, General Admin, campus staff | Director |
| Lecturer, college admin staff | College Principal of that campus |
| Student | Campus Admin of that campus |

All 40 courses remain in the student **Programme** dropdown, grouped by department. New accounts stay **pending** until the responsible office approves them; only then can the person sign in.

Suggested test path: sign in as a student, register a unit and submit a fee payment; sign in as the Campus Admin and verify the payment; then sign in as the Accounts Clerk to see the finance totals.

---

## 4. Put the portal online (required before phones can install it)

Android install and offline mode require an **HTTPS** address. Publish the app on the school website or any HTTPS host.

### Option A — cPanel / school website (recommended)

1. Log in to the hosting control panel (cPanel) for `tsmhst.ac.ke`.
2. Open **File Manager** → `public_html`.
3. Create a folder named **`portal`**.
4. Open `C:\Users\Seth Nyamasege\Desktop\TSMHST Portal App\app`.
5. Select **all files and folders inside `app`** (not the `app` folder itself) and upload them into `public_html/portal`.
   - Alternative: upload **`TSMHST-Portal-App.zip`** into `public_html/portal`, then use **Extract** in File Manager.
6. Confirm this file exists: `public_html/portal/index.html`.
7. Visit **https://www.tsmhst.ac.ke/portal/** in a browser. The sign-in screen should appear.
8. Make sure the site padlock (HTTPS) is active. If the host offers **Force HTTPS**, turn it on.

### Option B — any static HTTPS host

Upload the contents of the `app` folder to the site root (or a subfolder) of Netlify, Vercel, Cloudflare Pages, GitHub Pages or similar. No build step and no environment variables are needed.

### Important publishing rules

- Keep the file and folder names exactly as they are. `sw.js`, `manifest.webmanifest`, `css/`, `js/` and `assets/` must keep their relative positions.
- `package.json` holds only the project name and version (`1.6.0`). It has no dependencies or build scripts, so it does not change how the static site is hosted or published.
- Publish at an address that ends in `/` (for example `/portal/`). The app uses relative paths and works in the root or in a subfolder.
- Do not open the app from `file://` and do not rename `index.html`.
- After replacing files in the future, bump the cache name in `sw.js` (this release uses `tsmhst-portal-v1.6.0`) so installed phones receive the update. The portal shows an "update ready" message when a new version is detected.

---

## 5. Install on an Android phone (home screen)

1. Open **Chrome** on the phone.
2. Go to the published address, for example **https://www.tsmhst.ac.ke/portal/**.
3. Wait for the page to finish loading once (this stores the app for offline use).
4. Tap the **three-dot menu (⋮)** at the top right.
5. Tap **Install app** (on some phones: **Add to Home screen**).
6. Confirm **Install**. The TSMHST Portal icon appears on the home screen and in the app drawer.
7. Open it from the icon — it runs full-screen without the browser address bar.

If the option is missing:
- Confirm the address starts with **https://**.
- Reload the page once, then check the menu again.
- Update Chrome from the Play Store.
- Inside the portal, open **Settings → Install app** for the same instructions.

### iPhone / iPad

1. Open the address in **Safari**.
2. Tap the **Share** button.
3. Tap **Add to Home Screen** → **Add**.

---

## 6. Payments shown in the portal

These are the official channels configured in the app and in the User Agreement Terms:

| Payment | Channel | Number | Account number |
|---|---|---|---|
| **School fees** | M-Pesa **Pay Bill** | **4018437** | **`K-` followed by the student's full name** (example: `K-Alex Mwangi`) |
| **Hostel accommodation** | M-Pesa **Buy Goods (Till)** | **5210783** | None — Buy Goods needs no account number |

How it works in the portal:

1. The student opens **Fees** or **Hostel**, chooses the item and taps **Pay**.
2. The app shows the correct channel and number, and for fees it fills the account number as `K-<student full name>`.
3. The student pays in M-Pesa, then enters the **M-Pesa confirmation code** in the portal.
4. The payment appears as **Pending** at the campus **Payments** desk. The campus admin checks the code and taps **Verify** (or **Reject**).
5. Only then does the balance update and the payment show as **Verified**. The **Finance Office** account alone sees the totals: verified payments, cash awaiting verification and billed amounts.

Always keep the M-Pesa SMS. The portal reminder is also repeated in **Settings → User agreement terms**, section 5.

---

## 7. What each role can do

### Student
- **Home** — overview, balance, attendance percentage, latest notices. The header shows the programme and current **Semester (1–9)**.
- **Units** — view registered units; register a new unit from the list of available units; drop a unit.
- **Assignments** — see assignments per unit, due dates and status; submit work.
- **Timetable** — weekly class grid (Monday–Friday) for registered units plus the exam calendar; the published class and examination timetables are attached at the top of the page for opening or downloading; download the exams as a `.ics` file for your phone calendar.
- **Attendance** — see attendance history and enter the 6-digit class code issued by the lecturer, or scan the class QR code to open the portal with the code already filled in.
- **Results** — published marks per unit (CAT 1 /30, CAT 2 /30, Exam /70; total = average of the two CATs plus the exam), grade and GPA.
- **Transcript** — full academic transcript with GPA; print or save as PDF.
- **Fees** — statement, balance and M-Pesa Pay Bill **4018437** with account `K-<full name>`. **Statement PDF** downloads a branded fee statement, and every verified payment has a receipt PDF button.
- **Hostel** — one shared-room option at **Ksh. 16,000 per term**, request accommodation, pay via Buy Goods **5210783**.
- **Documents** — the document vault: student handbook, examination regulations, fee policy, attachment guidelines, the published timetables and the results sheets for your units. Read them offline or download any text document as a PDF.
- **Team** — see administrators, student council and lecturers, including who is online.
- **Profile** — phone number can be updated; the **name is locked** to the admission record (contact the Registrar to correct it).
- **Settings** — theme, font, language, **change password**, permissions and install help.
- **Notifications**, **About**.

### Lecturer
- **My units** — classes and registered students at the lecturer's campus.
- **Timetable** — your teaching week and the papers you will invigilate; download them to your calendar.
- **Attendance** — open a session to generate a 6-digit code and a QR code, watch sign-ins live, close the session. **Show large** projects the QR for the class to scan.
- **Marks** — enter CAT 1 /30, CAT 2 /30, Exam /70, randomize, then publish results. Export the sheet as **CSV** or import marks from a CSV file. Under the unit selector, **Results sheet (PDF)** uploads the signed results sheet for the selected unit; it goes to the vault under **Results** and is visible to that unit's students and the examinations office.
- **Assignments** — create assignments and review submissions.
- **Announcements** — post notices, scoped to the lecturer's campus.
- **Documents**, **Team**, **About**, **Settings**.

### Owner
- **App settings only** — theme, font, language, notifications and account settings.
- Approves **College Principals** and the **Director** from the approval queue on the Settings page.
- No student, staff, academic or finance data is visible to the owner account.

### College Director, Deputy Director, General Admin
- **Campuses** — totals and per-campus breakdown for all six campuses, plus the **audit trail** of administrative actions.
- **Approvals** — Director approves deputy/general admin and campus staff.
- **Users** — all portal accounts across every campus; export the list as CSV.
- **Marks oversight** — read-only view of marks and publication.
- **Timetable & exams** — the college-wide class grid, exam calendar, venue clash check and calendar export.
- **Quality assurance** — service-quality indicators across campuses.
- **Announcements**, **Documents**, **Team**, **About**, **Settings**.

### College Principal
- **Approvals** — approves lecturers and college admin staff for their campus.
- **Users** — accounts at their campus; can suspend or reactivate staff and students, and export the list as CSV.
- **Payments** — campus payment and hostel activity (verification is done by the Campus Admin).
- **Academics** — read-only view of term dates, curriculum and the registration window.
- **Timetable & exams** — class grid and exam calendar for units taken at the principal's campus.
- **Announcements**, **Documents**, **Team**, **About**, **Settings**.

### Campus Admin
- **Approvals** — approves **student** registrations for their campus.
- **Users** — accounts at their campus, exportable as CSV.
- **Payments** — verifies or rejects student M-Pesa payments and approves hostel bookings; export the payment log as CSV.
- **Documents** — publish and remove vault documents for the campus.
- **Announcements**, **Team**, **About**, **Settings**.

### Registrar
- **Academics** — the only office that edits term dates, the registration window and curriculum.
- **Timetable & exams** — publish and review the weekly class grid and the exam calendar, with a venue/programme clash check.
- **Timetable documents** — at the top of the Timetable page, **Upload** the class timetable and the examination timetable as files (PDF, Word, image, text or CSV, up to 800 KB). They appear immediately for every student and staff member and are filed in the vault under **Timetable**; **Replace** adds the new version and keeps the earlier one in the vault.
- **Announcements**, **Documents**, **Team**, **About**, **Settings**.

### Examination Officer
- **Marks studio** — enter or randomize marks, publish results; import marks from CSV or export the current sheet; oversight of academic information; upload the signed results sheet (PDF) for any unit.
- **Timetable & exams** — the exam calendar, clash check and calendar export; can also publish the class and examination timetable documents.
- **Academics** (read-only), **Documents**, **Announcements**, **Team**, **About**, **Settings**.

### Quality Assurance Officer
- **Service quality** — attendance, publication, pending approvals and ungraded-work indicators with a campus comparison, plus the **pass-rate trend**, **students needing support**, **lecturer workload** and **audit trail** panels.
- **Campuses**, **Announcements**, **Documents**, **Team**, **About**, **Settings**.

### Accounts Clerk (Finance Office)
- **Finance** — verified payments, cash awaiting verification, billed totals and collection rate. These monetary totals are visible to the Finance Office only. The payment log can be exported as CSV.

### Secretary
- **Announcements** — post notices to the portal.
- **Users** — campus account list (read-only) for office reference.
- **Documents**, **Team**, **About**, **Settings**.

### Student Council
- **Announcements** — post and manage student notices.
- **Documents** — read the document vault.
- **Team & presence** — see who is online.
- **About**, **Settings**.

### Presence and visibility
Administrators, student council members and lecturers appear under **Team** with their role, department and contact details. A green dot and "Online" label show who currently has the portal open; presence updates automatically. Student council and admin contacts are visible to all signed-in users.

---

## 8. Receipts, document vault, QR attendance, CSV and analytics

**PDF fee statements and receipts (student).** Open **Fees**.
- **Statement PDF** downloads a branded A4 statement: student details, invoiced items, billed / verified paid / pending / outstanding, every verified payment, payments awaiting verification and the hostel note.
- Each **verified** row in the payment history has a receipt button that downloads an official receipt with the M-Pesa reference, amount, card totals and a finance contact line.
- The files are real PDFs named `TSMHST-fee-statement-<admission>.pdf` and `TSMHST-receipt-<reference>.pdf`, so they can be printed, e-mailed or attached to a bursary application.

**Document vault.** Open **Documents** in the sidebar.
- Seeded with the student handbook and code of conduct, examination regulations, fee payment and refund policy, and clinical attachment guidelines.
- Filter by category (Policy, Examinations, Timetable, Results, Finance, Academic, Notice, Other). **Open** reads a document in the app; **PDF** typesets text documents into a branded PDF.
- Staff can **Add document** — upload a PDF or image (up to 800 KB) or type the body — and remove documents. Every addition and removal is written to the audit trail.
- The **Timetable** category holds the class and examination timetables published from the Timetable page; the **Results** category holds the signed results sheets uploaded by lecturers (PDF only).

**QR class sign-in.** When a lecturer opens a session, a QR code appears under the live session.
- Students scan it with the phone camera; the portal opens with the 6-digit code pre-filled and they tap **Sign in**. The code is also shown as text for anyone who prefers to type it.
- **Show large** displays a projector-sized code with **Copy code**, **Copy link** and **Print**.

**CSV export and import.**
- **Marks studio** (lecturer / examination officer): **Export CSV** downloads the selected unit's sheet (`Admission no.`, `CAT 1`, `CAT 2`, `Exam`, totals). **Import CSV** reads the same columns, matches students by admission number and recalculates totals and grades. Leave **Overwrite existing marks** unticked to keep marks that are already recorded.
- **Users** and **Payments** desks export their lists as CSV. All files are RFC 4180 quoted and open cleanly in Excel.

**Analytics and audit trail.**
- **Quality assurance** shows a pass-rate trend by term, **students needing support** (attendance below 75% or average below 50%, with reasons), **lecturer workload** (units, students, sessions, marking queue) and the audit trail.
- The **audit trail** records approvals and rejections, account suspension, payment verification, marks saves and imports, result publication, paybill changes, hostel decisions, announcements and document changes — with who did it, their role, the campus and the time. The executive **Campuses** page shows the same trail.
- The latest 400 entries are kept on the device; nothing is sent anywhere.

**Accessibility.** Links, buttons, chips and navigation show a clear keyboard focus ring, the active page is marked with `aria-current`, the More sheet reports its open state, and every new panel works in light and dark themes.

---

## 9. Timetable & exam calendar

Open **Timetable** in the sidebar. A timetable-documents card sits above two tabs.

**Timetable documents** — a card at the top of the page holds the official class and examination timetable files for the term. The Registrar and Examination Officer see **Upload**/**Replace** buttons; everyone else sees the latest files with **Open** and **Download**. Each upload is filed in the vault under **Timetable** (campus: All campuses), so it also reaches students and staff through **Documents**.

**Weekly classes** — a Monday–Friday grid built from the published unit allocation. Each card shows the time, unit code and title, room, lecturer and programme. Students see only the units they registered for; lecturers see their own teaching; the principal sees units taken at their campus; the registrar, examination officer and executive team see every campus and can filter by programme.

**Exam calendar** — end-of-term papers grouped by day with start and end times, venue and paper type. The demo data schedules the September – December 2026 papers for **7 – 10 December 2026** in the Main Hall, LH 1, LH 2, LH 3 and Science Lab 1.

- Each programme sits at most one paper per session, and no venue is booked twice in the same session. The registrar, examination officer, principal and executive team also see an **examination clash check** panel that reports any venue or programme conflict.
- **Add exams to calendar** downloads an `.ics` file. Opening it in Outlook, Google Calendar or a phone calendar adds every paper with a reminder 12 hours before it starts.
- The exam schedule is generated from the units in the app, so it follows the curriculum whenever the academic office adds or removes units.

---

## 10. Settings inside the app

| Setting | What it does |
|---|---|
| **Theme** | System (follows the phone), Light or Dark |
| **Font size** | Small, Medium or Large |
| **Language** | 184 languages, including English and **Kiswahili**; the interface translates and right-to-left languages switch direction automatically |
| **App version** | Shows version, build date and institution |
| **Rate the app** | 1–5 star rating, saved on the device |
| **Get help** | Email **SammieNyamsy@gmail.com** or WhatsApp **+254 118 000 614** |
| **User agreement terms** | Full 12-section terms, including payment details |
| **Change password** | Update your portal password from **Settings → Sign-in & security** (current password required) |
| **Notifications** | Turn portal notifications on or off |
| **Permissions** | Request and check Location, Camera and Microphone access |
| **Install app** | Step-by-step home-screen installation help |

Settings are saved on the device and stay after closing the app.

---

## 11. Offline use and updates

- After the first online visit, the app shell is stored on the device.
- If the phone loses internet, the portal still opens and shows the last data saved on that device.
- New data (a payment, a mark, an attendance sign-in) needs a connection.
- When the app files are updated on the server, the portal detects the new version and offers to reload.

---

## 12. Demo data and resetting

This release is a working demonstration. Its database is stored **locally in the browser on each device** (local storage key `tsmhst.portal.v1`), so:

- Data entered on one phone or computer does not appear on another.
- Clearing the browser's site data resets that device to the original demo data.

To reset on a phone: Chrome → **Settings → Site settings → All sites → [portal address] → Clear & reset**. Then reopen the portal.
On this PC: open the portal, press **F12** → **Application** → **Storage** → **Clear site data**, then reload.

For real, shared institutional data (all students on all devices), the portal must be connected to a secure backend/database. The interface, roles and workflows are already built for that step.

---

## 13. Optional: a real Android APK

The portal already installs from Chrome as a PWA, which is the recommended route. If a Play Store-style APK is required:

1. Go to **https://www.pwabuilder.com**.
2. Enter the published HTTPS address (for example `https://www.tsmhst.co.ke/portal/`).
3. Choose **Package for stores → Android** and download the package.
4. Install the APK on a test phone, or upload the bundle to Google Play.

The APK wraps the same portal; updates published on the website reach the app automatically.

---

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| Preview window closes immediately | Right-click `Preview on this PC.bat` → **Run as administrator**, or run `powershell -ExecutionPolicy Bypass -File preview.ps1` in that folder |
| "Port 5500 is already in use" | Close the earlier preview window, or change `$port = 5500` in `preview.ps1` to `5501` |
| Blank page after upload | Confirm `index.html` is directly inside `public_html/portal`, not inside a second `portal` folder |
| No "Install app" on Android | Use HTTPS, reload once, update Chrome; or use Chrome menu → **Add to Home screen** |
| App shows old content after an update | Close and reopen the app twice, or clear site data once; also bump the cache name in `sw.js` |
| Sign-in says pending | The account needs administrator approval under **Approvals** |
| Payment not showing as paid | The campus admin must verify the M-Pesa code under **Payments** |
| Marks import says "No rows matched" | The file needs an `Admission no.` column, and the numbers must match students registered for that unit and term |
| Class QR opens the portal without the code | Open the session first and scan while it is live; the code stops working when the session closes |
| Language partly untranslated | English and Kiswahili are complete; other languages fall back to English for untranslated labels |

---

## 15. Support

- **Portal help:** SammieNyamsy@gmail.com · WhatsApp +254 118 000 614
- **College customer care:** 0112 970 334
- **College email:** info@tsmhst.ac.ke
- **Website:** www.tsmhst.ac.ke
- **Address:** P.O. Box 3823-00200, Nairobi, Kenya

---

*TSMHST Portal v1.6.0 · Tricent School of Medical Health Science and Technology · 13 November 2026*
