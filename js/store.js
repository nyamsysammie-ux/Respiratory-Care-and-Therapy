/* TSMHST Portal — local data store, authentication and academic logic */
const DB_KEY = 'tsmhst.portal.v1';
const SESSION_KEY = 'tsmhst.session.v1';
const SEED_VERSION = 1;

const nowMs = () => Date.now();
const isoAt = offsetMs => new Date(nowMs() + offsetMs).toISOString();
const DAY = 86400000;
const uid = prefix => prefix + '_' + Math.random().toString(36).slice(2, 9) + nowMs().toString(36).slice(-4);

function randomDigits(n) {
  let out = '';
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function randomSalt() {
  if (window.crypto && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function fallbackHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'f' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

async function hashPassword(password, salt) {
  const input = salt + ':' + password + ':tsmhst';
  if (window.crypto && crypto.subtle && window.isSecureContext) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { /* fall back below */ }
  }
  return fallbackHash(input);
}

function gradeFor(total) {
  const n = Number(total) || 0;
  if (n >= 70) return { grade: 'A', points: 4, remark: 'Excellent' };
  if (n >= 60) return { grade: 'B', points: 3, remark: 'Very good' };
  if (n >= 50) return { grade: 'C', points: 2, remark: 'Good' };
  if (n >= 40) return { grade: 'D', points: 1, remark: 'Satisfactory' };
  return { grade: 'E', points: 0, remark: 'Needs improvement' };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

function programmeFor(code) { return PORTAL_PROGRAMMES.find(p => p.code === code) || PORTAL_PROGRAMMES[0]; }
function unitFor(code) { return DB.data.units.find(u => u.code === code) || UNITS.find(u => u.code === code) || null; }

const DEFAULT_SETTINGS = {
  theme: 'system', font: 'medium', lang: 'en', notifications: false,
  permissions: { location: false, camera: false, microphone: false },
  noticesReadAt: 0
};

const DB = {
  data: null,

  async init() {
    let raw = null;
    try { raw = localStorage.getItem(DB_KEY); } catch (e) { /* storage unavailable */ }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.schema === SEED_VERSION) { this.data = parsed; this.migrate(); return; }
      } catch (e) { /* reseed below */ }
    }
    this.data = await this.seed();
    this.save();
  },

  migrate() {
    const meta = this.data && this.data.meta;
    if (!meta) return;
    if (!meta.paybillsVersion || meta.paybillsVersion < 2) {
      meta.paybills = deepCopy(DEFAULT_PAYBILLS);
      meta.paybillsVersion = 2;
      this.save();
    }
  },

  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore quota */ }
  },

  reload() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.schema === SEED_VERSION) this.data = parsed;
      }
    } catch (e) { /* ignore */ }
  },

  async seed() {
    const createdAt = isoAt(0);
    const users = [];
    const passwordFor = {
      u_admin: 'Admin@2026', u_admin2: 'Admin@2026', u_council: 'Council@2026', u_council2: 'Council@2026',
      u_lec1: 'Lecturer@2026', u_lec2: 'Lecturer@2026', u_lec3: 'Lecturer@2026'
    };
    const staff = deepCopy(STAFF_MEMBERS);
    for (const person of staff) {
      const salt = randomSalt();
      users.push(Object.assign({}, person, {
        id: person.id, status: 'active', createdAt,
        password: await hashPassword(passwordFor[person.id], salt), salt,
        settings: deepCopy(DEFAULT_SETTINGS)
      }));
    }
    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const [name, admissionNo] = STUDENT_NAMES[i];
      const salt = randomSalt();
      const email = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, '.') + '@student.tsmhst.co.ke';
      users.push({
        id: 'u_stu' + (i + 1), name, role: 'student', title: 'Student, Community Health',
        email, phone: '+2547' + String(10000000 + i * 111111).slice(0, 8),
        admissionNo, programme: 'DCH6', year: 1, campus: CAMPUSES[i % CAMPUSES.length],
        department: 'Department of Health Sciences', status: 'active', createdAt,
        password: await hashPassword('Student@2026', salt), salt,
        settings: deepCopy(DEFAULT_SETTINGS)
      });
    }

    const currentUnits = UNITS.filter(u => u.current);
    const students = users.filter(u => u.role === 'student');
    const registrations = [];
    students.forEach((s, si) => {
      currentUnits.filter(u => u.programme === s.programme).forEach(u => {
        registrations.push({ id: uid('reg'), studentId: s.id, unitCode: u.code, termCode: '2026-T3', createdAt });
      });
    });

    const marks = [];
    const currDch = currentUnits.filter(u => u.programme === 'DCH6');
    const markTargets = [58, 62, 66, 70, 74, 78, 82, 86, 90, 64, 72, 80];
    students.forEach((s, si) => {
      currDch.forEach((u, ui) => {
        const total = markTargets[(si + ui * 3) % markTargets.length] + (ui === 1 ? 2 : 0);
        const cat1 = clamp(Math.round(total * 0.2), 5, 20);
        const cat2 = clamp(Math.round(total * 0.2), 5, 20);
        const exam = clamp(total - cat1 - cat2, 0, 60);
        const g = gradeFor(total);
        marks.push({
          id: uid('mk'), studentId: s.id, unitCode: u.code, termCode: '2026-T3',
          cat1, cat2, exam, total, grade: g.grade, points: g.points,
          published: u.code !== 'ICT105', updatedAt: createdAt
        });
      });
      UNITS.filter(u => !u.current && u.programme === 'DCH6').forEach((u, ui) => {
        const total = 60 + ((si * 5 + ui * 9) % 36);
        const cat1 = clamp(Math.round(total * 0.2), 5, 20);
        const cat2 = clamp(Math.round(total * 0.2), 5, 20);
        const exam = clamp(total - cat1 - cat2, 0, 60);
        const g = gradeFor(total);
        marks.push({
          id: uid('mk'), studentId: s.id, unitCode: u.code, termCode: u.termCode,
          cat1, cat2, exam, total, grade: g.grade, points: g.points,
          published: true, updatedAt: createdAt
        });
      });
    });

    const invoices = students.map(s => {
      const p = programmeFor(s.programme);
      const items = [
        { label: 'Tuition', amount: p.fee.tuition },
        { label: 'Examination', amount: p.fee.examination },
        { label: 'Library & resources', amount: p.fee.library },
        { label: 'Student activity', amount: p.fee.activity }
      ];
      return {
        id: uid('inv'), studentId: s.id, termCode: '2026-T3', termLabel: 'September – December 2026',
        items, total: items.reduce((a, b) => a + b.amount, 0), createdAt
      };
    });

    const payments = [];
    const demo = users.find(u => u.id === 'u_stu1');
    payments.push(
      { id: uid('pay'), studentId: demo.id, amount: 12000, method: 'M-Pesa', reference: 'QK84LM92TX', status: 'verified', createdAt: isoAt(-40 * DAY), verifiedBy: 'u_admin', verifiedAt: isoAt(-39 * DAY) },
      { id: uid('pay'), studentId: demo.id, amount: 6000, method: 'M-Pesa', reference: 'RK22PN81QD', status: 'verified', createdAt: isoAt(-12 * DAY), verifiedBy: 'u_admin', verifiedAt: isoAt(-11 * DAY) },
      { id: uid('pay'), studentId: demo.id, amount: 4500, method: 'M-Pesa', reference: 'TJ91QW44MD', status: 'pending', createdAt: isoAt(-1 * DAY) }
    );
    const refLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    students.slice(1).forEach((s, i) => {
      if (i % 2 === 0) {
        const amount = 9000 + ((i * 2371) % 12000);
        payments.push({
          id: uid('pay'), studentId: s.id, amount, method: 'M-Pesa',
          reference: refLetters[(i + 3) % refLetters.length] + refLetters[(i + 7) % refLetters.length] + String(10000000 + i * 98765).slice(0, 8),
          status: i % 5 === 0 ? 'pending' : 'verified',
          createdAt: isoAt(-(4 + i) * DAY), verifiedBy: i % 5 === 0 ? null : 'u_admin', verifiedAt: i % 5 === 0 ? null : isoAt(-(3 + i) * DAY)
        });
      }
      if (i % 4 === 1) {
        payments.push({
          id: uid('pay'), studentId: s.id, amount: 2000 + i * 300, method: 'M-Pesa',
          reference: 'P' + String(20000000 + i * 12345).slice(0, 8), status: 'pending', createdAt: isoAt(-(2 + i) * DAY)
        });
      }
    });

    const sessions = [];
    const attendance = [];
    let sessionCounter = 0;
    currDch.forEach((u, ui) => {
      [-21, -14, -7].forEach((offset, si) => {
        const session = {
          id: 'ses_' + (++sessionCounter), unitCode: u.code, lecturerId: u.lecturer,
          code: String(100000 + ((ui * 7919 + si * 3571) % 899999)),
          openedAt: isoAt(offset * DAY), closesAt: isoAt((offset + 1) * DAY),
          status: 'closed'
        };
        sessions.push(session);
        students.forEach((s, sti) => {
          const present = (sti * 7 + si * 5 + ui * 3) % 10 < 8;
          if (present) attendance.push({ id: uid('att'), sessionId: session.id, studentId: s.id, at: isoAt(offset * DAY + 30 * 60000) });
        });
      });
    });

    const assignments = [
      {
        id: 'asg_1', unitCode: 'CHT101', title: 'Community health assessment report',
        instructions: 'Visit a community near your campus and prepare a 3-page report on the main health challenges, available services and two practical recommendations. Include a simple hand-drawn map of the area.',
        dueAt: isoAt(5 * DAY), maxScore: 20, createdBy: 'u_lec1', createdAt: isoAt(-9 * DAY)
      },
      {
        id: 'asg_2', unitCode: 'PHN103', title: 'Epidemiology case study',
        instructions: 'Read the measles outbreak case study shared in class. Calculate the attack rate for each village, identify the likely source and propose three control measures. Submit in PDF or typed text.',
        dueAt: isoAt(10 * DAY), maxScore: 30, createdBy: 'u_lec1', createdAt: isoAt(-6 * DAY)
      },
      {
        id: 'asg_3', unitCode: 'ANA102', title: 'Anatomy labelling exercise',
        instructions: 'Label the diagram of the human heart and describe the path of blood through the chambers and valves in not more than 200 words.',
        dueAt: isoAt(-3 * DAY), maxScore: 20, createdBy: 'u_lec2', createdAt: isoAt(-14 * DAY)
      },
      {
        id: 'asg_4', unitCode: 'COM104', title: 'Professional ethics reflection',
        instructions: 'Describe a situation in which a health worker might face a confidentiality dilemma. Explain how you would respond and which professional values guide you.',
        dueAt: isoAt(12 * DAY), maxScore: 15, createdBy: 'u_lec3', createdAt: isoAt(-4 * DAY)
      },
      {
        id: 'asg_5', unitCode: 'ICT105', title: 'Patient records spreadsheet',
        instructions: 'Create a spreadsheet with 10 fictional patient records, including admission number, age, unit and visit date. Add a formula that counts visits per unit and a simple chart.',
        dueAt: isoAt(7 * DAY), maxScore: 20, createdBy: 'u_lec1', createdAt: isoAt(-2 * DAY)
      }
    ];

    const submissions = [];
    students.forEach((s, si) => {
      assignments.forEach((a, ai) => {
        if (s.id === demo.id) {
          if (a.id === 'asg_3') {
            submissions.push({ id: uid('sub'), assignmentId: a.id, studentId: s.id, text: 'I labelled all four chambers, the major vessels and the valves. Blood returns through the vena cavae into the right atrium, passes the tricuspid valve to the right ventricle, is pumped through the pulmonary valve to the lungs, returns through the pulmonary veins to the left atrium, passes the mitral valve to the left ventricle and leaves through the aortic valve to the body.', createdAt: isoAt(-5 * DAY), score: 16, feedback: 'Accurate labels and a clear description. Revise the names of the semilunar valves before the exam.', gradedAt: isoAt(-2 * DAY), gradedBy: 'u_lec2' });
          }
          if (a.id === 'asg_2') {
            submissions.push({ id: uid('sub'), assignmentId: a.id, studentId: s.id, text: 'The attack rates were highest in Village B. Contaminated water is the most likely source. I recommend immediate water treatment, isolation of suspected cases and a community sensitisation campaign.', createdAt: isoAt(-1 * DAY), score: null, feedback: '', gradedAt: null, gradedBy: null });
          }
        } else if ((si + ai) % 3 === 0) {
          submissions.push({
            id: uid('sub'), assignmentId: a.id, studentId: s.id,
            text: 'Submission received. Please see the attached notes from the field visit and the calculations for each village.',
            createdAt: isoAt(-(2 + (si % 3)) * DAY),
            score: ai === 0 && si % 4 === 0 ? 14 + (si % 5) : null,
            feedback: ai === 0 && si % 4 === 0 ? 'Good effort. Add more detail on community participation next time.' : '',
            gradedAt: ai === 0 && si % 4 === 0 ? isoAt(-1 * DAY) : null, gradedBy: ai === 0 && si % 4 === 0 ? 'u_lec1' : null
          });
        }
      });
    });

    const notices = [
      { id: 'nt_1', type: 'announcement', title: 'Unit registration for September – December 2026 is open', message: 'All continuing students should register their units in the portal before the deadline. Use the Units page and confirm that your total credits are correct. New students should register after account approval.', audience: 'all', createdBy: 'u_admin', createdAt: isoAt(-2 * DAY), pinned: true },
      { id: 'nt_2', type: 'announcement', title: 'Student Council town hall — Friday 4:00 PM', message: 'The Student Council invites all students to a town hall at the Nairobi campus main hall. We will discuss the new portal, class representation, hostel matters and the end-of-term study plan. Refreshments will be provided.', audience: 'students', createdBy: 'u_council', createdAt: isoAt(-1 * DAY), pinned: true },
      { id: 'nt_3', type: 'announcement', title: 'Library extended hours during examinations', message: 'The library will remain open until 9:00 PM on weekdays and 5:00 PM on Saturdays for the next three weeks. Bring your student ID. Quiet study rooms can be booked at the front desk.', audience: 'all', createdBy: 'u_admin', createdAt: isoAt(-4 * DAY), pinned: false },
      { id: 'nt_4', type: 'system', title: 'Welcome to the TSMHST Portal', message: 'Your portal account is active. You can register units, access assignments, view results, check fees and sign in for classes here. Visit Settings to choose your theme, font size and language.', userId: 'u_stu1', createdBy: 'u_admin', createdAt: isoAt(-10 * DAY) },
      { id: 'nt_5', type: 'system', title: 'ANA102 assignment graded', message: 'Your Anatomy labelling exercise has been graded. Open Assignments to view the score and feedback.', userId: 'u_stu1', createdBy: 'u_lec2', createdAt: isoAt(-2 * DAY) },
      { id: 'nt_6', type: 'system', title: 'Fee balance reminder', message: 'Your verified fee balance is Ksh. 4,000. Please clear it before the end of term. A pending payment of Ksh. 4,500 is currently awaiting finance verification.', userId: 'u_stu1', createdBy: 'u_admin', createdAt: isoAt(-12 * 3600000) },
      { id: 'nt_7', type: 'system', title: 'Payments awaiting verification', message: 'There are pending fee payments in the finance desk. Open Finance to verify the latest transaction references.', audience: 'admins', createdBy: 'u_stu1', createdAt: isoAt(-3 * 3600000) }
    ];

    const presence = {};
    const lastSeenOffsets = [2 * 3600000, 5 * 3600000, 35 * 60000, 4 * 86400000, 26 * 3600000, 2 * 86400000, 6 * 3600000];
    STAFF_MEMBERS.forEach((m, i) => {
      presence[m.id] = { online: false, lastSeen: nowMs() - lastSeenOffsets[i % lastSeenOffsets.length] };
    });

    return {
      schema: SEED_VERSION,
      createdAt,
      meta: {
        academicYear: '2026/2027',
        termLabel: 'September – December 2026',
        termCode: '2026-T3',
        registrationOpen: true,
        registrationDeadline: '2026-12-05',
        paybills: deepCopy(DEFAULT_PAYBILLS),
        paybillsVersion: 2,
        nextAdmissionSeq: 13
      },
      users, units: deepCopy(UNITS), registrations, marks, invoices, payments,
      sessions, attendance, assignments, submissions, notices, presence,
      hostelBookings: [
        { id: uid('hb'), studentId: 'u_stu2', hostelId: 'H2', termCode: '2026-T3', status: 'pending', createdAt: isoAt(-2 * DAY) }
      ],
      feedback: []
    };
  },

  session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  },
  currentUser() {
    const ses = this.session();
    if (!ses || !ses.userId) return null;
    return this.data.users.find(u => u.id === ses.userId && u.status === 'active') || null;
  },
  isStaff(user) { return user && (user.role === 'admin' || user.role === 'lecturer'); },

  touchPresence() {
    const user = this.currentUser();
    if (!user) return;
    this.data.presence[user.id] = { online: true, lastSeen: nowMs() };
    this.save();
  },

  async login(identifier, password) {
    const key = String(identifier || '').trim().toLowerCase();
    const user = this.data.users.find(u =>
      (u.email || '').toLowerCase() === key ||
      (u.admissionNo || '').toLowerCase() === key ||
      (u.staffNo || '').toLowerCase() === key
    );
    if (!user) return { error: 'invalid' };
    if (user.status === 'pending') return { error: 'pending' };
    if (user.status === 'rejected' || user.status === 'suspended') return { error: 'inactive' };
    const hash = await hashPassword(String(password || ''), user.salt);
    if (hash !== user.password) return { error: 'invalid' };
    const ses = { userId: user.id, sid: uid('sid'), at: nowMs() };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(ses)); } catch (e) { /* ignore */ }
    this.data.presence[user.id] = { online: true, lastSeen: nowMs() };
    this.save();
    return { user };
  },

  logout() {
    const user = this.currentUser();
    if (user) {
      this.data.presence[user.id] = { online: false, lastSeen: nowMs() };
      this.save();
    }
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  },

  async register(payload) {
    const email = String(payload.email || '').trim().toLowerCase();
    const admissionNo = String(payload.admissionNo || '').trim().toUpperCase();
    const staffNo = String(payload.staffNo || '').trim().toUpperCase();
    if (!email || !payload.name || !payload.password) return { error: 'missing' };
    if (this.data.users.some(u => (u.email || '').toLowerCase() === email)) return { error: 'email' };
    if (payload.role === 'student') {
      if (!admissionNo) return { error: 'admission' };
      if (this.data.users.some(u => (u.admissionNo || '').toUpperCase() === admissionNo)) return { error: 'admission' };
    }
    if (payload.role === 'lecturer') {
      if (!staffNo) return { error: 'staff' };
      if (this.data.users.some(u => (u.staffNo || '').toUpperCase() === staffNo)) return { error: 'staff' };
    }
    const salt = randomSalt();
    const user = {
      id: uid('usr'), role: payload.role === 'lecturer' ? 'lecturer' : 'student',
      name: String(payload.name).trim(), email,
      phone: String(payload.phone || '').trim(),
      status: 'pending', createdAt: isoAt(0),
      password: await hashPassword(payload.password, salt), salt,
      settings: deepCopy(DEFAULT_SETTINGS)
    };
    if (user.role === 'student') {
      user.admissionNo = admissionNo;
      user.programme = payload.programme || 'DCH6';
      user.year = Number(payload.year) || 1;
      user.campus = payload.campus || 'Nairobi';
      user.department = programmeFor(user.programme).dept;
      user.title = 'Student, ' + programmeFor(user.programme).short;
    } else {
      user.staffNo = staffNo;
      user.department = payload.department || 'Department of Health Sciences';
      user.title = 'Lecturer, ' + user.department.replace('Department of ', '');
    }
    this.data.users.push(user);
    this.save();
    return { user };
  },

  approveUser(id, adminId) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return;
    user.status = 'active';
    user.approvedAt = isoAt(0);
    user.approvedBy = adminId || null;
    if (user.role === 'student') this.ensureInvoice(user);
    this.addNotice({
      title: 'Your portal account is approved', type: 'system',
      message: 'Welcome to the TSMHST Portal. You can now register units, view assignments and access your fees. Visit Settings to personalise the app.',
      userId: user.id, createdBy: adminId || 'u_admin'
    });
    this.save();
  },

  rejectUser(id, adminId) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return;
    user.status = 'rejected';
    user.rejectedAt = isoAt(0);
    user.rejectedBy = adminId || null;
    this.save();
  },

  setUserStatus(id, status) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return;
    user.status = status;
    this.save();
  },

  ensureInvoice(user) {
    if (!user || user.role !== 'student') return;
    const exists = this.data.invoices.some(i => i.studentId === user.id && i.termCode === this.data.meta.termCode);
    if (exists) return;
    const p = programmeFor(user.programme);
    const items = [
      { label: 'Tuition', amount: p.fee.tuition },
      { label: 'Examination', amount: p.fee.examination },
      { label: 'Library & resources', amount: p.fee.library },
      { label: 'Student activity', amount: p.fee.activity }
    ];
    this.data.invoices.push({
      id: uid('inv'), studentId: user.id, termCode: this.data.meta.termCode,
      termLabel: this.data.meta.termLabel,
      items, total: items.reduce((a, b) => a + b.amount, 0), createdAt: isoAt(0)
    });
    this.save();
  },

  settings(user) {
    const u = user || this.currentUser();
    if (!u) return deepCopy(DEFAULT_SETTINGS);
    u.settings = Object.assign({}, DEFAULT_SETTINGS, u.settings || {});
    u.settings.permissions = Object.assign({}, DEFAULT_SETTINGS.permissions, (u.settings || {}).permissions || {});
    return u.settings;
  },
  saveSettings(patch) {
    const user = this.currentUser();
    if (!user) return;
    const current = this.settings(user);
    Object.assign(current, patch);
    user.settings = current;
    this.save();
  },

  unitsForProgramme(programme, currentOnly) {
    return this.data.units.filter(u => u.programme === programme && (currentOnly === false || u.current));
  },
  unit(code) { return this.data.units.find(u => u.code === code) || null; },
  user(id) { return this.data.users.find(u => u.id === id) || null; },
  programme(code) { return programmeFor(code); },

  registrationsFor(userId, termCode) {
    return this.data.registrations.filter(r => r.studentId === userId && (!termCode || r.termCode === termCode));
  },
  isRegistered(studentId, unitCode) {
    return this.data.registrations.some(r => r.studentId === studentId && r.unitCode === unitCode && r.termCode === this.data.meta.termCode);
  },
  registerUnit(studentId, unitCode) {
    if (!this.data.meta.registrationOpen) return { error: 'closed' };
    if (this.isRegistered(studentId, unitCode)) return { error: 'duplicate' };
    const unit = this.unit(unitCode);
    if (!unit || !unit.current) return { error: 'unit' };
    this.data.registrations.push({ id: uid('reg'), studentId, unitCode, termCode: this.data.meta.termCode, createdAt: isoAt(0) });
    this.save();
    return { ok: true };
  },
  dropUnit(studentId, unitCode) {
    if (!this.data.meta.registrationOpen) return { error: 'closed' };
    this.data.registrations = this.data.registrations.filter(r => !(r.studentId === studentId && r.unitCode === unitCode && r.termCode === this.data.meta.termCode));
    this.save();
    return { ok: true };
  },
  studentsForUnit(unitCode, termCode) {
    const term = termCode || this.data.meta.termCode;
    const ids = this.data.registrations.filter(r => r.unitCode === unitCode && r.termCode === term).map(r => r.studentId);
    return this.data.users.filter(u => ids.includes(u.id) && u.role === 'student' && u.status === 'active');
  },
  unitsForLecturer(userId) {
    return this.data.units.filter(u => u.current && u.lecturer === userId);
  },

  marksForUnit(unitCode, termCode) {
    return this.data.marks.filter(m => m.unitCode === unitCode && (!termCode || m.termCode === termCode));
  },
  marksForStudent(studentId, publishedOnly) {
    return this.data.marks.filter(m => m.studentId === studentId && (!publishedOnly || m.published));
  },
  gpa(marks) {
    const valid = marks.filter(m => m.points !== undefined && m.published !== false);
    if (!valid.length) return null;
    const credits = valid.reduce((sum, m) => { const u = this.unit(m.unitCode); return sum + (u ? u.credits : 0); }, 0);
    if (!credits) return valid.reduce((a, m) => a + m.points, 0) / valid.length;
    const weighted = valid.reduce((sum, m) => { const u = this.unit(m.unitCode); return sum + m.points * (u ? u.credits : 0); }, 0);
    return weighted / credits;
  },
  classification(gpa) {
    if (gpa === null) return '—';
    if (gpa >= 3.6) return 'First Class Honours';
    if (gpa >= 3.0) return 'Second Class Honours (Upper Division)';
    if (gpa >= 2.5) return 'Second Class Honours (Lower Division)';
    if (gpa >= 2.0) return 'Pass';
    return 'Fail';
  },

  saveMarks(unitCode, entries, termCode) {
    const term = termCode || this.data.meta.termCode;
    const now = isoAt(0);
    entries.forEach(entry => {
      const cat1 = clamp(entry.cat1, 0, 20);
      const cat2 = clamp(entry.cat2, 0, 20);
      const exam = clamp(entry.exam, 0, 60);
      const total = cat1 + cat2 + exam;
      const g = gradeFor(total);
      let mark = this.data.marks.find(m => m.studentId === entry.studentId && m.unitCode === unitCode && m.termCode === term);
      if (!mark) {
        mark = { id: uid('mk'), studentId: entry.studentId, unitCode, termCode: term, published: false };
        this.data.marks.push(mark);
      }
      Object.assign(mark, { cat1, cat2, exam, total, grade: g.grade, points: g.points, updatedAt: now });
    });
    this.save();
  },

  randomizeMarks(unitCode, termCode) {
    const term = termCode || this.data.meta.termCode;
    const students = this.studentsForUnit(unitCode, term);
    const now = isoAt(0);
    students.forEach(student => {
      const total = 40 + Math.floor(Math.random() * 55);
      const cat1 = clamp(Math.round(total * 0.2 + (Math.random() * 4 - 2)), 2, 20);
      const cat2 = clamp(Math.round(total * 0.2 + (Math.random() * 4 - 2)), 2, 20);
      const exam = clamp(total - cat1 - cat2, 0, 60);
      const finalTotal = cat1 + cat2 + exam;
      const g = gradeFor(finalTotal);
      let mark = this.data.marks.find(m => m.studentId === student.id && m.unitCode === unitCode && m.termCode === term);
      if (!mark) {
        mark = { id: uid('mk'), studentId: student.id, unitCode, termCode: term, published: false };
        this.data.marks.push(mark);
      }
      Object.assign(mark, { cat1, cat2, exam, total: finalTotal, grade: g.grade, points: g.points, updatedAt: now });
    });
    this.save();
    return students.length;
  },

  randomizeProgramme(programme, termCode) {
    const units = this.data.units.filter(u => u.current && u.programme === programme);
    let count = 0;
    units.forEach(u => { count += this.randomizeMarks(u.code, termCode); });
    return count;
  },

  setPublished(unitCode, published, publisherId) {
    const term = this.data.meta.termCode;
    const marks = this.marksForUnit(unitCode, term);
    marks.forEach(m => { m.published = !!published; });
    if (published) {
      const unit = this.unit(unitCode);
      this.studentsForUnit(unitCode, term).forEach(student => {
        this.addNotice({
          title: 'Results published — ' + unitCode, type: 'system',
          message: 'Results for ' + unit.title + ' have been published. Open Results to view your marks.',
          userId: student.id, createdBy: publisherId || 'u_admin'
        });
      });
    }
    this.save();
  },

  assignmentsForStudent(userId) {
    const unitCodes = this.registrationsFor(userId, this.data.meta.termCode).map(r => r.unitCode);
    return this.data.assignments.filter(a => unitCodes.includes(a.unitCode));
  },
  assignmentsForStaff(user) {
    if (user.role === 'admin') return this.data.assignments.slice();
    const unitCodes = this.unitsForLecturer(user.id).map(u => u.code);
    return this.data.assignments.filter(a => unitCodes.includes(a.unitCode));
  },
  submissionFor(assignmentId, studentId) {
    return this.data.submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId) || null;
  },
  submissionsFor(assignmentId) {
    return this.data.submissions.filter(s => s.assignmentId === assignmentId);
  },
  submitAssignment(assignmentId, studentId, text) {
    const assignment = this.data.assignments.find(a => a.id === assignmentId);
    if (!assignment) return { error: 'missing' };
    if (new Date(assignment.dueAt).getTime() < nowMs()) return { error: 'closed' };
    let sub = this.submissionFor(assignmentId, studentId);
    if (sub && sub.gradedAt) return { error: 'graded' };
    if (!sub) {
      sub = { id: uid('sub'), assignmentId, studentId, text: '', createdAt: isoAt(0), score: null, feedback: '', gradedAt: null, gradedBy: null };
      this.data.submissions.push(sub);
    }
    sub.text = String(text || '').trim();
    sub.createdAt = isoAt(0);
    this.save();
    return { ok: true, submission: sub };
  },
  createAssignment(payload, userId) {
    const assignment = {
      id: uid('asg'), unitCode: payload.unitCode, title: payload.title,
      instructions: payload.instructions, dueAt: payload.dueAt, maxScore: Number(payload.maxScore) || 20,
      createdBy: userId, createdAt: isoAt(0)
    };
    this.data.assignments.push(assignment);
    this.save();
    return assignment;
  },
  gradeSubmission(submissionId, score, feedback, graderId) {
    const sub = this.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    const assignment = this.data.assignments.find(a => a.id === sub.assignmentId);
    sub.score = clamp(score, 0, assignment ? assignment.maxScore : 100);
    sub.feedback = String(feedback || '');
    sub.gradedAt = isoAt(0);
    sub.gradedBy = graderId;
    this.addNotice({
      title: 'Assignment graded', type: 'system',
      message: (assignment ? assignment.title : 'Your assignment') + ' has been graded. Open Assignments to view your score and feedback.',
      userId: sub.studentId, createdBy: graderId
    });
    this.save();
  },

  sessionsForUnit(unitCode) {
    return this.data.sessions.filter(s => s.unitCode === unitCode).sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  },
  openSessionsForStudent(userId) {
    const unitCodes = this.registrationsFor(userId, this.data.meta.termCode).map(r => r.unitCode);
    return this.data.sessions.filter(s => s.status === 'open' && unitCodes.includes(s.unitCode) && new Date(s.closesAt).getTime() > nowMs());
  },
  createSession(unitCode, lecturerId, minutes) {
    const session = {
      id: uid('ses'), unitCode, lecturerId, code: randomDigits(6),
      openedAt: isoAt(0), closesAt: isoAt((Number(minutes) || 30) * 60000), status: 'open'
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  },
  closeSession(id) {
    const s = this.data.sessions.find(x => x.id === id);
    if (s) { s.status = 'closed'; s.closesAt = isoAt(0); this.save(); }
  },
  signIn(code, studentId) {
    const key = String(code || '').trim();
    const session = this.data.sessions.find(s => s.code === key && s.status === 'open');
    if (!session) return { error: 'code' };
    if (new Date(session.closesAt).getTime() < nowMs()) return { error: 'expired' };
    if (!this.isRegistered(studentId, session.unitCode)) return { error: 'unit' };
    const exists = this.data.attendance.some(a => a.sessionId === session.id && a.studentId === studentId);
    if (exists) return { error: 'already' };
    this.data.attendance.push({ id: uid('att'), sessionId: session.id, studentId, at: isoAt(0) });
    this.save();
    return { ok: true, session };
  },
  attendanceForSession(sessionId) {
    return this.data.attendance.filter(a => a.sessionId === sessionId);
  },
  attendanceSummary(studentId) {
    const regs = this.registrationsFor(studentId, this.data.meta.termCode);
    return regs.map(r => {
      const sessions = this.data.sessions.filter(s => s.unitCode === r.unitCode);
      const ids = sessions.map(s => s.id);
      const attended = this.data.attendance.filter(a => a.studentId === studentId && ids.includes(a.sessionId)).length;
      return {
        unitCode: r.unitCode, unit: this.unit(r.unitCode),
        held: sessions.length, attended,
        percent: sessions.length ? Math.round((attended / sessions.length) * 100) : 0
      };
    });
  },
  overallAttendance(studentId) {
    const summary = this.attendanceSummary(studentId);
    const held = summary.reduce((a, b) => a + b.held, 0);
    const attended = summary.reduce((a, b) => a + b.attended, 0);
    return { held, attended, percent: held ? Math.round((attended / held) * 100) : 0 };
  },

  invoicesFor(studentId) { return this.data.invoices.filter(i => i.studentId === studentId); },
  invoiceFor(studentId, termCode) { return this.data.invoices.find(i => i.studentId === studentId && i.termCode === (termCode || this.data.meta.termCode)) || null; },
  paymentsFor(studentId) { return this.data.payments.filter(p => p.studentId === studentId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  feeSummary(studentId) {
    const invoices = this.invoicesFor(studentId);
    const billed = invoices.reduce((a, b) => a + b.total, 0);
    const paid = this.paymentsFor(studentId).filter(p => p.status === 'verified').reduce((a, b) => a + b.amount, 0);
    const pending = this.paymentsFor(studentId).filter(p => p.status === 'pending').reduce((a, b) => a + b.amount, 0);
    return { billed, paid, pending, balance: Math.max(0, billed - paid) };
  },
  recordPayment(studentId, amount, reference, method) {
    const amt = Number(amount);
    if (!amt || amt <= 0 || !String(reference || '').trim()) return { error: 'invalid' };
    const payment = {
      id: uid('pay'), studentId, amount: amt, method: method || 'M-Pesa',
      reference: String(reference).trim().toUpperCase(), status: 'pending', createdAt: isoAt(0)
    };
    this.data.payments.push(payment);
    this.addNotice({
      title: 'New payment awaiting verification', type: 'system',
      message: (this.user(studentId) || {}).name + ' submitted Ksh. ' + amt.toLocaleString('en-KE') + ' with reference ' + payment.reference + '. Verify it in Finance.',
      audience: 'admins', createdBy: studentId
    });
    this.save();
    return { ok: true, payment };
  },
  verifyPayment(paymentId, adminId) {
    const p = this.data.payments.find(x => x.id === paymentId);
    if (!p) return;
    p.status = 'verified'; p.verifiedBy = adminId; p.verifiedAt = isoAt(0);
    this.addNotice({
      title: 'Payment verified', type: 'system',
      message: 'Your payment of Ksh. ' + p.amount.toLocaleString('en-KE') + ' (ref ' + p.reference + ') has been verified. Your fee balance has been updated.',
      userId: p.studentId, createdBy: adminId
    });
    this.save();
  },
  rejectPayment(paymentId, adminId) {
    const p = this.data.payments.find(x => x.id === paymentId);
    if (!p) return;
    p.status = 'rejected'; p.verifiedBy = adminId; p.verifiedAt = isoAt(0);
    this.addNotice({
      title: 'Payment could not be verified', type: 'system',
      message: 'We could not verify your payment reference ' + p.reference + '. Please check the M-Pesa code and contact the finance office.',
      userId: p.studentId, createdBy: adminId
    });
    this.save();
  },
  savePaybills(fees, hostel) {
    this.data.meta.paybills = {
      fees: {
        channel: 'paybill', accountMode: 'student-name-k',
        paybill: String(fees.paybill || '').trim(), name: String(fees.name || '').trim(),
        accountHint: String(fees.accountHint || '').trim(), demo: false
      },
      hostel: {
        channel: 'buygoods', accountMode: 'none',
        paybill: String(hostel.paybill || '').trim(), name: String(hostel.name || '').trim(),
        accountHint: String(hostel.accountHint || '').trim(), demo: false
      }
    };
    this.data.meta.paybillsVersion = 2;
    this.save();
  },
  hostelBookingsFor(studentId) { return this.data.hostelBookings.filter(b => b.studentId === studentId); },
  bookHostel(studentId, hostelId) {
    if (!hostelId) return { error: 'missing' };
    const existing = this.data.hostelBookings.find(b => b.studentId === studentId && b.termCode === this.data.meta.termCode && b.status !== 'rejected');
    if (existing) return { error: 'exists' };
    const booking = { id: uid('hb'), studentId, hostelId, termCode: this.data.meta.termCode, status: 'pending', createdAt: isoAt(0) };
    this.data.hostelBookings.push(booking);
    this.addNotice({
      title: 'New hostel booking request', type: 'system',
      message: (this.user(studentId) || {}).name + ' requested ' + (HOSTELS.find(h => h.id === hostelId) || {}).room + '. Review it in Finance.',
      audience: 'admins', createdBy: studentId
    });
    this.save();
    return { ok: true, booking };
  },
  setBookingStatus(bookingId, status, adminId) {
    const booking = this.data.hostelBookings.find(b => b.id === bookingId);
    if (!booking) return;
    booking.status = status;
    booking.reviewedBy = adminId;
    booking.reviewedAt = isoAt(0);
    const hostel = HOSTELS.find(h => h.id === booking.hostelId);
    this.addNotice({
      title: status === 'approved' ? 'Hostel booking approved' : 'Hostel booking declined', type: 'system',
      message: status === 'approved'
        ? 'Your booking for ' + (hostel ? hostel.room : 'hostel accommodation') + ' has been approved. Pay Ksh. ' + (hostel ? hostel.perTerm.toLocaleString('en-KE') : '') + ' via the hostel M-Pesa Buy Goods till.'
        : 'Your hostel booking request was not approved. Please contact the accommodation office for available options.',
      userId: booking.studentId, createdBy: adminId
    });
    this.save();
  },

  feedbackFor(userId) { return this.data.feedback.find(f => f.userId === userId) || null; },
  rateApp(userId, stars, message) {
    let f = this.feedbackFor(userId);
    if (!f) {
      f = { id: uid('fb'), userId, stars: 0, message: '', createdAt: isoAt(0) };
      this.data.feedback.push(f);
    }
    f.stars = clamp(stars, 1, 5);
    f.message = String(message || '');
    f.createdAt = isoAt(0);
    this.save();
  },

  noticesFor(user) {
    if (!user) return [];
    return this.data.notices.filter(n => {
      if (n.userId) return n.userId === user.id;
      if (n.audience === 'all') return true;
      if (n.audience === 'students') return user.role === 'student' || user.role === 'council';
      if (n.audience === 'staff') return user.role === 'lecturer' || user.role === 'admin';
      if (n.audience === 'admins') return user.role === 'admin';
      if (n.audience === 'council') return user.role === 'council';
      return false;
    }).sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  },
  unreadCount(user) {
    const readAt = this.settings(user).noticesReadAt || 0;
    return this.noticesFor(user).filter(n => new Date(n.createdAt).getTime() > readAt).length;
  },
  markNoticesRead() {
    const user = this.currentUser();
    if (!user) return;
    this.settings(user).noticesReadAt = nowMs();
    this.save();
  },
  addNotice(payload) {
    this.data.notices.push(Object.assign({
      id: uid('nt'), type: 'system', title: '', message: '', createdBy: 'system',
      createdAt: isoAt(0), pinned: false
    }, payload));
    this.save();
  },
  createAnnouncement(payload, userId) {
    this.addNotice({
      title: payload.title, message: payload.message, type: 'announcement',
      audience: payload.audience || 'all', createdBy: userId, pinned: !!payload.pinned
    });
  },
  deleteNotice(id) {
    this.data.notices = this.data.notices.filter(n => n.id !== id);
    this.save();
  },

  updateMeta(patch) {
    Object.assign(this.data.meta, patch);
    this.save();
  },

  presenceOf(userId) {
    const p = this.data.presence[userId];
    if (!p) return { online: false, lastSeen: null };
    return { online: !!p.online && (nowMs() - p.lastSeen) < 90000, lastSeen: p.lastSeen };
  },
  team() {
    const ids = STAFF_MEMBERS.map(m => m.id);
    return this.data.users.filter(u => ids.includes(u.id) || u.role === 'lecturer').map(u => Object.assign({}, u, { presence: this.presenceOf(u.id) }));
  },
  pendingUsers() { return this.data.users.filter(u => u.status === 'pending'); },
  recentPendingPayments() { return this.data.payments.filter(p => p.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  financeSummary() {
    const verified = this.data.payments.filter(p => p.status === 'verified');
    return {
      collected: verified.reduce((a, b) => a + b.amount, 0),
      pending: this.data.payments.filter(p => p.status === 'pending').reduce((a, b) => a + b.amount, 0),
      pendingCount: this.data.payments.filter(p => p.status === 'pending').length
    };
  },

  programmeStats(programme) {
    const units = this.data.units.filter(u => u.current && u.programme === programme);
    const students = this.data.users.filter(u => u.role === 'student' && u.programme === programme && u.status === 'active');
    return { units: units.length, students: students.length };
  }
};
