/* TSMHST Portal — routing, interactions, settings, permissions and PWA */
const ACCESS = {
  student: ['home', 'units', 'assignments', 'results', 'transcript', 'attendance', 'timetable', 'fees', 'hostel', 'documents', 'team', 'about', 'settings', 'notifications'],
  lecturer: ['home', 'units', 'assignments', 'marks', 'attendance', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  owner: ['settings'],
  director: ['home', 'campuses', 'approvals', 'users', 'quality', 'marks', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  deputy_director: ['home', 'campuses', 'approvals', 'users', 'quality', 'marks', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  general_admin: ['home', 'campuses', 'approvals', 'users', 'quality', 'marks', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  principal: ['home', 'approvals', 'users', 'payments', 'academics', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  campus_admin: ['home', 'approvals', 'users', 'payments', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  registrar: ['home', 'academics', 'timetable', 'users', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  exam_officer: ['home', 'marks', 'academics', 'timetable', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  qa_officer: ['home', 'quality', 'campuses', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  accounts_clerk: ['home', 'finance', 'documents', 'announcements', 'team', 'about', 'settings', 'notifications'],
  secretary: ['home', 'announcements', 'users', 'documents', 'team', 'about', 'settings', 'notifications'],
  council: ['home', 'announcements', 'documents', 'team', 'about', 'settings', 'notifications']
};

let deferredInstallPrompt = null;
let lastUnread = 0;

function canApproveAccounts(user) {
  return !!user && (user.role === 'owner' || isAdminRole(user.role)) && user.role !== 'secretary';
}

function canVerifyPayments(user) {
  return !!user && user.role === 'campus_admin';
}

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

document.addEventListener('DOMContentLoaded', boot);

async function boot() {
  await DB.init();
  if (!location.hash) history.replaceState(null, '', '#/home');
  registerServiceWorker();
  setupInstall();
  applyPreferences();
  render();
  bindGlobalEvents();
  setInterval(() => {
    const user = DB.currentUser();
    if (user) DB.touchPresence();
  }, 25000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) DB.touchPresence(); });
  window.addEventListener('online', () => { render(); toast('You are back online.', 'success'); });
  window.addEventListener('offline', () => { render(); toast('You are offline. Cached pages still work.', 'info'); });
}

function currentRoute(user) {
  let route = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
  const allowed = ACCESS[user.role];
  if (!allowed || !allowed.includes(route)) route = (allowed && allowed[0]) || 'home';
  return route;
}

function applyPreferences(user) {
  const settings = user ? DB.settings(user) : {
    theme: localStorage.getItem('tsmhst.theme') || 'system',
    font: localStorage.getItem('tsmhst.font') || 'medium',
    lang: localStorage.getItem('tsmhst.lang') || 'en'
  };
  I18N.setLang(settings.lang || 'en');
  document.documentElement.dataset.theme = settings.theme || 'system';
  document.documentElement.dataset.font = settings.font || 'medium';
  localStorage.setItem('tsmhst.theme', settings.theme || 'system');
  localStorage.setItem('tsmhst.font', settings.font || 'medium');
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#111710' : '#3f8f1f');
}

function render() {
  closeOverlays(false);
  const user = DB.currentUser();
  if (!user) {
    applyPreferences();
    document.title = APP.name + ' · Sign in';
    app.innerHTML = authPage();
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }
  const route = currentRoute(user);
  const codeMatch = location.hash.match(/[?&]code=(\d{6})/);
  if (codeMatch) PORTAL_STATE.attendance.code = codeMatch[1];
  if (location.hash !== '#/' + route) history.replaceState(null, '', '#/' + route);
  applyPreferences(user);
  if (route === 'notifications') { DB.markNoticesRead(); lastUnread = 0; }
  const unread = DB.unreadCount(user);
  if (lastUnread && unread > lastUnread) notifyDevice('TSMHST Portal', 'You have new portal updates.');
  lastUnread = unread;
  document.title = APP.name + ' · ' + I18N.t(routeTitle(route));
  app.innerHTML = renderPortal(user, route);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------------- Global events ---------------- */

function bindGlobalEvents() {
  document.addEventListener('click', async e => {
    if (e.target.closest('a[href^="#/"]')) closeOverlays();
    const el = e.target.closest('[data-action]');
    if (!el) return;
    e.preventDefault();
    try {
      await handleAction(el.dataset.action, el, e);
    } catch (err) {
      console.error(err);
      toast('Something went wrong. Please try again.', 'error');
    }
  });

  document.addEventListener('submit', async e => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    try {
      await handleSubmit(form);
    } catch (err) {
      console.error(err);
      toast('Something went wrong. Please try again.', 'error');
    }
  });

  document.addEventListener('change', async e => {
    const t = e.target;
    try {
      if (t.matches('[data-setting="notifications"]')) {
        await changeNotifications(t.checked);
        return;
      }
      if (t.matches('[data-permission]')) {
        await changePermission(t.dataset.permission, t.checked);
        return;
      }
      if (t.matches('input[name="role"]') && t.closest('[data-reg-role-group]')) {
        const form = t.closest('form');
        form.querySelector('.reg-student-fields').hidden = t.value !== 'student';
        form.querySelector('.reg-lecturer-fields').hidden = t.value !== 'lecturer';
        form.querySelector('.reg-admin-fields').hidden = t.value !== 'admin';
        form.querySelectorAll('.radio-card').forEach(card => card.classList.toggle('active', card.contains(t)));
        return;
      }
      if (t.id === 'marks-unit') {
        PORTAL_STATE.marks.unitCode = t.value;
        PORTAL_STATE.marks.order = null;
        render();
        return;
      }
      if (t.id === 'marks-sort') {
        PORTAL_STATE.marks.sort = t.value;
        if (t.value === 'random') {
          const students = DB.studentsForUnit(PORTAL_STATE.marks.unitCode);
          PORTAL_STATE.marks.order = students.map(s => s.id).sort(() => Math.random() - 0.5);
        } else PORTAL_STATE.marks.order = null;
        render();
        return;
      }
      if (t.id === 'att-unit') {
        PORTAL_STATE.attendance.unitCode = t.value;
        render();
        return;
      }
      if (t.id === 'timetable-programme') {
        PORTAL_STATE.timetable.programme = t.value;
        render();
        return;
      }
      if (t.id === 'doc-category') {
        PORTAL_STATE.documents.category = t.value;
        render();
        return;
      }
    } catch (err) {
      console.error(err);
      toast('Could not apply that change.', 'error');
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('.mark-input')) { recalcMarkRow(t); return; }
    if (t.id === 'marks-search') { filterRows('[data-search-row]', t.value); return; }
    if (t.id === 'users-search') { filterUsers(); return; }
    if (t.id === 'course-search') { filterCourses(); return; }
    if (t.id === 'language-search') { filterLanguages(t.value); return; }
  });

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', e => {
    if (e.key !== DB_KEY) return;
    DB.reload();
    const user = DB.currentUser();
    if (!user) { render(); return; }
    const unread = DB.unreadCount(user);
    if (lastUnread && unread > lastUnread && DB.settings(user).notifications && ('Notification' in window) && Notification.permission === 'granted') {
      notifyDevice('New TSMHST Portal update', 'Open the portal to see the latest announcement or record update.');
    }
    lastUnread = unread;
    if (!document.body.classList.contains('modal-open')) {
      const route = currentRoute(user);
      if (route === 'team') render();
    }
  });
}

function closeOverlays(closeDialog) {
  document.body.classList.remove('sidebar-open');
  document.body.classList.remove('more-open');
  if (closeDialog !== false) closeModal();
}

/* ---------------- Action handler ---------------- */

async function handleAction(action, el, event) {
  const user = DB.currentUser();
  switch (action) {
    case 'logout':
      DB.logout();
      lastUnread = 0;
      if (location.hash) history.replaceState(null, '', '#/home');
      render();
      toast('Signed out successfully.', 'info');
      return;
    case 'toggle-sidebar':
      document.body.classList.toggle('sidebar-open');
      return;
    case 'open-more':
      document.body.classList.add('more-open');
      const sheet = document.getElementById('more-sheet');
      if (sheet) sheet.setAttribute('aria-hidden', 'false');
      document.querySelectorAll('[data-action="open-more"]').forEach(b => b.setAttribute('aria-expanded', 'true'));
      return;
    case 'close-more':
      document.body.classList.remove('more-open');
      const closedSheet = document.getElementById('more-sheet');
      if (closedSheet) closedSheet.setAttribute('aria-hidden', 'true');
      document.querySelectorAll('[data-action="open-more"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      return;
    case 'auth-tab':
      switchAuthTab(el.dataset.tab);
      return;
    case 'toggle-password': {
      const input = document.getElementById(el.dataset.target);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
      return;
    }
    case 'demo-fill': {
      const demo = DEMO_ACCOUNTS[Number(el.dataset.demo)];
      if (!demo) return;
      switchAuthTab('signin');
      document.getElementById('signin-identifier').value = demo.identifier;
      document.getElementById('signin-password').value = demo.password;
      showAuthAlert('info', demo.label + ' demo credentials filled. Tap Sign in to continue.');
      return;
    }
    case 'show-terms':
      openTerms();
      return;
    case 'public-about':
      modal('About Tricent & the portal', publicContentHTML(), { size: 'lg' });
      return;
    case 'install-app':
      await installApp();
      return;
    case 'refresh-team':
      render();
      toast('Presence refreshed.', 'info');
      return;
    case 'copy':
      copyText(el.dataset.copy || '');
      return;
    case 'unit-register': {
      if (!user || user.role !== 'student') return;
      const result = DB.registerUnit(user.id, el.dataset.unit);
      if (result.error === 'closed') toast('Unit registration is closed.', 'error');
      else if (result.error === 'duplicate') toast('You have already registered this unit.', 'info');
      else { toast('Unit registered successfully.', 'success'); render(); }
      return;
    }
    case 'unit-drop': {
      if (!user || user.role !== 'student') return;
      const unit = DB.unit(el.dataset.unit);
      const ok = await confirmDialog({ title: 'Drop unit', message: `Remove ${unit ? unit.code + ' · ' + unit.title : 'this unit'} from your registration? It will disappear from attendance, assignments and results.`, confirmText: 'Drop unit', danger: true });
      if (!ok) return;
      const result = DB.dropUnit(user.id, el.dataset.unit);
      if (result.error) toast('Registration is closed. Contact the academic office.', 'error');
      else { toast('Unit dropped.', 'info'); render(); }
      return;
    }
    case 'select-marks-unit':
      PORTAL_STATE.marks.unitCode = el.dataset.unit;
      PORTAL_STATE.marks.order = null;
      if (location.hash === '#/marks') render(); else location.hash = '#/marks';
      return;
    case 'select-att-unit':
      PORTAL_STATE.attendance.unitCode = el.dataset.unit;
      if (location.hash === '#/attendance') render(); else location.hash = '#/attendance';
      return;
    case 'asg-filter': {
      const filter = el.dataset.filter;
      PORTAL_STATE.asgFilter = filter;
      document.querySelectorAll('[data-asg-filters] .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
      document.querySelectorAll('[data-state]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.state !== filter; });
      return;
    }
    case 'assignment-open':
      openAssignment(el.dataset.id);
      return;
    case 'new-assignment':
      openNewAssignment();
      return;
    case 'marks-randomize':
      await randomizeCurrentUnit();
      return;
    case 'marks-randomize-all':
      await randomizeAllUnits();
      return;
    case 'marks-save':
      saveMarksFromTable();
      return;
    case 'marks-publish':
      await publishCurrentUnit();
      return;
    case 'session-close': {
      if (!user || (user.role !== 'lecturer' && user.role !== 'exam_officer')) return;
      const ok = await confirmDialog({ title: 'End session', message: 'Close this attendance session? Students will no longer be able to sign in.', confirmText: 'End session', danger: true });
      if (!ok) return;
      DB.closeSession(el.dataset.session);
      toast('Attendance session closed.', 'info');
      render();
      return;
    }
    case 'pay-fees':
      openPayModal();
      return;
    case 'hostel-book': {
      if (!user || user.role !== 'student') return;
      const hostel = HOSTELS.find(h => h.id === el.dataset.hostel);
      if (!hostel) return;
      const bookings = DB.hostelBookingsFor(user.id);
      if (bookings.some(b => b.termCode === DB.data.meta.termCode && b.status !== 'rejected')) {
        toast('You already have a hostel request for this term.', 'info');
        return;
      }
      const ok = await confirmDialog({ title: 'Request hostel accommodation', message: `Request a ${hostel.room} at ${money(hostel.perTerm)} per term? The accommodation office will review availability.`, confirmText: 'Send request' });
      if (!ok) return;
      const result = DB.bookHostel(user.id, hostel.id);
      if (result.error) { toast('A request already exists for this term.', 'info'); return; }
      toast('Hostel request submitted. Check back for approval.', 'success');
      render();
      return;
    }
    case 'set-theme':
      DB.saveSettings({ theme: el.dataset.theme });
      localStorage.setItem('tsmhst.theme', el.dataset.theme);
      applyPreferences(user);
      render();
      return;
    case 'set-font':
      DB.saveSettings({ font: el.dataset.font });
      localStorage.setItem('tsmhst.font', el.dataset.font);
      applyPreferences(user);
      render();
      return;
    case 'open-language':
      openLanguageModal();
      return;
    case 'pick-language': {
      const code = el.dataset.lang;
      DB.saveSettings({ lang: code });
      I18N.setLang(code);
      closeModal();
      render();
      toast(code === 'sw' ? 'Lugha imebadilishwa kuwa Kiswahili.' : 'Language changed to ' + I18N.languageName(code) + '.', 'success');
      return;
    }
    case 'open-rating':
      openRatingModal();
      return;
    case 'set-rating': {
      const value = Number(el.dataset.value);
      const hidden = document.getElementById('rating-value');
      if (hidden) hidden.value = value;
      document.querySelectorAll('#rating-stars .star').forEach((s, i) => s.classList.toggle('on', i < value));
      return;
    }
    case 'edit-profile':
      openProfileModal();
      return;
    case 'open-password':
      openPasswordModal();
      return;
    case 'mark-read':
      DB.markNoticesRead();
      lastUnread = 0;
      toast('All notifications marked as read.', 'info');
      render();
      return;
    case 'approval-approve': {
      if (!user || !canApproveAccounts(user)) return;
      const target = DB.user(el.dataset.user);
      if (!target) return;
      const result = DB.approveUser(target.id, user.id);
      if (result && result.error === 'forbidden') { toast('You are not the approving office for this account.', 'error'); return; }
      toast(target.name + ' approved. They can now sign in.', 'success');
      render();
      return;
    }
    case 'approval-reject': {
      if (!user || !canApproveAccounts(user)) return;
      const target = DB.user(el.dataset.user);
      if (!target) return;
      const ok = await confirmDialog({ title: 'Reject registration', message: `Reject ${target.name}? They will not be able to sign in.`, confirmText: 'Reject', danger: true });
      if (!ok) return;
      DB.rejectUser(target.id, user.id);
      toast('Registration rejected.', 'info');
      render();
      return;
    }
    case 'user-toggle': {
      if (!user || !canManageUser(user, DB.user(el.dataset.user))) return;
      const target = DB.user(el.dataset.user);
      if (!target) return;
      const status = el.dataset.status;
      const ok = await confirmDialog({ title: status === 'suspended' ? 'Suspend account' : 'Activate account', message: `${status === 'suspended' ? 'Suspend' : 'Activate'} ${target.name}?`, confirmText: status === 'suspended' ? 'Suspend' : 'Activate', danger: status === 'suspended' });
      if (!ok) return;
      DB.setUserStatus(target.id, status);
      toast('Account ' + status + '.', 'info');
      render();
      return;
    }
    case 'user-filter': {
      const filter = el.dataset.filter;
      document.querySelectorAll('[data-user-filters] .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
      document.querySelectorAll('[data-user-row]').forEach(row => {
        const search = (document.getElementById('users-search') || {}).value || '';
        const matchesRole = filter === 'all' || row.dataset.role === filter;
        const matchesText = row.dataset.searchText.includes(search.trim().toLowerCase());
        row.hidden = !(matchesRole && matchesText);
      });
      return;
    }
    case 'payment-verify': {
      if (!user || !canVerifyPayments(user)) return;
      const payment = DB.data.payments.find(p => p.id === el.dataset.payment);
      if (!payment) return;
      const student = DB.user(payment.studentId);
      if (student && !DB.inScope(user, student)) { toast('That student belongs to another campus.', 'error'); return; }
      const ok = await confirmDialog({ title: 'Verify payment', message: `Accept ${money(payment.amount)} from ${student ? student.name : 'student'} with reference ${payment.reference}?`, confirmText: 'Verify payment' });
      if (!ok) return;
      DB.verifyPayment(payment.id, user.id);
      toast('Payment verified and student notified.', 'success');
      render();
      return;
    }
    case 'payment-reject': {
      if (!user || !canVerifyPayments(user)) return;
      const payment = DB.data.payments.find(p => p.id === el.dataset.payment);
      if (!payment) return;
      const ok = await confirmDialog({ title: 'Reject payment', message: `Reject reference ${payment.reference}? The student will be asked to check the code.`, confirmText: 'Reject payment', danger: true });
      if (!ok) return;
      DB.rejectPayment(payment.id, user.id);
      toast('Payment rejected and student notified.', 'info');
      render();
      return;
    }
    case 'booking-status': {
      if (!user || !canVerifyPayments(user)) return;
      DB.setBookingStatus(el.dataset.booking, el.dataset.status, user.id);
      toast('Hostel request ' + el.dataset.status + '. Student notified.', 'success');
      render();
      return;
    }
    case 'marks-unit-open':
      PORTAL_STATE.marks.unitCode = el.dataset.unit;
      PORTAL_STATE.marks.order = null;
      location.hash = '#/marks';
      return;
    case 'new-announcement':
      openAnnouncementModal();
      return;
    case 'announcement-delete': {
      if (!user || !isAdminRole(user.role) || user.role === 'owner') return;
      const ok = await confirmDialog({ title: 'Delete announcement', message: 'This announcement will be removed from the portal for everyone.', confirmText: 'Delete', danger: true });
      if (!ok) return;
      DB.deleteNotice(el.dataset.notice);
      toast('Announcement deleted.', 'info');
      render();
      return;
    }
    case 'course-filter': {
      const dept = el.dataset.dept;
      document.querySelectorAll('[data-course-filters] .chip').forEach(c => c.classList.toggle('active', c.dataset.dept === dept));
      filterCourses();
      return;
    }
    case 'timetable-tab':
      PORTAL_STATE.timetable.tab = el.dataset.tab === 'exams' ? 'exams' : 'classes';
      render();
      return;
    case 'download-ics':
      if (!user) return;
      downloadExamICS(user);
      return;
    case 'fee-statement':
      if (!user || user.role !== 'student') return;
      buildStatementPDF(user);
      toast('Fee statement downloaded.', 'success');
      return;
    case 'payment-receipt': {
      if (!user) return;
      const payment = DB.data.payments.find(p => p.id === el.dataset.payment);
      if (!payment) return;
      const student = DB.user(payment.studentId);
      if (!student) return;
      if (user.role === 'student' && payment.studentId !== user.id) return;
      if (user.role !== 'student' && !isStaffRole(user.role)) return;
      buildReceiptPDF(student, payment);
      toast('Receipt downloaded.', 'success');
      return;
    }
    case 'document-upload':
      openDocumentModal();
      return;
    case 'document-open':
      openDocumentRecord(el.dataset.document);
      return;
    case 'document-download':
      downloadDocumentRecord(el.dataset.document);
      return;
    case 'document-delete': {
      if (!user || !isStaffRole(user.role)) return;
      const doc = DB.document(el.dataset.document);
      if (!doc) return;
      const ok = await confirmDialog({ title: 'Remove document', message: `Remove "${doc.title}" from the vault for everyone?`, confirmText: 'Remove', danger: true });
      if (!ok) return;
      DB.deleteDocument(doc.id);
      closeModal();
      toast('Document removed from the vault.', 'info');
      render();
      return;
    }
    case 'session-qr': {
      const session = DB.data.sessions.find(s => s.id === el.dataset.session);
      if (!session) return;
      openSessionQr(session);
      return;
    }
    case 'marks-export':
      exportMarksCSV(user);
      return;
    case 'marks-import':
      openMarksImportModal(user);
      return;
    case 'users-export':
      exportUsersCSV(user);
      return;
    case 'payments-export':
      exportPaymentsCSV(user);
      return;
    case 'print':
      window.print();
      return;
    default:
      return;
  }
}

/* ---------------- Auth ---------------- */

function showAuthAlert(type, message) {
  const box = document.getElementById('auth-alert');
  if (!box) return;
  box.hidden = false;
  box.className = 'form-alert ' + type;
  box.textContent = message;
}

function switchAuthTab(tab) {
  const signin = document.getElementById('signin-form');
  const register = document.getElementById('register-form');
  const executive = document.getElementById('executive-form');
  if (!signin || !register) return;
  document.querySelectorAll('.auth-tabs .segment').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  signin.hidden = tab !== 'signin';
  register.hidden = tab !== 'register';
  if (executive) executive.hidden = tab !== 'executive';
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const copy = {
    signin: ['Welcome back', 'Sign in to continue'],
    register: ['Create an account', 'Register as a student, lecturer or college admin. Accounts are approved by the responsible office.'],
    executive: ['Directorate registration', 'Director, deputy director and general admin oversee activities in all campuses.']
  };
  const pair = copy[tab] || copy.signin;
  if (title) title.textContent = I18N.t(pair[0]);
  if (sub) sub.textContent = I18N.t(pair[1]);
  const box = document.getElementById('auth-alert');
  if (box) box.hidden = true;
}

async function handleSignin(form) {
  const fd = new FormData(form);
  const identifier = String(fd.get('identifier') || '').trim();
  const password = String(fd.get('password') || '');
  if (!identifier || !password) { showAuthAlert('error', 'Enter your identifier and password.'); return; }
  const btn = form.querySelector('button[type="submit"]');
  const old = btn.innerHTML;
  btn.disabled = true; btn.textContent = 'Signing in…';
  const result = await DB.login(identifier, password);
  btn.disabled = false; btn.innerHTML = old;
  if (result.error) {
    const messages = {
      invalid: 'Invalid credentials. Check your email, admission/staff number and password.',
      pending: 'Your account is still awaiting administrator approval. Please try again later.',
      inactive: 'This account is not active. Contact the portal administrator.'
    };
    showAuthAlert('error', messages[result.error] || 'Could not sign you in.');
    return;
  }
  lastUnread = DB.unreadCount(result.user);
  PORTAL_STATE.marks = { unitCode: null, sort: 'admission', order: null };
  PORTAL_STATE.attendance = { unitCode: null, code: '' };
  PORTAL_STATE.timetable = { tab: 'classes', programme: 'all' };
  toast('Welcome, ' + result.user.name.split(' ')[0] + '.', 'success');
  if (location.hash === '#/home') render(); else location.hash = '#/home';
}

async function handleRegister(form) {
  const fd = new FormData(form);
  const isExecutive = form.id === 'executive-form';
  const password = String(fd.get('password') || '');
  const confirm = String(fd.get('confirmPassword') || '');
  const role = isExecutive ? 'executive' : String(fd.get('role') || 'student');
  if (password.length < 6) { showAuthAlert('error', 'Use a password with at least 6 characters.'); return; }
  if (password !== confirm) { showAuthAlert('error', 'The passwords do not match.'); return; }
  if (!fd.get('terms')) { showAuthAlert('error', 'You must agree to the Terms of Use to register.'); return; }
  const staff = !isExecutive && (role === 'student');
  const payload = {
    role,
    adminRole: isExecutive ? String(fd.get('adminRole') || '') : (role === 'admin' ? String(fd.get('adminRole') || '') : ''),
    name: String(fd.get('name') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    password,
    admissionNo: String(fd.get('admissionNo') || '').trim(),
    programme: String(fd.get('programme') || 'DCH6'),
    semester: String(fd.get('semester') || '1'),
    campus: staff ? String(fd.get('campus') || 'Nairobi') : String(fd.get('staffCampus') || 'Nairobi'),
    staffNo: String(fd.get('staffNo') || '').trim(),
    department: String(fd.get('department') || DEPARTMENTS[0])
  };
  const needsStaffNo = isExecutive || role === 'lecturer' || role === 'admin';
  if (!payload.name || !payload.email || (role === 'student' && !payload.admissionNo) || (needsStaffNo && !payload.staffNo)) {
    showAuthAlert('error', 'Please complete all required fields for your role.');
    return;
  }
  if ((role === 'admin' || isExecutive) && !payload.adminRole) {
    showAuthAlert('error', 'Select the administrative role you are registering for.');
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  const old = btn.innerHTML;
  btn.disabled = true; btn.textContent = 'Submitting…';
  const result = await DB.register(payload);
  btn.disabled = false; btn.innerHTML = old;
  if (result.error) {
    const messages = {
      email: 'An account already uses that email address.',
      admission: 'That admission number is already registered.',
      staff: 'That staff number is already registered.',
      role: 'Select a valid role for this registration.',
      missing: 'Please complete the required fields.'
    };
    showAuthAlert('error', messages[result.error] || 'Registration could not be completed.');
    return;
  }
  form.reset();
  if (!isExecutive) {
    document.querySelectorAll('.radio-card').forEach((c, i) => c.classList.toggle('active', i === 0));
    const studentFields = form.querySelector('.reg-student-fields');
    const lecturerFields = form.querySelector('.reg-lecturer-fields');
    const adminFields = form.querySelector('.reg-admin-fields');
    if (studentFields) studentFields.hidden = false;
    if (lecturerFields) lecturerFields.hidden = true;
    if (adminFields) adminFields.hidden = true;
  }
  switchAuthTab('signin');
  const idField = document.getElementById('signin-identifier');
  if (idField) idField.value = payload.email;
  const approver = DB.approverRoleFor(isExecutive || role === 'admin' ? payload.adminRole : role);
  const approverText = approver ? ROLE_LABELS[approver] : 'the responsible office';
  showAuthAlert('success', `Registration submitted. Your account is awaiting approval by ${approverText} — sign in once approved.`);
  toast('Registration submitted for approval.', 'success');
}

/* ---------------- Assignments ---------------- */

function openAssignment(id) {
  const user = DB.currentUser();
  const assignment = DB.data.assignments.find(a => a.id === id);
  if (!user || !assignment) return;
  const unit = DB.unit(assignment.unitCode);
  const info = dueInfo(assignment.dueAt);
  if (user.role === 'student') {
    if (!DB.isRegistered(user.id, assignment.unitCode)) { toast('You are not registered for this unit.', 'error'); return; }
    const sub = DB.submissionFor(assignment.id, user.id);
    const closed = new Date(assignment.dueAt).getTime() < Date.now();
    const graded = sub && sub.gradedAt;
    const body = `<div class="assignment-modal-head"><span class="unit-code">${esc(assignment.unitCode)}</span>${statusBadge(assignmentStatus(assignment, sub))}</div>
      <h3 class="modal-assignment-title">${esc(assignment.title)}</h3>
      <p class="muted-text">${esc(unit ? unit.title : '')} · ${esc(assignment.maxScore)} marks · ${esc(info.label)} · ${esc(fmtDate(assignment.dueAt, true))}</p>
      <div class="prose">${esc(assignment.instructions)}</div>
      ${sub ? `<div class="submission-box ${graded ? 'graded' : ''}">
        <div class="submission-head"><strong>${graded ? 'Graded submission' : 'Your submission'}</strong><span>${esc(relative(sub.createdAt))}</span></div>
        <p class="prose">${esc(sub.text)}</p>
        ${graded ? `<div class="graded-line"><strong>${sub.score}/${assignment.maxScore}</strong><span>${esc(sub.feedback || 'No feedback provided.')}</span></div>` : `<p class="muted-text">Awaiting grading.</p>`}
      </div>` : ''}
      ${graded ? '' : closed ? `<div class="alert-strip warn">${icon('clock')}<span>The deadline has passed. Submissions are closed.</span></div>` : `<form data-form="submit-assignment" data-id="${assignment.id}">
        <label class="field"><span>${esc(I18N.t('Your answer'))}</span><textarea name="text" rows="6" required placeholder="Type your answer or paste your submission text here…">${sub ? esc(sub.text) : ''}</textarea></label>
        <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('check')} ${esc(sub ? 'Resubmit' : I18N.t('Submit work'))}</button></div>
      </form>`}`;
    modal(assignment.title, body);
    return;
  }
  if (user.role === 'lecturer' && assignment.createdBy !== user.id && !DB.unitsForLecturer(user.id).some(u => u.code === assignment.unitCode)) {
    toast('You do not have access to this assignment.', 'error'); return;
  }
  const subs = DB.submissionsFor(assignment.id);
  const students = DB.studentsForUnit(assignment.unitCode);
  const body = `<div class="assignment-modal-head"><span class="unit-code">${esc(assignment.unitCode)}</span>${statusBadge(info.overdue ? 'closed' : 'open')}</div>
    <h3 class="modal-assignment-title">${esc(assignment.title)}</h3>
    <p class="muted-text">${esc(unit ? unit.title : '')} · ${esc(assignment.maxScore)} marks · due ${esc(fmtDate(assignment.dueAt, true))} · ${subs.length}/${students.length} submitted</p>
    <div class="prose">${esc(assignment.instructions)}</div>
    <h4 class="modal-section-title">${esc(I18N.t('Submissions'))}</h4>
    <div class="submission-list">${students.map(s => {
      const sub = DB.submissionFor(assignment.id, s.id);
      if (!sub) return `<div class="submission-row"><div class="submission-row-head"><span class="person-cell">${avatar(s, 'xs')} <strong>${esc(s.name)}</strong></span>${statusBadge('due')}</div><small class="cell-sub">${esc(s.admissionNo)} · Not submitted</small></div>`;
      const graded = sub.gradedAt;
      return `<div class="submission-row"><div class="submission-row-head"><span class="person-cell">${avatar(s, 'xs')} <strong>${esc(s.name)}</strong></span>${graded ? `<span class="grade-pill grade-${gradeFor(sub.score).grade}">${sub.score}/${assignment.maxScore}</span>` : statusBadge('submitted')}</div>
        <small class="cell-sub">${esc(s.admissionNo)} · ${esc(fmtDate(sub.createdAt, true))}</small>
        <p class="prose submission-text">${esc(sub.text)}</p>
        <form class="grade-form" data-form="grade-submission" data-id="${sub.id}" data-max="${assignment.maxScore}">
          <input type="number" name="score" min="0" max="${assignment.maxScore}" step="0.5" placeholder="Score /${assignment.maxScore}" value="${sub.score !== null ? sub.score : ''}" required>
          <input type="text" name="feedback" placeholder="Feedback (optional)" value="${esc(sub.feedback || '')}">
          <button type="submit" class="btn btn-primary btn-xs">${icon('check')} ${graded ? 'Update' : 'Grade'}</button>
        </form>
      </div>`;
    }).join('')}</div>`;
  modal(assignment.title, body, { size: 'lg' });
}

function openNewAssignment() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const units = staffUnits(user);
  if (!units.length) { toast('No units available for assignments.', 'error'); return; }
  const d = new Date(Date.now() + 7 * DAY);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  modal(I18N.t('New assignment'), `<form data-form="new-assignment" class="form-grid">
    <label class="field form-span"><span>Unit</span><select name="unitCode" required>${units.map(u => `<option value="${u.code}">${esc(u.code)} · ${esc(u.title)}</option>`).join('')}</select></label>
    <label class="field form-span"><span>Assignment title</span><input name="title" required placeholder="e.g. Community health assessment report"></label>
    <label class="field form-span"><span>Instructions</span><textarea name="instructions" rows="5" required placeholder="Explain what students should do, how to submit and what is assessed."></textarea></label>
    <label class="field"><span>${esc(I18N.t('Due date'))}</span><input name="dueAt" type="datetime-local" value="${local}" required></label>
    <label class="field"><span>${esc(I18N.t('Max score'))}</span><input name="maxScore" type="number" min="1" max="100" value="20" required></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('plus')} ${esc(I18N.t('Create assignment'))}</button></div>
  </form>`);
}

/* ---------------- Marks ---------------- */

function currentMarksUnit(user) {
  const units = staffUnits(user);
  const selected = units.find(u => u.code === PORTAL_STATE.marks.unitCode) || units[0];
  if (selected) PORTAL_STATE.marks.unitCode = selected.code;
  return selected || null;
}

function recalcMarkRow(input) {
  const row = input.closest('[data-student-row]');
  if (!row) return;
  const cat1 = Number(row.querySelector('[data-mark-field="cat1"]').value) || 0;
  const cat2 = Number(row.querySelector('[data-mark-field="cat2"]').value) || 0;
  const exam = Number(row.querySelector('[data-mark-field="exam"]').value) || 0;
  const filled = ['cat1', 'cat2', 'exam'].every(f => row.querySelector(`[data-mark-field="${f}"]`).value !== '');
  const total = Math.round((cat1 + cat2) / 2 + exam);
  const totalEl = row.querySelector('[data-row-total]');
  const gradeEl = row.querySelector('[data-row-grade]');
  if (totalEl) totalEl.textContent = filled ? total : '—';
  if (gradeEl) {
    const g = gradeFor(total);
    gradeEl.textContent = filled ? g.grade : '—';
    gradeEl.className = 'grade-pill grade-' + (filled ? g.grade : 'none');
  }
}

async function randomizeCurrentUnit() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  const ok = await confirmDialog({ title: 'Randomize marks', message: `Generate new randomized scores for every student registered in ${unit.code}? Existing marks for this unit will be overwritten.`, confirmText: 'Generate marks' });
  if (!ok) return;
  const count = DB.randomizeMarks(unit.code, DB.data.meta.termCode);
  if (!count) { toast('No students are registered for this unit.', 'error'); return; }
  toast('Randomized marks generated for ' + count + ' students.', 'success');
  render();
}

async function randomizeAllUnits() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  const scope = user.role === 'exam_officer' ? 'all units in ' + programmeFor(unit.programme).name : 'all of your units';
  const ok = await confirmDialog({ title: 'Randomize all units', message: `Generate new randomized marks for ${scope}? Existing marks in those units will be overwritten.`, confirmText: 'Generate marks' });
  if (!ok) return;
  let count = 0;
  if (user.role === 'exam_officer') count = DB.randomizeProgramme(unit.programme, DB.data.meta.termCode);
  else DB.unitsForLecturer(user.id).forEach(u => { count += DB.randomizeMarks(u.code, DB.data.meta.termCode); });
  toast('Randomized marks generated for ' + count + ' student records.', 'success');
  render();
}

function saveMarksFromTable() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  const rows = Array.from(document.querySelectorAll('[data-student-row]'));
  if (!rows.length) { toast('No students registered for this unit.', 'error'); return; }
  const entries = [];
  for (const row of rows) {
    const cat1El = row.querySelector('[data-mark-field="cat1"]');
    const cat2El = row.querySelector('[data-mark-field="cat2"]');
    const examEl = row.querySelector('[data-mark-field="exam"]');
    if (!cat1El.value || !cat2El.value || !examEl.value) {
      toast('Enter CAT 1, CAT 2 and exam for every student before saving.', 'error');
      return;
    }
    entries.push({ studentId: row.dataset.studentRow, cat1: cat1El.value, cat2: cat2El.value, exam: examEl.value });
  }
  DB.saveMarks(unit.code, entries, DB.data.meta.termCode);
  toast('Marks saved for ' + entries.length + ' students.', 'success');
  render();
}

async function publishCurrentUnit() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  const marks = DB.marksForUnit(unit.code, DB.data.meta.termCode);
  if (!marks.length) { toast('Enter marks before publishing.', 'error'); return; }
  const allPublished = marks.every(m => m.published);
  const ok = await confirmDialog({
    title: allPublished ? 'Unpublish results' : 'Publish results',
    message: allPublished ? `Hide results for ${unit.code} from students again?` : `Publish ${unit.code} results to all registered students? They will receive a notification.`,
    confirmText: allPublished ? 'Unpublish' : 'Publish results',
    danger: allPublished
  });
  if (!ok) return;
  DB.setPublished(unit.code, !allPublished, user.id);
  toast(allPublished ? 'Results unpublished.' : 'Results published to students.', 'success');
  render();
}

/* ---------------- Payments & profile modals ---------------- */

function openPayModal() {
  const user = DB.currentUser();
  if (!user || user.role !== 'student') return;
  const fees = DB.feeSummary(user.id);
  const paybills = DB.data.meta.paybills;
  const account = 'K-' + user.name;
  modal(I18N.t('Pay fees'), `<div class="paybill-inline">
    <div><span>${esc(I18N.t('Paybill'))}</span><strong>${esc(paybills.fees.paybill)}</strong><button type="button" class="icon-btn tiny" data-action="copy" data-copy="${esc(paybills.fees.paybill)}">${icon('copy')}</button></div>
    <div><span>${esc(I18N.t('Account number'))}</span><strong>${esc(account)}</strong><button type="button" class="icon-btn tiny" data-action="copy" data-copy="${esc(account)}">${icon('copy')}</button></div>
    <div><span>${esc(I18N.t('Outstanding'))}</span><strong>${money(fees.balance)}</strong></div>
  </div>
  <p class="muted-text">Pay via M-Pesa Lipa na M-Pesa → Pay Bill using the paybill and account above, then record the M-Pesa code below. Finance will verify it and update your balance.</p>
  <form data-form="pay-fees" class="form-grid">
    <label class="field"><span>${esc(I18N.t('Amount'))} (Ksh.)</span><input name="amount" type="number" min="1" step="1" value="${fees.balance || ''}" required></label>
    <label class="field"><span>${esc(I18N.t('M-Pesa code'))} / ${esc(I18N.t('Reference'))}</span><input name="reference" required minlength="4" placeholder="e.g. QK84LM92TX" autocomplete="off"></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('check')} ${esc(I18N.t('Record payment'))}</button></div>
  </form>`);
}

function openRatingModal() {
  const user = DB.currentUser();
  if (!user) return;
  const existing = DB.feedbackFor(user.id);
  modal(I18N.t('Rate this app'), `<form data-form="rate-app">
    <p class="modal-lead">Your feedback helps improve the TSMHST Portal for everyone.</p>
    <div class="rating-stars" id="rating-stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="star ${existing && i <= existing.stars ? 'on' : ''}" data-action="set-rating" data-value="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">${icon('star')}</button>`).join('')}</div>
    <input type="hidden" name="stars" id="rating-value" value="${existing ? existing.stars : 5}">
    <label class="field"><span>${esc(I18N.t('Message'))} (${esc(I18N.t('Optional'))})</span><textarea name="message" rows="3" placeholder="What should we improve?">${esc(existing ? existing.message : '')}</textarea></label>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('star')} ${esc(I18N.t('Send rating'))}</button></div>
  </form>`);
}

function openProfileModal() {
  const user = DB.currentUser();
  if (!user) return;
  const lockedName = user.role === 'student';
  modal('Edit profile', `<form data-form="edit-profile" class="form-grid">
    <label class="field form-span"><span>${esc(I18N.t('Full name'))}</span><input name="name" value="${esc(user.name)}" required ${lockedName ? 'disabled' : ''}></label>
    <label class="field"><span>${esc(I18N.t('Email'))}</span><input value="${esc(user.email)}" disabled></label>
    <label class="field"><span>${esc(I18N.t('Phone number'))}</span><input name="phone" value="${esc(user.phone || '')}" placeholder="+254 7xx xxx xxx"></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('check')} ${esc(I18N.t('Save'))}</button></div>
  </form><p class="demo-note">${icon('info')} ${lockedName ? 'Your name is locked to your admission record. Contact the Registrar to correct it. ' : ''}Contact the administrator if your admission number, programme or email needs changing.</p>`);
}

function openPasswordModal() {
  const user = DB.currentUser();
  if (!user) return;
  modal('Change password', `<form data-form="change-password" class="form-grid">
    <label class="field form-span"><span>Current password</span><input type="password" name="currentPassword" required autocomplete="current-password"></label>
    <label class="field"><span>New password</span><input type="password" name="newPassword" required minlength="6" autocomplete="new-password"></label>
    <label class="field"><span>Confirm new password</span><input type="password" name="confirmPassword" required minlength="6" autocomplete="new-password"></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('lock')} Save new password</button></div>
  </form><p class="demo-note">${icon('info')} Use at least 6 characters. You will sign in with the new password from now on.</p>`);
}

/* ---------------- Settings modals & permissions ---------------- */

function openTerms() {
  modal('Terms of use', `<div class="terms-doc">
    <p class="terms-intro">These User Agreement Terms govern the use of the TSMHST Portal. Effective date: ${esc(APP.build)}.</p>
    ${CONTENT.terms.map(t => `<section><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></section>`).join('')}
    <div class="terms-foot">${icon('shield')} TSMHST Portal · ${esc(APP.school)}</div>
  </div>`, { size: 'lg' });
}

function openLanguageModal() {
  const user = DB.currentUser();
  const current = user ? DB.settings(user).lang : 'en';
  modal(I18N.t('Choose language'), `<div class="language-tools">
    <label class="search-field">${icon('search')}<input id="language-search" type="search" placeholder="${esc(I18N.t('Search languages') + '…')}" aria-label="Search languages"></label>
    <div class="language-popular"><button type="button" class="chip ${current === 'en' ? 'active' : ''}" data-action="pick-language" data-lang="en">English</button><button type="button" class="chip ${current === 'sw' ? 'active' : ''}" data-action="pick-language" data-lang="sw">Kiswahili</button><button type="button" class="chip ${current === 'fr' ? 'active' : ''}" data-action="pick-language" data-lang="fr">Français</button><button type="button" class="chip ${current === 'es' ? 'active' : ''}" data-action="pick-language" data-lang="es">Español</button></div>
    <p class="language-note">${LANGUAGES.length} ISO 639-1 languages. English and Kiswahili are fully hand-translated; other languages fall back to English where a translation is not yet available.</p>
  </div>
  <div class="language-list">${LANGUAGES.map(l => {
    const cov = I18N.coverage(l.code);
    return `<button type="button" class="language-item ${l.code === current ? 'active' : ''}" data-action="pick-language" data-lang="${l.code}" data-lang-item data-search-text="${esc((l.name + ' ' + l.native + ' ' + l.code).toLowerCase())}">
      <span class="lang-code">${esc(l.code.toUpperCase())}</span>
      <span class="lang-copy"><strong>${esc(l.native)}</strong><small>${esc(l.name)}</small></span>
      <span class="lang-coverage ${cov}">${esc(cov === 'full' ? 'Full' : cov === 'partial' ? 'Partial' : 'English')}</span>
      ${l.code === current ? icon('check') : ''}
    </button>`;
  }).join('')}</div>`, { size: 'lg' });
}

function filterLanguages(query) {
  const q = query.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('[data-lang-item]').forEach(item => {
    const match = item.dataset.searchText.includes(q);
    item.hidden = !match;
    if (match) shown++;
  });
}

async function changeNotifications(enabled) {
  const user = DB.currentUser();
  if (!user) return;
  if (enabled && !('Notification' in window)) {
    DB.saveSettings({ notifications: false });
    toast('Notifications are not supported in this browser.', 'error');
    render();
    return;
  }
  if (enabled && Notification.permission !== 'granted') {
    let permission = 'default';
    try { permission = await Notification.requestPermission(); } catch (e) { permission = 'denied'; }
    if (permission !== 'granted') {
      DB.saveSettings({ notifications: false });
      toast('Notification permission was not granted. Enable it in browser settings.', 'error');
      render();
      return;
    }
    notifyDevice('TSMHST Portal', 'Notifications are now enabled for this device.');
  }
  DB.saveSettings({ notifications: enabled });
  toast(enabled ? 'Notifications enabled.' : 'Notifications turned off.', 'info');
  render();
}

async function changePermission(key, enabled) {
  const user = DB.currentUser();
  if (!user) return;
  const settings = DB.settings(user);
  if (!enabled) {
    settings.permissions[key] = false;
    settings.permissionStatus = Object.assign({}, settings.permissionStatus, { [key]: 'off' });
    DB.saveSettings({ permissions: settings.permissions, permissionStatus: settings.permissionStatus });
    toast(I18N.t('Permission') + ' off for ' + key + '.', 'info');
    render();
    return;
  }
  const succeed = () => {
    const s = DB.settings(user);
    s.permissions[key] = true;
    s.permissionStatus = Object.assign({}, s.permissionStatus, { [key]: 'granted' });
    DB.saveSettings({ permissions: s.permissions, permissionStatus: s.permissionStatus });
    toast(key.charAt(0).toUpperCase() + key.slice(1) + ' permission granted.', 'success');
    render();
  };
  const fail = (reason) => {
    const s = DB.settings(user);
    s.permissions[key] = false;
    s.permissionStatus = Object.assign({}, s.permissionStatus, { [key]: reason || 'denied' });
    DB.saveSettings({ permissions: s.permissions, permissionStatus: s.permissionStatus });
    toast(key.charAt(0).toUpperCase() + key.slice(1) + ' permission was not granted.', 'error');
    render();
  };
  try {
    if (key === 'location') {
      if (!navigator.geolocation) return fail('unsupported');
      navigator.geolocation.getCurrentPosition(() => succeed(), err => fail(err && err.code === 1 ? 'denied' : 'unsupported'), { timeout: 12000, maximumAge: 60000 });
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fail('unsupported');
    const constraints = key === 'camera' ? { video: true } : { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      stream.getTracks().forEach(t => t.stop());
      succeed();
    }).catch(() => fail('denied'));
  } catch (e) {
    fail('unsupported');
  }
}

/* ---------------- Announcements / academic / finance forms ---------------- */

function openAnnouncementModal() {
  const user = DB.currentUser();
  if (!user || (!isStaffRole(user.role) && user.role !== 'council')) return;
  const canTargetCampus = isAdminRole(user.role) || isExecRole(user.role);
  const lockedCampus = user.role === 'lecturer' ? user.campus : '';
  modal(I18N.t('Create announcement'), `<form data-form="new-announcement" class="form-grid">
    <label class="field form-span"><span>Title</span><input name="title" required maxlength="120" placeholder="e.g. Unit registration closes Friday"></label>
    <label class="field form-span"><span>Message</span><textarea name="message" rows="6" required maxlength="1200" placeholder="Write the announcement for the portal community."></textarea></label>
    <label class="field"><span>${esc(I18N.t('Audience'))}</span><select name="audience"><option value="all">Everyone</option><option value="students">Students</option><option value="staff">Staff</option><option value="admins">Administrators</option></select></label>
    <label class="field"><span>Campus</span><select name="campus" ${canTargetCampus ? '' : 'disabled'}><option value="">All campuses</option>${CAMPUSES.map(c => `<option value="${esc(c)}" ${(canTargetCampus ? user.campus : lockedCampus) === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>${canTargetCampus ? '' : `<input type="hidden" name="campus" value="${esc(lockedCampus)}">`}</label>
    <label class="checkline self-end"><input type="checkbox" name="pinned"> <span>${esc(I18N.t('Pinned'))}</span></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('megaphone')} ${esc(I18N.t('Create announcement'))}</button></div>
  </form>`);
}

/* ---------------- Form submission ---------------- */

async function handleSubmit(form) {
  const kind = form.dataset.form;
  const fd = new FormData(form);
  const user = DB.currentUser();
  if (kind === 'signin') return handleSignin(form);
  if (kind === 'register') return handleRegister(form);
  if (!user) return;

  if (kind === 'submit-assignment') {
    if (user.role !== 'student') return;
    const assignmentId = form.dataset.id;
    const assignment = DB.data.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    const result = DB.submitAssignment(assignmentId, user.id, String(fd.get('text') || ''));
    if (result.error === 'closed') toast('The deadline has passed. Submissions are closed.', 'error');
    else if (result.error === 'graded') toast('This assignment has already been graded.', 'error');
    else { toast('Assignment submitted successfully.', 'success'); closeModal(); render(); }
    return;
  }

  if (kind === 'grade-submission') {
    if (!user || user.role !== 'lecturer') return;
    const sub = DB.data.submissions.find(s => s.id === form.dataset.id);
    if (!sub) return;
    const assignment = DB.data.assignments.find(a => a.id === sub.assignmentId);
    if (!assignment) return;
    if (user.role === 'lecturer' && !DB.unitsForLecturer(user.id).some(u => u.code === assignment.unitCode)) { toast('Not allowed.', 'error'); return; }
    DB.gradeSubmission(sub.id, Number(fd.get('score')), String(fd.get('feedback') || ''), user.id);
    toast('Submission graded and student notified.', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'new-assignment') {
    if (!user || user.role !== 'lecturer') return;
    const unitCode = String(fd.get('unitCode') || '');
    if (!staffUnits(user).some(u => u.code === unitCode)) { toast('You cannot create an assignment for that unit.', 'error'); return; }
    const title = String(fd.get('title') || '').trim();
    const instructions = String(fd.get('instructions') || '').trim();
    const dueAt = String(fd.get('dueAt') || '');
    const maxScore = Number(fd.get('maxScore'));
    if (!title || !instructions || !dueAt || !maxScore) { toast('Complete all assignment fields.', 'error'); return; }
    DB.createAssignment({ unitCode, title, instructions, dueAt: new Date(dueAt).toISOString(), maxScore }, user.id);
    toast('Assignment created.', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'start-session') {
    if (user.role !== 'lecturer') return;
    const unitCode = form.dataset.unit;
    if (!DB.unitsForLecturer(user.id).some(u => u.code === unitCode)) { toast('Not allowed.', 'error'); return; }
    const minutes = Number(fd.get('minutes')) || 30;
    const session = DB.createSession(unitCode, user.id, minutes);
    toast('Session opened. Attendance code: ' + session.code, 'success');
    render();
    return;
  }

  if (kind === 'signin-code') {
    if (user.role !== 'student') return;
    const result = DB.signIn(String(fd.get('code') || ''), user.id);
    const errors = {
      code: 'That code is not valid or the session is closed.',
      expired: 'This session has expired.',
      unit: 'You are not registered for that unit.',
      already: 'You have already signed in for this session.'
    };
    if (result.error) { toast(errors[result.error] || 'Sign-in failed.', 'error'); return; }
    PORTAL_STATE.attendance.code = '';
    toast('Signed in for ' + result.session.unitCode + '. Attendance recorded.', 'success');
    render();
    return;
  }

  if (kind === 'pay-fees') {
    if (user.role !== 'student') return;
    const result = DB.recordPayment(user.id, Number(fd.get('amount')), String(fd.get('reference') || ''), 'M-Pesa');
    if (result.error) { toast('Enter a valid amount and M-Pesa reference.', 'error'); return; }
    toast('Payment recorded. Finance will verify the reference.', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'save-academic') {
    if (!user || user.role !== 'registrar') return;
    const termLabel = String(fd.get('termLabel') || '').trim();
    const termCode = String(fd.get('termCode') || '').trim();
    if (!termLabel || !termCode) { toast('Term label and code are required.', 'error'); return; }
    DB.updateMeta({
      academicYear: String(fd.get('academicYear') || '').trim(),
      termLabel, termCode,
      registrationDeadline: String(fd.get('registrationDeadline') || ''),
      registrationOpen: !!fd.get('registrationOpen')
    });
    toast('Academic settings saved.', 'success');
    render();
    return;
  }

  if (kind === 'save-paybills') {
    if (!user || user.role !== 'accounts_clerk') return;
    const feesPaybill = String(fd.get('feesPaybill') || '').trim();
    const hostelPaybill = String(fd.get('hostelPaybill') || '').trim();
    if (!/^\d{4,8}$/.test(feesPaybill) || !/^\d{4,8}$/.test(hostelPaybill)) {
      toast('Paybill and Buy Goods numbers must contain 4 to 8 digits.', 'error');
      return;
    }
    DB.savePaybills(
      { paybill: feesPaybill, name: String(fd.get('feesName') || ''), accountHint: String(fd.get('feesHint') || '') },
      { paybill: hostelPaybill, name: String(fd.get('hostelName') || ''), accountHint: String(fd.get('hostelHint') || '') }
    );
    toast('Payment channels updated.', 'success');
    render();
    return;
  }

  if (kind === 'new-announcement') {
    if (!user || (!isStaffRole(user.role) && user.role !== 'council')) return;
    const title = String(fd.get('title') || '').trim();
    const message = String(fd.get('message') || '').trim();
    if (!title || !message) { toast('Enter an announcement title and message.', 'error'); return; }
    DB.createAnnouncement({ title, message, audience: String(fd.get('audience') || 'all'), campus: String(fd.get('campus') || ''), pinned: !!fd.get('pinned') }, user.id);
    toast('Announcement published.', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'new-document') {
    if (!user || !isStaffRole(user.role)) return;
    const file = form.querySelector('input[type="file"]');
    const attachment = file && file.files[0];
    const payload = {
      title: String(fd.get('title') || '').trim(),
      category: String(fd.get('category') || 'Other'),
      summary: String(fd.get('summary') || '').trim(),
      body: String(fd.get('body') || '').trim(),
      audience: String(fd.get('audience') || 'all'),
      campus: String(fd.get('campus') || ALL_CAMPUSES)
    };
    if (!payload.title) { toast('Enter a title for the document.', 'error'); return; }
    if (attachment) {
      if (attachment.size > 800 * 1024) { toast('Attachments must be 800 KB or smaller.', 'error'); return; }
      payload.filename = attachment.name;
      payload.mime = attachment.type || 'application/octet-stream';
      payload.size = attachment.size;
      payload.dataUrl = await readFileAsDataURL(attachment);
    }
    if (!payload.body && !payload.dataUrl) { toast('Add body text or attach a file.', 'error'); return; }
    const result = DB.addDocument(payload, user.id);
    if (result.error) { toast('Enter a title for the document.', 'error'); return; }
    closeModal();
    render();
    toast('Document added to the vault.', 'success');
    return;
  }

  if (kind === 'import-marks') {
    await importMarksCSV(form);
    return;
  }

  if (kind === 'rate-app') {
    const stars = Number(fd.get('stars')) || 5;
    DB.rateApp(user.id, stars, String(fd.get('message') || ''));
    toast('Thanks for your rating!', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'edit-profile') {
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    if (user.role !== 'student') {
      if (!name) { toast('Name cannot be empty.', 'error'); return; }
      user.name = name;
    }
    user.phone = phone;
    DB.save();
    toast('Profile updated.', 'success');
    closeModal();
    render();
    return;
  }

  if (kind === 'change-password') {
    const current = String(fd.get('currentPassword') || '');
    const next = String(fd.get('newPassword') || '');
    const confirm = String(fd.get('confirmPassword') || '');
    if (next !== confirm) { toast('The new passwords do not match.', 'error'); return; }
    const result = await DB.changePassword(user.id, current, next);
    const errors = {
      current: 'Your current password is not correct.',
      weak: 'Use a new password with at least 6 characters.',
      same: 'Choose a password different from your current one.'
    };
    if (result.error) { toast(errors[result.error] || 'The password could not be changed.', 'error'); return; }
    toast('Password changed successfully.', 'success');
    closeModal();
    render();
    return;
  }
}

/* ---------------- Search/filter helpers ---------------- */

function filterRows(selector, value) {
  const q = String(value || '').trim().toLowerCase();
  document.querySelectorAll(selector).forEach(row => {
    row.hidden = q !== '' && !(row.dataset.searchText || '').includes(q);
  });
}

function filterUsers() {
  const search = (document.getElementById('users-search') || {}).value || '';
  const active = document.querySelector('[data-user-filters] .chip.active');
  const role = active ? active.dataset.filter : 'all';
  document.querySelectorAll('[data-user-row]').forEach(row => {
    const matchesRole = role === 'all' || row.dataset.role === role;
    const matchesText = row.dataset.searchText.includes(search.trim().toLowerCase());
    row.hidden = !(matchesRole && matchesText);
  });
}

function filterCourses() {
  const searchEl = document.getElementById('course-search');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const active = document.querySelector('[data-course-filters] .chip.active');
  const dept = active ? active.dataset.dept : 'all';
  let total = 0;
  document.querySelectorAll('[data-course-row]').forEach(row => {
    const okDept = dept === 'all' || row.dataset.courseDept === dept;
    const okText = !q || row.dataset.courseName.includes(q);
    row.hidden = !(okDept && okText);
    if (!row.hidden) total++;
  });
  document.querySelectorAll('[data-course-group]').forEach(group => {
    const visible = Array.from(group.querySelectorAll('[data-course-row]')).filter(r => !r.hidden).length;
    group.hidden = visible === 0;
    if (q) group.open = true;
  });
}

/* ---------------- Document vault ---------------- */

function dateStamp() { return new Date().toISOString().slice(0, 10); }

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function openDocumentModal() {
  const user = DB.currentUser();
  if (!user || !isStaffRole(user.role)) return;
  const campuses = user.campus === ALL_CAMPUSES ? [ALL_CAMPUSES].concat(CAMPUSES) : [user.campus];
  modal('Add document', `<form data-form="new-document" class="form-grid">
    <label class="field form-span"><span>Title</span><input name="title" required maxlength="90" placeholder="e.g. Examination regulations"></label>
    <label class="field"><span>Category</span><select name="category">${DB.documentCategories().map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
    <label class="field"><span>Audience</span><select name="audience"><option value="all">Everyone</option><option value="students">Students</option><option value="staff">Staff</option></select></label>
    <label class="field form-span"><span>Campus</span><select name="campus">${campuses.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>
    <label class="field form-span"><span>Summary</span><input name="summary" maxlength="130" placeholder="One line shown on the document card"></label>
    <label class="field form-span"><span>Body text (optional when you attach a file)</span><textarea name="body" rows="5" placeholder="Paste the policy or notice text. Blank lines become paragraphs."></textarea></label>
    <label class="field form-span"><span>Attach a file (optional, max 800 KB)</span><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.doc,.docx"></label>
    <div class="modal-actions form-span"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('file')} Add to vault</button></div>
  </form><p class="demo-note">${icon('info')} Documents are saved on this device so students can read them offline. Large attachments fill the offline cache quickly.</p>`);
}

function openDocumentRecord(id) {
  const doc = DB.document(id);
  if (!doc) return;
  const body = doc.dataUrl
    ? (doc.mime && doc.mime.indexOf('image/') === 0
      ? `<img class="doc-preview" src="${doc.dataUrl}" alt="${esc(doc.title)}">`
      : `<p class="muted-text">This file is stored in the vault. Use Download to open it on your device.</p>`)
    : `<div class="doc-body">${String(doc.body || '').split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  modal(doc.title, `<p class="modal-lead">${esc(doc.category)} · ${esc(fmtDate(doc.createdAt))} · ${esc(documentSizeLabel(doc))}</p>
    ${doc.summary ? `<p>${esc(doc.summary)}</p>` : ''}
    ${body}
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Close'))}</button><button type="button" class="btn btn-primary" data-action="document-download" data-document="${doc.id}">${icon('download')} ${doc.dataUrl ? 'Download file' : 'Download PDF'}</button></div>`, { size: 'lg' });
}

function downloadDocumentRecord(id) {
  const doc = DB.document(id);
  if (!doc) return;
  if (doc.dataUrl) {
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.filename || doc.title;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  downloadVaultDocument(doc);
}

/* ---------------- CSV export & import ---------------- */

function exportUsersCSV(user) {
  if (!user || !canApproveAccounts(user)) return;
  const scope = user.role === 'campus_admin' ? user.campus : (isExecRole(user.role) ? ALL_CAMPUSES : user.campus);
  const users = DB.usersForCampus(scope).slice().sort((a, b) => a.name.localeCompare(b.name));
  downloadCSV('TSMHST-users-' + dateStamp() + '.csv',
    ['Name', 'Role', 'Email', 'Phone', 'Admission no.', 'Staff no.', 'Programme', 'Semester', 'Campus', 'Status', 'Created'],
    users.map(u => [
      u.name, roleLabel(u.role), u.email, u.phone || '', u.admissionNo || '', u.staffNo || '',
      u.programme ? programmeFor(u.programme).code : '', u.semester || '', u.campus || '', u.status, fmtDate(u.createdAt)
    ]));
  toast(users.length + ' accounts exported to CSV.', 'success');
}

function exportPaymentsCSV(user) {
  if (!user || !(canVerifyPayments(user) || isExecRole(user.role) || user.role === 'accounts_clerk')) return;
  const scope = (user.role === 'campus_admin' || user.role === 'principal') ? user.campus : ALL_CAMPUSES;
  const payments = DB.paymentsForCampus(scope).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  downloadCSV('TSMHST-payments-' + dateStamp() + '.csv',
    ['Date', 'Student', 'Admission no.', 'Campus', 'Amount (Ksh.)', 'Method', 'Reference', 'Status', 'Verified on'],
    payments.map(p => {
      const s = DB.user(p.studentId) || {};
      return [fmtDate(p.createdAt, true), s.name || '', s.admissionNo || '', s.campus || '', p.amount, p.method, p.reference, p.status, p.verifiedAt ? fmtDate(p.verifiedAt, true) : ''];
    }));
  toast(payments.length + ' payments exported to CSV.', 'success');
}

function exportMarksCSV(user) {
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  const marks = DB.marksForUnit(unit.code, DB.data.meta.termCode);
  const map = {};
  marks.forEach(m => { map[m.studentId] = m; });
  const students = DB.studentsForUnit(unit.code, DB.data.meta.termCode).slice().sort((a, b) => String(a.admissionNo).localeCompare(String(b.admissionNo)));
  downloadCSV('TSMHST-marks-' + unit.code + '-' + dateBaseTerm() + '.csv',
    ['Admission no.', 'Name', 'CAT 1 (/30)', 'CAT 2 (/30)', 'Exam (/70)', 'Total', 'Grade', 'Published'],
    students.map(s => {
      const m = map[s.id] || {};
      return [s.admissionNo || '', s.name, m.cat1 !== undefined ? m.cat1 : '', m.cat2 !== undefined ? m.cat2 : '', m.exam !== undefined ? m.exam : '', m.total !== undefined ? m.total : '', m.grade || '', m.published ? 'Yes' : 'No'];
    }));
  toast('Marks exported for ' + unit.code + '.', 'success');
}

function dateBaseTerm() { return DB.data.meta.termCode || dateStamp(); }

function openMarksImportModal() {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unit = currentMarksUnit(user);
  if (!unit) return;
  modal('Import marks — ' + unit.code, `<form data-form="import-marks" data-unit="${unit.code}">
    <p class="modal-lead">Upload a CSV with the columns <strong>Admission no.</strong>, <strong>CAT 1</strong>, <strong>CAT 2</strong> and <strong>Exam</strong>. Export the current sheet first to get the correct format.</p>
    <label class="field"><span>CSV file</span><input type="file" name="file" accept=".csv,text/csv" required></label>
    <label class="checkline"><input type="checkbox" name="overwrite" checked> <span>Overwrite existing marks for matching students</span></label>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${esc(I18N.t('Cancel'))}</button><button type="submit" class="btn btn-primary">${icon('file')} Import marks</button></div>
  </form>`);
}

async function importMarksCSV(form) {
  const user = DB.currentUser();
  if (!user || !canManageMarks(user)) return;
  const unitCode = form.dataset.unit;
  const unit = DB.unit(unitCode);
  if (!unit) return;
  const fileInput = form.querySelector('input[type="file"]');
  const file = fileInput && fileInput.files[0];
  if (!file) { toast('Choose a CSV file first.', 'error'); return; }
  if (file.size > 400 * 1024) { toast('That CSV is too large. Keep imports under 400 KB.', 'error'); return; }
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) { toast('The CSV does not contain any data rows.', 'error'); return; }
  const header = rows[0].map(h => String(h).trim().toLowerCase());
  const find = names => header.findIndex(h => names.some(n => h.indexOf(n) !== -1));
  const iAdm = find(['admission']);
  const iCat1 = find(['cat 1', 'cat1']);
  const iCat2 = find(['cat 2', 'cat2']);
  const iExam = find(['exam']);
  if (iAdm === -1 || iCat1 === -1 || iCat2 === -1 || iExam === -1) {
    toast('The CSV needs Admission no., CAT 1, CAT 2 and Exam columns.', 'error');
    return;
  }
  const students = DB.studentsForUnit(unitCode, DB.data.meta.termCode);
  const overwriteInput = form.querySelector('input[name="overwrite"]');
  const overwrite = !overwriteInput || overwriteInput.checked;
  const existing = overwrite ? null : new Set(DB.marksForUnit(unitCode, DB.data.meta.termCode).map(m => m.studentId));
  const entries = [];
  const skipped = [];
  let kept = 0;
  rows.slice(1).forEach(row => {
    const admission = String(row[iAdm] || '').trim().toUpperCase();
    const student = students.find(s => String(s.admissionNo || '').toUpperCase() === admission);
    if (!student) { if (admission) skipped.push(admission); return; }
    if (existing && existing.has(student.id)) { kept++; return; }
    const cat1 = Number(row[iCat1]);
    const cat2 = Number(row[iCat2]);
    const exam = Number(row[iExam]);
    if (!Number.isFinite(cat1) || !Number.isFinite(cat2) || !Number.isFinite(exam)) { skipped.push(admission); return; }
    entries.push({ studentId: student.id, cat1, cat2, exam });
  });
  if (!entries.length) { toast(kept ? 'All matching students already have marks. Tick overwrite to replace them.' : 'No rows matched students registered for ' + unitCode + '.', 'error'); return; }
  DB.saveMarks(unitCode, entries, DB.data.meta.termCode);
  DB.recordAudit('marks.import', 'Imported ' + entries.length + ' mark record' + (entries.length === 1 ? '' : 's') + ' into ' + unitCode + ' from ' + file.name + '.');
  closeModal();
  render();
  const notes = [];
  if (skipped.length) notes.push(skipped.length + ' row(s) skipped');
  if (kept) notes.push(kept + ' existing record(s) kept');
  toast(entries.length + ' record' + (entries.length === 1 ? '' : 's') + ' imported' + (notes.length ? ' — ' + notes.join(', ') : '') + '.', skipped.length ? 'info' : 'success');
}

/* ---------------- QR attendance ---------------- */

function openSessionQr(session) {
  const unit = DB.unit(session.unitCode);
  const link = attendanceDeepLink(session.code);
  modal('Class sign-in QR', `<div class="qr-sheet">
    <p class="qr-sheet-code">${esc(session.code)}</p>
    <div class="qr-sheet-image">${qrSvg(link, 7)}</div>
    <p class="qr-sheet-title">${esc(session.unitCode)} · ${esc(unit ? unit.title : 'Class session')}</p>
    <p class="muted-text">Students scan this code with their phone camera, or open the portal and enter <strong>${esc(session.code)}</strong>. The session closes at ${esc(new Date(session.closesAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}.</p>
    <div class="inline-actions center"><button type="button" class="btn btn-ghost btn-sm" data-action="copy" data-copy="${esc(session.code)}">${icon('copy')} Copy code</button><button type="button" class="btn btn-ghost btn-sm" data-action="copy" data-copy="${esc(link)}">${icon('copy')} Copy link</button><button type="button" class="btn btn-ghost btn-sm" data-action="print">${icon('print')} Print</button></div>
  </div>`, { size: 'md' });
}

/* ---------------- Calendar export ---------------- */

function icsEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsLocalStamp(date, time) {
  return String(date).replace(/-/g, '') + 'T' + String(time || '00:00').replace(':', '') + '00';
}

function downloadExamICS(user) {
  const { exams } = timetableData(user);
  if (!exams.length) { toast('No exam papers to export yet.', 'info'); return; }
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TSMHST//Portal//EN', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'X-WR-CALNAME:TSMHST exam calendar', 'X-WR-TIMEZONE:Africa/Nairobi'
  ];
  exams.forEach(e => {
    const unit = DB.unit(e.unitCode) || {};
    const programme = programmeFor(e.programme);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.unitCode}-${e.date.replace(/-/g, '')}-${e.start.replace(':', '')}@tsmhst.ac.ke`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocalStamp(e.date, e.start)}`,
      `DTEND:${icsLocalStamp(e.date, e.end)}`,
      `SUMMARY:${icsEscape(e.unitCode + ' — ' + (unit.title || 'Examination'))}`,
      `LOCATION:${icsEscape(e.venue + ', TSMHST')}`,
      `DESCRIPTION:${icsEscape((programme ? programme.name : e.programme) + ' · ' + e.type + ' · ' + DB.data.meta.termLabel + ' · Arrive 15 minutes early with your student ID.')}`,
      'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(e.unitCode + ' examination tomorrow at ' + e.start)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tsmhst-exams-${DB.data.meta.termCode}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast(`${exams.length} exam paper${exams.length === 1 ? '' : 's'} exported to your calendar.`, 'success');
}

/* ---------------- PWA ---------------- */

function setupInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    toast('TSMHST Portal installed on this device.', 'success');
  });
  if (window.matchMedia) {
    const media = window.matchMedia('(display-mode: standalone)');
    if (media.addEventListener) media.addEventListener('change', () => render());
  }
}

async function installApp() {
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (installed) { toast('The app is already installed on this device.', 'info'); return; }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (e) { /* ignore */ }
    deferredInstallPrompt = null;
    return;
  }
  modal(I18N.t('Install app'), `<div class="install-help">
    <p class="modal-lead">Add TSMHST Portal to your Android home screen — it opens like a normal app and keeps working when the connection is poor.</p>
    <div class="install-step"><span>1</span><div><strong>Open the portal in Chrome</strong><p>The portal must be served over HTTPS (for example ${esc(APP.domain)}/portal).</p></div></div>
    <div class="install-step"><span>2</span><div><strong>Tap the Chrome menu (⋮)</strong><p>Choose “Install app” or “Add to Home screen”.</p></div></div>
    <div class="install-step"><span>3</span><div><strong>Confirm installation</strong><p>An app icon appears on your home screen. Open it to use the portal full-screen.</p></div></div>
    <div class="install-step"><span>4</span><div><strong>On iPhone or iPad</strong><p>Open in Safari, tap Share, then “Add to Home Screen”.</p></div></div>
    <p class="demo-note">${icon('info')} If the install option is missing, make sure the portal is loaded from an HTTPS address and that you are using a supported browser.</p>
    <div class="modal-actions"><button type="button" class="btn btn-primary" data-close>${esc(I18N.t('Close'))}</button></div>
  </div>`, { size: 'lg' });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A new version of the portal is ready. Reopen the app to update.', 'info');
        }
      });
    });
  }).catch(err => console.warn('Service worker registration failed', err));
}

function notifyDevice(title, body) {
  const user = DB.currentUser();
  if (!user) return;
  if (!DB.settings(user).notifications) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png' });
  } catch (e) { /* ignore */ }
}
