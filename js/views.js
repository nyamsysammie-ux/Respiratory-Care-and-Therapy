/* TSMHST Portal — application shell, authentication and student/staff views */
const PORTAL_STATE = {
  marks: { unitCode: null, sort: 'admission', order: null },
  attendance: { unitCode: null },
  asgFilter: 'all'
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function navGroups(role) {
  const groups = [];
  if (role === 'student') {
    groups.push({
      label: 'Main', items: [
        { route: 'home', label: 'Home', icon: 'home' },
        { route: 'units', label: 'Units', icon: 'book' },
        { route: 'assignments', label: 'Assignments', icon: 'clipboard' },
        { route: 'results', label: 'Results', icon: 'chart' },
        { route: 'attendance', label: 'Attendance', icon: 'check' }
      ]
    });
    groups.push({
      label: 'Academic', items: [
        { route: 'transcript', label: 'Transcript', icon: 'file' },
        { route: 'fees', label: 'Fees', icon: 'wallet' },
        { route: 'hostel', label: 'Hostel', icon: 'bed' }
      ]
    });
    groups.push({
      label: 'Portal', items: [
        { route: 'team', label: 'Team', icon: 'users' },
        { route: 'about', label: 'About', icon: 'info' },
        { route: 'settings', label: 'Settings', icon: 'settings' }
      ]
    });
  }
  if (role === 'lecturer') {
    groups.push({
      label: 'Teaching', items: [
        { route: 'home', label: 'Home', icon: 'home' },
        { route: 'units', label: 'My units', icon: 'book' },
        { route: 'attendance', label: 'Attendance', icon: 'check' },
        { route: 'marks', label: 'Marks', icon: 'marks' },
        { route: 'assignments', label: 'Assignments', icon: 'clipboard' }
      ]
    });
    groups.push({
      label: 'Portal', items: [
        { route: 'team', label: 'Team', icon: 'users' },
        { route: 'about', label: 'About', icon: 'info' },
        { route: 'settings', label: 'Settings', icon: 'settings' }
      ]
    });
  }
  if (role === 'admin') {
    groups.push({
      label: 'Management', items: [
        { route: 'home', label: 'Home', icon: 'home' },
        { route: 'approvals', label: 'Approvals', icon: 'approvals' },
        { route: 'users', label: 'Users', icon: 'users' },
        { route: 'academics', label: 'Academics', icon: 'academics' },
        { route: 'marks', label: 'Marks studio', icon: 'marks' },
        { route: 'attendance', label: 'Attendance', icon: 'check' }
      ]
    });
    groups.push({
      label: 'Finance & communication', items: [
        { route: 'finance', label: 'Finance', icon: 'finance' },
        { route: 'announcements', label: 'Announcements', icon: 'megaphone' }
      ]
    });
    groups.push({
      label: 'Portal', items: [
        { route: 'team', label: 'Team', icon: 'users' },
        { route: 'about', label: 'About', icon: 'info' },
        { route: 'settings', label: 'Settings', icon: 'settings' }
      ]
    });
  }
  if (role === 'council') {
    groups.push({
      label: 'Student Council', items: [
        { route: 'home', label: 'Home', icon: 'home' },
        { route: 'announcements', label: 'Announcements', icon: 'megaphone' },
        { route: 'team', label: 'Team & presence', icon: 'users' }
      ]
    });
    groups.push({
      label: 'Portal', items: [
        { route: 'about', label: 'About', icon: 'info' },
        { route: 'settings', label: 'Settings', icon: 'settings' }
      ]
    });
  }
  return groups;
}

function routeTitle(route) {
  const titles = {
    home: 'Home', units: 'Units', assignments: 'Assignments', results: 'Results', transcript: 'Transcript',
    fees: 'Fees', hostel: 'Hostel', attendance: 'Attendance', team: 'Team & presence', about: 'About',
    settings: 'Settings', notifications: 'Notifications', approvals: 'Approvals', users: 'Users',
    academics: 'Academics', marks: 'Marks studio', finance: 'Finance', announcements: 'Announcements'
  };
  return titles[route] || 'Portal';
}

function bottomNav(role) {
  const sets = {
    student: [
      { route: 'home', label: 'Home', icon: 'home' },
      { route: 'units', label: 'Units', icon: 'book' },
      { route: 'attendance', label: 'Attendance', icon: 'check' },
      { route: 'results', label: 'Results', icon: 'chart' }
    ],
    lecturer: [
      { route: 'home', label: 'Home', icon: 'home' },
      { route: 'units', label: 'My units', icon: 'book' },
      { route: 'attendance', label: 'Attendance', icon: 'check' },
      { route: 'marks', label: 'Marks', icon: 'marks' }
    ],
    admin: [
      { route: 'home', label: 'Home', icon: 'home' },
      { route: 'approvals', label: 'Approvals', icon: 'approvals' },
      { route: 'academics', label: 'Academics', icon: 'academics' },
      { route: 'finance', label: 'Finance', icon: 'finance' }
    ],
    council: [
      { route: 'home', label: 'Home', icon: 'home' },
      { route: 'announcements', label: 'Announcements', icon: 'megaphone' },
      { route: 'team', label: 'Team', icon: 'users' },
      { route: 'about', label: 'About', icon: 'info' }
    ]
  };
  return sets[role] || sets.student;
}

function sidebarHTML(user, route) {
  const groups = navGroups(user.role);
  return `<aside class="sidebar" id="sidebar">
    <a class="side-brand" href="#/home">
      ${logo('side-logo')}
      <span><strong>TSMHST</strong><small>Tricent Portal</small></span>
    </a>
    <div class="side-term"><span>${esc(I18N.t('Current term'))}</span><strong>${esc(DB.data.meta.termLabel)}</strong></div>
    <nav class="side-nav">
      ${groups.map(g => `<div class="nav-group"><span class="nav-group-label">${esc(g.label)}</span>
        ${g.items.map(item => `<a class="side-link ${route === item.route ? 'active' : ''}" href="#/${item.route}">${icon(item.icon)}<span>${esc(I18N.t(item.label))}</span></a>`).join('')}
      </div>`).join('')}
    </nav>
    <div class="side-user">
      ${avatar(user)}
      <div class="side-user-copy"><strong>${esc(user.name)}</strong><span>${esc(roleLabel(user.role))}</span></div>
      <button type="button" class="icon-btn" data-action="logout" title="${esc(I18N.t('Sign out'))}">${icon('logout')}</button>
    </div>
  </aside>
  <div class="drawer-backdrop" data-action="toggle-sidebar"></div>`;
}

function moreSheetHTML(user, route) {
  const items = navGroups(user.role).flatMap(g => g.items);
  if (!items.some(i => i.route === 'notifications')) items.push({ route: 'notifications', label: 'Notifications', icon: 'bell' });
  return `<div class="sheet-backdrop" data-action="close-more"></div>
  <div class="more-sheet" id="more-sheet" aria-hidden="true">
    <div class="sheet-grip"></div>
    <div class="sheet-head">
      <div><span class="eyebrow">${esc(roleLabel(user.role))}</span><h2>${esc(I18N.t('More'))}</h2></div>
      <button type="button" class="icon-btn" data-action="close-more" aria-label="${esc(I18N.t('Close'))}">${icon('x')}</button>
    </div>
    <div class="more-grid">
      ${items.map(item => `<a class="more-tile ${route === item.route ? 'active' : ''}" href="#/${item.route}">${icon(item.icon)}<span>${esc(I18N.t(item.label))}</span></a>`).join('')}
    </div>
    <div class="more-actions">
      <button type="button" class="btn btn-ghost" data-action="install-app">${icon('download')} ${esc(I18N.t('Install app'))}</button>
      <a class="btn btn-ghost" href="#/notifications">${icon('bell')} ${esc(I18N.t('Notifications'))}</a>
      <button type="button" class="btn btn-danger-ghost" data-action="logout">${icon('logout')} ${esc(I18N.t('Sign out'))}</button>
    </div>
  </div>`;
}

function portalShell(user, route, content) {
  const unread = DB.unreadCount(user);
  const offline = !navigator.onLine;
  const title = I18N.t(routeTitle(route));
  const bottom = bottomNav(user.role);
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="app-shell">
    ${sidebarHTML(user, route)}
    <div class="app-main">
      <header class="topbar">
        <button type="button" class="icon-btn mobile-only" data-action="toggle-sidebar" aria-label="Open menu">${icon('menu')}</button>
        <div class="topbar-title"><h2>${esc(title)}</h2><span>${esc(now)}</span></div>
        <div class="topbar-actions">
          ${offline ? `<span class="offline-pill">${icon('wifiOff')} Offline</span>` : ''}
          <button type="button" class="icon-btn" data-action="install-app" title="${esc(I18N.t('Install app'))}">${icon('download')}</button>
          <a class="icon-btn bell-btn" href="#/notifications" aria-label="${esc(I18N.t('Notifications'))}">${icon('bell')}${unread ? `<span class="bell-count">${unread > 9 ? '9+' : unread}</span>` : ''}</a>
          <a class="top-avatar" href="#/settings" aria-label="${esc(I18N.t('Settings'))}">${avatar(user)}</a>
        </div>
      </header>
      <main class="page" id="page-content">${content}</main>
    </div>
    <nav class="bottom-nav" aria-label="Primary navigation">
      ${bottom.map(item => `<a class="bottom-link ${route === item.route ? 'active' : ''}" href="#/${item.route}">${icon(item.icon)}<span>${esc(I18N.t(item.label))}</span></a>`).join('')}
      <button type="button" class="bottom-link ${bottom.every(i => i.route !== route) ? 'active' : ''}" data-action="open-more">${icon('menu')}<span>${esc(I18N.t('More'))}</span></button>
    </nav>
    ${moreSheetHTML(user, route)}
  </div>`;
}

/* ---------------- Authentication ---------------- */

function authPage() {
  return `<div class="auth-shell">
    <section class="auth-hero">
      <div class="auth-brand">${logo('auth-logo')}<div><strong>Tricent School of<br>Medical Health Science &amp; Technology</strong><span>TSMHST · ${esc(APP.domain)}</span></div></div>
      <div class="auth-hero-copy">
        <span class="eyebrow light">Student & staff portal</span>
        <h1>Your campus,<br><em>in your pocket.</em></h1>
        <p>${esc(CONTENT.purpose)}</p>
        <div class="auth-features">
          <span>${icon('book')} Units & results</span>
          <span>${icon('wallet')} Fees & hostel</span>
          <span>${icon('check')} Class sign-in</span>
          <span>${icon('bell')} Live notices</span>
        </div>
      </div>
      <div class="auth-hero-foot">
        <div><strong>Need help?</strong><br><a href="mailto:${APP.supportEmail}">${APP.supportEmail}</a></div>
        <div><strong>WhatsApp</strong><br><a href="https://wa.me/254118000614" target="_blank" rel="noopener">${APP.supportPhoneDisplay}</a></div>
        <div><strong>College</strong><br><a href="mailto:${APP.officeEmail}">${APP.officeEmail}</a> · <a href="tel:${APP.officePhoneTel}">${APP.officePhoneDisplay}</a> · <a href="${APP.websiteUrl}" target="_blank" rel="noopener">${APP.domain}</a></div>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-card-head">
          <span class="eyebrow">TSMHST Portal</span>
          <h2 id="auth-title">${esc(I18N.t('Welcome back'))}</h2>
          <p id="auth-sub">${esc(I18N.t('Sign in to continue'))}</p>
        </div>
        <div class="segmented auth-tabs" role="tablist">
          <button type="button" class="segment active" data-action="auth-tab" data-tab="signin" role="tab" aria-selected="true">${esc(I18N.t('Sign in'))}</button>
          <button type="button" class="segment" data-action="auth-tab" data-tab="register" role="tab" aria-selected="false">${esc(I18N.t('Register'))}</button>
        </div>
        <div id="auth-alert" class="form-alert" hidden></div>

        <form data-form="signin" id="signin-form" class="auth-form">
          <label class="field"><span>${esc(I18N.t('Email') || 'Email')} / ${esc(I18N.t('Admission number'))} / ${esc(I18N.t('Staff number'))}</span>
            <input name="identifier" id="signin-identifier" autocomplete="username" placeholder="e.g. TSMHST/CH/2026/001" required>
          </label>
          <label class="field"><span>${esc(I18N.t('Password'))}</span>
            <span class="password-wrap"><input name="password" id="signin-password" type="password" autocomplete="current-password" placeholder="••••••••" required>
              <button type="button" class="ghost-icon" data-action="toggle-password" data-target="signin-password" aria-label="Show password">${icon('eye')}</button>
            </span>
          </label>
          <div class="auth-row"><label class="checkline"><input type="checkbox" checked> <span>Keep me signed in</span></label><button type="button" class="link-btn" data-action="show-terms">${esc(I18N.t('Terms of use'))}</button></div>
          <button type="submit" class="btn btn-primary btn-block">${esc(I18N.t('Sign in'))} ${icon('arrow')}</button>
        </form>

        <form data-form="register" id="register-form" class="auth-form" hidden>
          <div class="radio-cards" data-reg-role-group>
            <label class="radio-card active"><input type="radio" name="role" value="student" checked><span>${icon('graduation')}<strong>${esc(I18N.t('Student'))}</strong><small>Register for units, results & fees</small></span></label>
            <label class="radio-card"><input type="radio" name="role" value="lecturer"><span>${icon('user')}<strong>${esc(I18N.t('Lecturer'))}</strong><small>Teach, mark & take attendance</small></span></label>
          </div>
          <div class="form-grid two">
            <label class="field"><span>${esc(I18N.t('Full name'))}</span><input name="name" required placeholder="e.g. Jane Wanjiku"></label>
            <label class="field"><span>${esc(I18N.t('Email'))}</span><input name="email" type="email" required placeholder="you@example.com"></label>
            <label class="field"><span>${esc(I18N.t('Phone number'))}</span><input name="phone" type="tel" placeholder="+254 7xx xxx xxx"></label>
            <label class="field"><span>${esc(I18N.t('Password'))}</span><input name="password" type="password" minlength="6" required placeholder="At least 6 characters"></label>
          </div>
          <div class="reg-student-fields">
            <div class="form-grid two">
              <label class="field"><span>${esc(I18N.t('Admission number'))}</span><input name="admissionNo" placeholder="TSMHST/CH/2026/013"></label>
              <label class="field"><span>${esc(I18N.t('Programme'))}</span><select name="programme">${DEPARTMENTS.map(d => {
                const list = PORTAL_PROGRAMMES.filter(p => p.dept === d);
                return list.length ? `<optgroup label="${esc(d)}">${list.map(p => `<option value="${p.code}">${esc(p.name)}</option>`).join('')}</optgroup>` : '';
              }).join('')}</select></label>
              <label class="field"><span>${esc(I18N.t('Year of study'))}</span><select name="year"><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option></select></label>
              <label class="field"><span>${esc(I18N.t('Campus'))}</span><select name="campus">${CAMPUSES.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
            </div>
          </div>
          <div class="reg-lecturer-fields" hidden>
            <div class="form-grid two">
              <label class="field"><span>${esc(I18N.t('Staff number'))}</span><input name="staffNo" placeholder="TSM/LEC/004"></label>
              <label class="field"><span>${esc(I18N.t('Department'))}</span><select name="department">${DEPARTMENTS.map(d => `<option>${esc(d)}</option>`).join('')}</select></label>
            </div>
          </div>
          <label class="field"><span>${esc(I18N.t('Confirm password'))}</span><input name="confirmPassword" type="password" minlength="6" required></label>
          <label class="checkline terms-line"><input type="checkbox" name="terms" required> <span>I agree to the ${''}<button type="button" class="link-btn inline" data-action="show-terms">${esc(I18N.t('Terms of use'))}</button></span></label>
          <button type="submit" class="btn btn-primary btn-block">${esc(I18N.t('Create account'))} ${icon('arrow')}</button>
          <p class="form-note">${esc(I18N.t('Awaiting approval'))}: student and lecturer accounts are reviewed by the administrator before first sign-in.</p>
        </form>

        <div class="demo-box">
          <div class="demo-head"><strong>${esc(I18N.t('Demo accounts'))}</strong><span>Tap to fill</span></div>
          <div class="demo-grid">${DEMO_ACCOUNTS.map((d, i) => `<button type="button" class="demo-chip" data-action="demo-fill" data-demo="${i}"><span>${esc(d.label)}</span><code>${esc(d.identifier)}</code></button>`).join('')}</div>
        </div>
        <div class="auth-footer">
          <button type="button" class="link-btn" data-action="public-about">${icon('info')} About Tricent &amp; the portal</button>
          <span>v${APP.version}</span>
        </div>
      </div>
      <p class="auth-legal">© ${new Date().getFullYear()} ${esc(APP.school)}. All rights reserved. · <button type="button" class="link-btn" data-action="show-terms">Terms of use</button></p>
    </section>
  </div>`;
}

/* ---------------- Page dispatch ---------------- */

function renderPage(user, route) {
  if (route === 'home') return renderHome(user);
  if (route === 'units') return renderUnits(user);
  if (route === 'assignments') return renderAssignments(user);
  if (route === 'results') return renderResults(user);
  if (route === 'transcript') return renderTranscript(user);
  if (route === 'attendance') return renderAttendance(user);
  if (route === 'fees') return renderFees(user);
  if (route === 'hostel') return renderHostel(user);
  if (route === 'team') return renderTeam(user);
  if (route === 'notifications') return renderNotifications(user);
  if (route === 'about') return renderAbout(user);
  if (route === 'settings') return renderSettings(user);
  if (route === 'marks') return renderMarks(user);
  if (route === 'academics') return renderAcademics(user);
  if (route === 'approvals') return renderApprovals(user);
  if (route === 'users') return renderUsers(user);
  if (route === 'finance') return renderFinance(user);
  if (route === 'announcements') return renderAnnouncements(user);
  return renderHome(user);
}

function renderPortal(user, route) {
  return portalShell(user, route, renderPage(user, route));
}

/* ---------------- Home ---------------- */

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function announcementList(user, limit) {
  const items = DB.noticesFor(user).filter(n => n.type === 'announcement').slice(0, limit || 3);
  if (!items.length) return emptyState('megaphone', 'No announcements', 'New notices from the administration and student council will appear here.');
  return `<div class="notice-list">${items.map(n => `<a class="notice-item" href="#/notifications">
    <span class="notice-icon">${icon('megaphone')}</span>
    <span class="notice-copy"><strong>${esc(n.title)}</strong><small>${esc(fmtDate(n.createdAt))} · ${esc(n.audience === 'all' ? 'Everyone' : n.audience === 'students' ? 'Students' : 'Staff')}</small></span>
    ${n.pinned ? `<span class="pin-badge">${icon('pin')}</span>` : ''}
  </a>`).join('')}</div>`;
}

function leadershipCard(user) {
  const leaders = DB.team().filter(m => m.role === 'admin' || m.role === 'council');
  const online = leaders.filter(m => m.presence.online).length;
  return `<div class="card">
    <div class="card-head"><div><h2>${esc(I18N.t('Portal team'))}</h2><p class="card-sub">${esc(I18N.t('Presence shows who is signed in right now.'))}</p></div><a class="card-link" href="#/team">${esc(I18N.t('View all'))} ${icon('chevron')}</a></div>
    <div class="presence-strip">${leaders.map(m => `<div class="presence-person" title="${esc(m.name)} — ${m.presence.online ? 'Online' : 'Offline'}">${avatar(m)}<span class="presence-dot ${m.presence.online ? 'on' : ''}"></span><span class="presence-name">${esc(m.name.split(' ')[0])}</span></div>`).join('')}</div>
    <div class="presence-note"><span class="live-dot"></span>${online} ${esc(I18N.t('Online now'))} · ${leaders.length - online} ${esc(I18N.t('Offline'))}</div>
  </div>`;
}

function todayClasses(user, units) {
  const today = DAYS_SHORT[new Date().getDay()];
  const ordered = units.slice().sort((a, b) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(a.day) - ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(b.day));
  return `<div class="card">
    <div class="card-head"><div><h2>${esc(I18N.t("Today's classes"))}</h2><p class="card-sub">${today === 'Sun' || today === 'Sat' ? 'Weekend — no scheduled classes' : 'Your weekly timetable'}</p></div><span class="chip chip-soft">${esc(DB.data.meta.termLabel)}</span></div>
    ${ordered.length ? `<div class="class-list">${ordered.map(u => {
      const isToday = u.day === today;
      return `<div class="class-row ${isToday ? 'today' : ''}">
        <span class="class-day">${esc(u.day)}<small>${isToday ? 'Today' : ''}</small></span>
        <span class="class-main"><strong>${esc(u.code)} · ${esc(u.title)}</strong><small>${esc(u.time)} · ${esc(u.room)} · ${esc(u.day === today ? 'On campus' : 'Scheduled')}</small></span>
        <span class="chip chip-soft">${esc(u.time.split(' - ')[0])}</span>
      </div>`;
    }).join('')}</div>` : emptyState('book', 'No units registered', 'Register your units to see your class timetable.', `<a class="btn btn-primary btn-sm" href="#/units">${esc(I18N.t('Register units'))}</a>`)}
  </div>`;
}

function renderHome(user) {
  if (user.role === 'admin') return renderAdminHome(user);
  if (user.role === 'council') return renderCouncilHome(user);
  if (user.role === 'lecturer') return renderLecturerHome(user);

  const regs = DB.registrationsFor(user.id, DB.data.meta.termCode);
  const units = regs.map(r => DB.unit(r.unitCode)).filter(Boolean);
  const attendance = DB.overallAttendance(user.id);
  const fees = DB.feeSummary(user.id);
  const marks = DB.marksForStudent(user.id, true);
  const gpa = DB.gpa(marks);
  const assignments = DB.assignmentsForStudent(user.id);
  const due = assignments.filter(a => { const sub = DB.submissionFor(a.id, user.id); return !sub && new Date(a.dueAt).getTime() > Date.now(); });
  const firstName = user.name.split(' ')[0];
  const term = DB.data.meta.termLabel;
  const deadline = DB.data.meta.registrationDeadline ? fmtDate(DB.data.meta.registrationDeadline) : '';

  const dueList = assignments
    .filter(a => !DB.submissionFor(a.id, user.id))
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 3);

  return `${pageHead(`${greeting()}, ${firstName}`, `${esc(user.admissionNo)} · ${esc(programmeFor(user.programme).name)}`,
    `<a class="btn btn-primary btn-sm" href="#/attendance">${icon('check')} ${esc(I18N.t('Sign attendance'))}</a>`)}
  <div class="hero-card student-hero">
    <div class="hero-copy">
      <span class="eyebrow light">${esc(I18N.t('Current term'))}</span>
      <h2>${esc(term)}</h2>
      <p>${DB.data.meta.registrationOpen ? 'Unit registration is open' : 'Unit registration is closed'}${deadline ? ` · closes ${esc(deadline)}` : ''}</p>
      <div class="hero-actions">
        <a class="btn btn-light btn-sm" href="#/units">${icon('book')} ${esc(I18N.t('Current units'))} <strong>${units.length}</strong></a>
        <a class="btn btn-outline-light btn-sm" href="#/results">${icon('chart')} ${esc(I18N.t('View results'))}</a>
      </div>
    </div>
    <div class="hero-metric"><span>${esc(I18N.t('Your attendance'))}</span><strong>${attendance.percent}%</strong>${progress(attendance.percent)}<small>${attendance.attended} of ${attendance.held} sessions</small></div>
  </div>
  ${fees.balance > 0 ? `<div class="alert-strip warn">${icon('alert')}<span>Fee balance: <strong>${money(fees.balance)}</strong>${fees.pending ? ` · ${money(fees.pending)} pending verification` : ''}</span><a href="#/fees">${esc(I18N.t('Pay now'))}</a></div>` : ''}
  <div class="stats-grid">
    ${statCard(I18N.t('Your attendance'), attendance.percent + '%', `${attendance.attended}/${attendance.held} sessions`, 'check', 'green')}
    ${statCard(I18N.t('Fee balance'), money(fees.balance), fees.pending ? money(fees.pending) + ' pending' : 'No pending payments', 'wallet', fees.balance > 0 ? 'amber' : '')}
    ${statCard(I18N.t('GPA'), gpa === null ? '—' : gpa.toFixed(2), marks.length + ' published results', 'chart', 'maroon')}
    ${statCard(I18N.t('Due assignments'), String(due.length), due.length ? 'Needs your attention' : 'All caught up', 'clipboard', due.length ? 'amber' : '')}
  </div>
  <div class="quick-actions">
    <a class="quick-action" href="#/units">${icon('book')}<span>${esc(I18N.t('Register units'))}</span></a>
    <a class="quick-action" href="#/attendance">${icon('check')}<span>${esc(I18N.t('Sign attendance'))}</span></a>
    <a class="quick-action" href="#/fees">${icon('wallet')}<span>${esc(I18N.t('Pay fees'))}</span></a>
    <a class="quick-action" href="#/transcript">${icon('file')}<span>${esc(I18N.t('Transcript'))}</span></a>
  </div>
  <div class="dash-grid">
    ${todayClasses(user, units)}
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">From administration & student council</p></div><a class="card-link" href="#/notifications">${esc(I18N.t('View all'))}</a></div>
      ${announcementList(user, 2)}
    </div>
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Due assignments'))}</h2><p class="card-sub">Work that still needs your attention</p></div><a class="card-link" href="#/assignments">${esc(I18N.t('View all'))}</a></div>
      ${dueList.length ? `<div class="task-list">${dueList.map(a => {
        const info = dueInfo(a.dueAt);
        return `<a class="task-row" href="#/assignments"><span class="task-icon">${icon('clipboard')}</span><span class="task-copy"><strong>${esc(a.title)}</strong><small>${esc(a.unitCode)} · ${esc(info.label)}</small></span>${statusBadge(info.overdue ? 'overdue' : 'due')}</a>`;
      }).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} You have no outstanding assignments.</div>`}
    </div>
    ${leadershipCard(user)}
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Recent results'))}</h2><p class="card-sub">Latest published marks</p></div><a class="card-link" href="#/results">${esc(I18N.t('View all'))}</a></div>
      ${marks.length ? `<div class="mini-results">${marks.slice(0, 4).map(m => { const u = DB.unit(m.unitCode); return `<div class="mini-result"><span><strong>${esc(m.unitCode)}</strong><small>${esc(u ? u.title : '')}</small></span><span class="grade-pill grade-${m.grade}">${m.grade}</span><strong>${m.total}%</strong></div>`; }).join('')}</div>` : emptyState('chart', 'No published results', 'Results will appear here when your lecturers publish them.')}
    </div>
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Student portal'))}</h2><p class="card-sub">Quick help</p></div>${icon('help')}</div>
      <p class="muted-text">Use Settings to change theme, font size and language, manage notifications and permissions, rate the app or contact support.</p>
      <div class="inline-actions"><a class="btn btn-ghost btn-sm" href="#/settings">${icon('settings')} ${esc(I18N.t('Settings'))}</a><button type="button" class="btn btn-ghost btn-sm" data-action="public-about">${icon('info')} ${esc(I18N.t('About'))}</button></div>
    </div>
  </div>`;
}

function renderLecturerHome(user) {
  const myUnits = DB.unitsForLecturer(user.id);
  const studentSet = new Set();
  myUnits.forEach(u => DB.studentsForUnit(u.code).forEach(s => studentSet.add(s.id)));
  const assignments = DB.assignmentsForStaff(user);
  let pending = 0;
  assignments.forEach(a => { pending += DB.submissionsFor(a.id).filter(s => s.score === null).length; });
  const openSessions = DB.data.sessions.filter(s => s.status === 'open' && myUnits.some(u => u.code === s.unitCode));
  const recentSubs = [];
  assignments.forEach(a => DB.submissionsFor(a.id).filter(s => s.score === null).slice(0, 1).forEach(s => recentSubs.push({ a, s })));
  return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${esc(user.title)}`, `<button type="button" class="btn btn-primary btn-sm" data-action="new-assignment">${icon('plus')} ${esc(I18N.t('New assignment'))}</button>`)}
  <div class="hero-card staff-hero">
    <div class="hero-copy">
      <span class="eyebrow light">Teaching desk</span>
      <h2>${esc(DB.data.meta.termLabel)}</h2>
      <p>${myUnits.length} units · ${studentSet.size} students · ${openSessions.length} open attendance session${openSessions.length === 1 ? '' : 's'}</p>
      <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/attendance">${icon('check')} ${esc(I18N.t('Open session'))}</a><a class="btn btn-outline-light btn-sm" href="#/marks">${icon('marks')} ${esc(I18N.t('Marks studio'))}</a></div>
    </div>
    <div class="hero-metric"><span>To be graded</span><strong>${pending}</strong><small>submissions awaiting feedback</small></div>
  </div>
  <div class="stats-grid">
    ${statCard(I18N.t('My units'), String(myUnits.length), DB.data.meta.termLabel, 'book', 'green')}
    ${statCard('Students', String(studentSet.size), 'across your classes', 'users', '')}
    ${statCard('Submissions to grade', String(pending), pending ? 'Open Assignments to grade' : 'All graded', 'clipboard', pending ? 'amber' : '')}
    ${statCard(I18N.t('Open sessions'), String(openSessions.length), openSessions.length ? 'Sign-in is live' : 'No active sessions', 'check', 'maroon')}
  </div>
  <div class="dash-grid">
    ${todayClasses(user, myUnits)}
    <div class="card">
      <div class="card-head"><div><h2>Teaching shortcuts</h2><p class="card-sub">Common tasks</p></div></div>
      <div class="stack-actions">
        <button type="button" class="list-action" data-action="new-assignment">${icon('plus')}<span><strong>Create assignment</strong><small>Set work for one of your units</small></span>${icon('chevron')}</button>
        <a class="list-action" href="#/attendance">${icon('check')}<span><strong>Take attendance</strong><small>Open a code-based sign-in session</small></span>${icon('chevron')}</a>
        <a class="list-action" href="#/marks">${icon('marks')}<span><strong>Enter or randomise marks</strong><small>Work per unit and admission number</small></span>${icon('chevron')}</a>
        <a class="list-action" href="#/assignments">${icon('clipboard')}<span><strong>Grade submissions</strong><small>View student work and give feedback</small></span>${icon('chevron')}</a>
      </div>
    </div>
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>Submissions to grade</h2><p class="card-sub">Latest student work</p></div><a class="card-link" href="#/assignments">${esc(I18N.t('View all'))}</a></div>
      ${recentSubs.length ? `<div class="task-list">${recentSubs.slice(0, 5).map(({ a, s }) => { const st = DB.user(s.studentId); return `<button type="button" class="task-row task-button" data-action="assignment-open" data-id="${a.id}"><span class="avatar avatar-student sm">${esc(initials(st ? st.name : '?'))}</span><span class="task-copy"><strong>${esc(st ? st.name : 'Student')}</strong><small>${esc(a.title)} · ${esc(a.unitCode)}</small></span><span class="chip chip-soft">${icon('chevron')}</span></button>`; }).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No submissions are waiting for a grade.</div>`}
    </div>
    ${leadershipCard(user)}
  </div>`;
}

function renderAdminHome(user) {
  const pending = DB.pendingUsers();
  const students = DB.data.users.filter(u => u.role === 'student' && u.status === 'active');
  const finance = DB.financeSummary();
  const pay = DB.data.payments;
  return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, 'Portal administration overview',
    `<a class="btn btn-primary btn-sm" href="#/approvals">${icon('approvals')} ${esc(I18N.t('Pending registrations'))}${pending.length ? ` <span class="btn-count">${pending.length}</span>` : ''}</a>`)}
  <div class="hero-card admin-hero">
    <div class="hero-copy">
      <span class="eyebrow light">Administration</span>
      <h2>${esc(DB.data.meta.termLabel)}</h2>
      <p>${DB.data.meta.registrationOpen ? 'Unit registration is open' : 'Unit registration is closed'} · ${students.length} active students · ${DB.data.units.filter(u => u.current).length} units</p>
      <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/academics">${icon('academics')} Manage academics</a><a class="btn btn-outline-light btn-sm" href="#/finance">${icon('finance')} Finance desk</a></div>
    </div>
    <div class="hero-metric"><span>Payments to verify</span><strong class="smaller">${finance.pendingCount}</strong><small>${money(finance.pending)} awaiting verification</small></div>
  </div>
  <div class="stats-grid">
    ${statCard(I18N.t('Pending registrations'), String(pending.length), pending.length ? 'Awaiting your review' : 'Nothing pending', 'approvals', pending.length ? 'amber' : '')}
    ${statCard(I18N.t('Active students'), String(students.length), 'Approved portal accounts', 'graduation', 'green')}
    ${statCard(I18N.t('Payments to verify'), String(finance.pendingCount), money(finance.pending) + ' pending', 'finance', finance.pendingCount ? 'amber' : '')}
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Pending registrations'))}</h2><p class="card-sub">New students and lecturers</p></div><a class="card-link" href="#/approvals">${esc(I18N.t('View all'))}</a></div>
      ${pending.length ? `<div class="task-list">${pending.slice(0, 4).map(u => `<div class="task-row"><span class="avatar avatar-${u.role} sm">${esc(initials(u.name))}</span><span class="task-copy"><strong>${esc(u.name)}</strong><small>${esc(roleLabel(u.role))} · ${esc(u.email)}</small></span><button type="button" class="btn btn-primary btn-xs" data-action="approval-approve" data-user="${u.id}">${esc(I18N.t('Approve'))}</button></div>`).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No registrations are waiting for approval.</div>`}
    </div>
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Payment'))}</h2><p class="card-sub">Latest pending M-Pesa payments</p></div><a class="card-link" href="#/finance">${esc(I18N.t('View all'))}</a></div>
      ${finance.pendingCount ? `<div class="task-list">${DB.recentPendingPayments().slice(0, 4).map(p => { const s = DB.user(p.studentId); return `<div class="task-row"><span class="task-icon">${icon('wallet')}</span><span class="task-copy"><strong>${money(p.amount)} · ${esc(p.reference)}</strong><small>${esc(s ? s.name : 'Student')} · ${esc(fmtDate(p.createdAt))}</small></span><button type="button" class="btn btn-primary btn-xs" data-action="payment-verify" data-payment="${p.id}">${esc(I18N.t('Verify'))}</button></div>`; }).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No payments are awaiting verification.</div>`}
    </div>
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Registration window'))}</h2><p class="card-sub">Current academic settings</p></div><a class="card-link" href="#/academics">Manage</a></div>
      <div class="status-panel ${DB.data.meta.registrationOpen ? 'ok' : 'closed'}">
        <span class="status-dot"></span>
        <div><strong>${DB.data.meta.registrationOpen ? 'Registration is open' : 'Registration is closed'}</strong><small>${esc(DB.data.meta.termLabel)} · deadline ${esc(fmtDate(DB.data.meta.registrationDeadline))}</small></div>
        ${statusBadge(DB.data.meta.registrationOpen ? 'open' : 'closed')}
      </div>
      <div class="mini-results"><div class="mini-result"><span><strong>${DB.data.units.filter(u => u.current).length}</strong><small>Current units</small></span><span><strong>${PORTAL_PROGRAMMES.length}</strong><small>Programmes</small></span><span><strong>${DB.data.registrations.filter(r => r.termCode === DB.data.meta.termCode).length}</strong><small>Registrations</small></span></div></div>
      <div class="inline-actions"><a class="btn btn-ghost btn-sm" href="#/users">${icon('users')} User directory</a><a class="btn btn-ghost btn-sm" href="#/announcements">${icon('megaphone')} Post announcement</a></div>
    </div>
    ${leadershipCard(user)}
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
    <div class="card">
      <div class="card-head"><div><h2>Finance snapshot</h2><p class="card-sub">Paybill & payments</p></div></div>
      <div class="paybill-mini"><span>Fees paybill</span><strong>${esc(DB.data.meta.paybills.fees.paybill)}</strong></div>
      <div class="paybill-mini"><span>Hostel Buy Goods (Till)</span><strong>${esc(DB.data.meta.paybills.hostel.paybill)}</strong></div>
      <div class="inline-actions" style="margin-top:12px"><a class="btn btn-ghost btn-sm" href="#/finance">${icon('finance')} Open finance</a><a class="btn btn-ghost btn-sm" href="#/attendance">${icon('check')} Sessions</a></div>
    </div>
  </div>`;
}

function renderCouncilHome(user) {
  const students = DB.data.users.filter(u => u.role === 'student' && u.status === 'active');
  const leaders = DB.team();
  const online = leaders.filter(m => m.presence.online).length;
  const mine = DB.data.notices.filter(n => n.createdBy === user.id && n.type === 'announcement');
  return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${esc(user.title)}`,
    `<button type="button" class="btn btn-primary btn-sm" data-action="new-announcement">${icon('megaphone')} ${esc(I18N.t('Create announcement'))}</button>`)}
  <div class="hero-card council-hero">
    <div class="hero-copy">
      <span class="eyebrow light">Student Council desk</span>
      <h2>Represent. Communicate. Support.</h2>
      <p>You can publish announcements for students and see live presence of administrators and fellow council members.</p>
      <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/announcements">${icon('megaphone')} Council announcements</a><a class="btn btn-outline-light btn-sm" href="#/team">${icon('users')} Team & presence</a></div>
    </div>
    <div class="hero-metric"><span>Students</span><strong>${students.length}</strong><small>active on the portal</small></div>
  </div>
  <div class="stats-grid">
    ${statCard('Active students', String(students.length), 'All campuses', 'graduation', 'green')}
    ${statCard('Council notices', String(mine.length), 'Posted by you', 'megaphone', 'maroon')}
    ${statCard('Online now', String(online), 'Staff & council', 'users', '')}
    ${statCard(I18N.t('Current term'), DB.data.meta.termLabel.split(' – ')[0], DB.data.meta.academicYear, 'calendar', 'amber')}
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Latest from administration & council</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>
      ${announcementList(user, 4)}
    </div>
    ${leadershipCard(user)}
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>Council desk</h2><p class="card-sub">What you can do</p></div></div>
      <div class="stack-actions">
        <button type="button" class="list-action" data-action="new-announcement">${icon('megaphone')}<span><strong>Publish an announcement</strong><small>Reach all students or everyone</small></span>${icon('chevron')}</button>
        <a class="list-action" href="#/team">${icon('users')}<span><strong>Team presence</strong><small>See who is online right now</small></span>${icon('chevron')}</a>
        <a class="list-action" href="#/about">${icon('info')}<span><strong>Portal content</strong><small>Mission, objectives and programmes</small></span>${icon('chevron')}</a>
      </div>
    </div>
    <div class="card"><div class="card-head"><div><h2>Student support</h2><p class="card-sub">Share these contacts</p></div></div>
      <p class="muted-text">Students can reach portal support directly from Settings → Get help.</p>
      <div class="contact-lines"><a href="mailto:${APP.supportEmail}">${icon('mail')} ${APP.supportEmail}</a><a href="https://wa.me/254118000614" target="_blank" rel="noopener">${icon('chat')} WhatsApp ${APP.supportPhoneDisplay}</a></div>
    </div>
  </div>`;
}

/* ---------------- Units ---------------- */

function renderUnits(user) {
  if (user.role === 'lecturer') return renderLecturerUnits(user);
  if (user.role !== 'student') return renderHome(user);
  const regs = DB.registrationsFor(user.id, DB.data.meta.termCode);
  const registered = new Set(regs.map(r => r.unitCode));
  const units = DB.unitsForProgramme(user.programme);
  const attendance = DB.attendanceSummary(user.id);
  const totalCredits = units.filter(u => registered.has(u.code)).reduce((a, b) => a + b.credits, 0);
  const deadline = DB.data.meta.registrationDeadline;
  const isOpen = DB.data.meta.registrationOpen;
  return `${pageHead(I18N.t('Unit registration'), `${esc(DB.data.meta.termLabel)} · ${esc(programmeFor(user.programme).name)}`,
    `<a class="btn btn-ghost btn-sm" href="#/results">${icon('chart')} ${esc(I18N.t('View results'))}</a>`)}
  <div class="status-banner ${isOpen ? 'open' : 'closed'}">
    <div class="status-banner-icon">${icon(isOpen ? 'checkCircle' : 'lock')}</div>
    <div><strong>${isOpen ? 'Registration is open' : I18N.t('Registration is closed')}</strong><span>${isOpen ? `Register units for the current term before ${esc(fmtDate(deadline))}.` : 'The registration window is closed. Contact the academic office for changes.'}</span></div>
    <span class="badge ${isOpen ? 'badge-success' : 'badge-neutral'}">${isOpen ? 'Open' : 'Closed'}</span>
  </div>
  <div class="stats-grid three">
    ${statCard('Registered units', String(registered.size), `of ${units.length} offered`, 'book', 'green')}
    ${statCard('Total credits', String(totalCredits), 'credit hours this term', 'academics', 'maroon')}
    ${statCard('Registration deadline', deadline ? fmtDate(deadline) : '—', isOpen ? 'Register before this date' : 'Window closed', 'calendar', isOpen ? 'amber' : '')}
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Available units</h2><p class="card-sub">Select the units you are taking this term. Core units are required for your programme.</p></div><span class="chip chip-soft">${units.length} units</span></div>
    ${units.length ? `<div class="unit-grid">${units.map(u => {
      const on = registered.has(u.code);
      const att = attendance.find(a => a.unitCode === u.code);
      const lecturer = DB.user(u.lecturer);
      return `<article class="unit-card ${on ? 'registered' : ''}">
        <div class="unit-top"><span class="unit-code">${esc(u.code)}</span><span class="badge ${u.type === 'Core' ? 'badge-info' : 'badge-neutral'}">${esc(u.type)}</span></div>
        <h3>${esc(u.title)}</h3>
        <div class="unit-meta">
          <span>${icon('user')} ${esc(lecturer ? lecturer.name : 'Lecturer')}</span>
          <span>${icon('clock')} ${esc(u.day)} ${esc(u.time)}</span>
          <span>${icon('pin')} ${esc(u.room)}</span>
          <span>${icon('academics')} ${u.credits} credits</span>
        </div>
        ${on && att ? `<div class="unit-attendance"><span>Attendance ${att.percent}%</span>${progress(att.percent)}</div>` : ''}
        <div class="unit-foot">
          ${on ? `<span class="registered-label">${icon('checkCircle')} ${esc(I18N.t('Registered'))}</span><button type="button" class="btn btn-danger-ghost btn-sm" data-action="unit-drop" data-unit="${u.code}" ${!isOpen ? 'disabled' : ''}>${esc(I18N.t('Drop'))}</button>`
            : `<button type="button" class="btn btn-primary btn-sm" data-action="unit-register" data-unit="${u.code}" ${!isOpen ? 'disabled' : ''}>${icon('plus')} ${esc(I18N.t('Register'))}</button>`}
        </div>
      </article>`;
    }).join('')}</div>` : emptyState('book', 'No units published', 'Your programme curriculum will appear here once the academic office publishes units.')}
  </div>
  <p class="page-note">${icon('info')} Unit changes are allowed only while registration is open. Dropping a unit removes it from attendance, assignments and current results.</p>`;
}

function renderLecturerUnits(user) {
  const units = DB.unitsForLecturer(user.id);
  return `${pageHead(I18N.t('My units'), 'Your teaching allocation for the current term', `<a class="btn btn-ghost btn-sm" href="#/attendance">${icon('check')} Take attendance</a>`)}
  ${units.length ? `<div class="unit-grid wide">${units.map(u => {
    const students = DB.studentsForUnit(u.code);
    const marks = DB.marksForUnit(u.code, DB.data.meta.termCode);
    return `<article class="unit-card staff-unit">
      <div class="unit-top"><span class="unit-code">${esc(u.code)}</span><span class="badge badge-info">${esc(u.programme)}</span></div>
      <h3>${esc(u.title)}</h3>
      <div class="unit-meta"><span>${icon('clock')} ${esc(u.day)} ${esc(u.time)}</span><span>${icon('pin')} ${esc(u.room)}</span><span>${icon('users')} ${students.length} students</span><span>${icon('academics')} ${u.credits} credits</span></div>
      <div class="unit-foot"><span class="muted-text">${marks.filter(m => m.published).length}/${marks.length} published</span><div class="inline-actions"><a class="btn btn-ghost btn-xs" href="#/marks" data-action="select-marks-unit" data-unit="${u.code}">${icon('marks')} Marks</a><a class="btn btn-ghost btn-xs" href="#/attendance" data-action="select-att-unit" data-unit="${u.code}">${icon('check')} Attendance</a></div></div>
    </article>`;
  }).join('')}</div>` : emptyState('book', 'No units assigned', 'Once the academic office allocates units to you, they will appear here.')}`;
}

/* ---------------- Assignments ---------------- */

function assignmentStatus(a, sub) {
  if (sub && sub.gradedAt) return 'graded';
  if (sub) return 'submitted';
  if (new Date(a.dueAt).getTime() < Date.now()) return 'overdue';
  return 'due';
}

function renderAssignments(user) {
  if (user.role === 'student') {
    const assignments = DB.assignmentsForStudent(user.id);
    const rows = assignments.map(a => {
      const sub = DB.submissionFor(a.id, user.id);
      return { a, sub, state: assignmentStatus(a, sub) };
    }).sort((x, y) => new Date(x.a.dueAt) - new Date(y.a.dueAt));
    return `${pageHead(I18N.t('Assignments'), 'Coursework set by your lecturers', `<a class="btn btn-ghost btn-sm" href="#/units">${icon('book')} ${esc(I18N.t('My units'))}</a>`)}
    <div class="filter-row" data-asg-filters>
      ${['all', 'due', 'submitted', 'graded', 'overdue'].map(f => `<button type="button" class="chip ${f === 'all' ? 'active' : ''}" data-action="asg-filter" data-filter="${f}">${esc(f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1))}</button>`).join('')}
    </div>
    ${rows.length ? `<div class="assignment-list">${rows.map(({ a, sub, state }) => {
      const u = DB.unit(a.unitCode); const info = dueInfo(a.dueAt);
      return `<article class="assignment-card" data-state="${state}">
        <div class="asg-icon">${icon(state === 'graded' ? 'checkCircle' : 'clipboard')}</div>
        <div class="asg-main">
          <div class="asg-top"><span class="unit-code small">${esc(a.unitCode)}</span>${statusBadge(state)}</div>
          <h3>${esc(a.title)}</h3>
          <p>${esc(u ? u.title : '')} · ${esc(a.maxScore)} marks · ${esc(info.label)}</p>
          ${sub && sub.score !== null ? `<div class="asg-score">${icon('star')} Score: <strong>${sub.score}/${a.maxScore}</strong>${sub.feedback ? `<span>${esc(sub.feedback)}</span>` : ''}</div>` : sub ? `<div class="asg-submitted">${icon('check')} Submitted ${esc(relative(sub.createdAt))} · awaiting grade</div>` : ''}
        </div>
        <div class="asg-actions"><button type="button" class="btn ${sub ? 'btn-ghost' : 'btn-primary'} btn-sm" data-action="assignment-open" data-id="${a.id}">${sub ? esc(I18N.t('View details')) : esc(I18N.t('Submit work'))}</button></div>
      </article>`;
    }).join('')}</div>` : `<div class="card">${emptyState('clipboard', 'No assignments yet', 'Assignments for your registered units will appear here.')}</div>`}`;
  }

  const assignments = DB.assignmentsForStaff(user).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `${pageHead(I18N.t('Assignments'), user.role === 'admin' ? 'All coursework across the portal' : 'Manage coursework for your units', `<button type="button" class="btn btn-primary btn-sm" data-action="new-assignment">${icon('plus')} ${esc(I18N.t('New assignment'))}</button>`)}
  ${assignments.length ? `<div class="card table-card"><div class="table-wrap"><table class="data-table">
    <thead><tr><th>Assignment</th><th>Unit</th><th>Due</th><th>Submissions</th><th>To grade</th><th></th></tr></thead>
    <tbody>${assignments.map(a => {
      const subs = DB.submissionsFor(a.id); const ungraded = subs.filter(s => s.score === null).length; const info = dueInfo(a.dueAt);
      return `<tr><td><strong>${esc(a.title)}</strong><small class="cell-sub">Max ${a.maxScore} marks</small></td><td><span class="unit-code small">${esc(a.unitCode)}</span></td><td>${esc(fmtDate(a.dueAt, true))}<small class="cell-sub ${info.overdue ? 'danger-text' : ''}">${esc(info.label)}</small></td><td>${subs.length}</td><td>${ungraded ? `<span class="badge badge-warn">${ungraded}</span>` : `<span class="badge badge-success">0</span>`}</td><td><button type="button" class="btn btn-ghost btn-xs" data-action="assignment-open" data-id="${a.id}">${icon('eye')} Open</button></td></tr>`;
    }).join('')}</tbody>
  </table></div></div>` : `<div class="card">${emptyState('clipboard', 'No assignments created', 'Create an assignment for one of your units.', `<button type="button" class="btn btn-primary" data-action="new-assignment">${icon('plus')} ${esc(I18N.t('New assignment'))}</button>`)}</div>`}`;
}

/* ---------------- Results & transcript ---------------- */

function resultGroups(marks) {
  const groups = {};
  marks.forEach(m => {
    const key = m.termCode;
    if (!groups[key]) {
      const u = DB.unit(m.unitCode);
      groups[key] = { termCode: key, label: u ? u.termLabel : key, marks: [] };
    }
    groups[key].marks.push(m);
  });
  return Object.values(groups).sort((a, b) => (a.termCode < b.termCode ? 1 : -1));
}

function renderResults(user) {
  if (user.role === 'student') {
    const marks = DB.marksForStudent(user.id, true);
    const gpa = DB.gpa(marks);
    const groups = resultGroups(marks);
    return `${pageHead(I18N.t('Results'), 'Published marks for your registered units', `<a class="btn btn-ghost btn-sm" href="#/transcript">${icon('file')} ${esc(I18N.t('Transcript'))}</a>`)}
    <div class="result-hero">
      <div class="gpa-ring" style="--gpa:${gpa || 0}"><span><strong>${gpa === null ? '—' : gpa.toFixed(2)}</strong><small>${esc(I18N.t('GPA'))}</small></span></div>
      <div class="result-hero-copy"><span class="eyebrow">Academic standing</span><h2>${esc(DB.classification(gpa))}</h2><p>${marks.length} published results across ${groups.length} term${groups.length === 1 ? '' : 's'}. Only published results appear here.</p>
      <div class="inline-actions"><a class="btn btn-ghost btn-sm" href="#/transcript">${icon('print')} ${esc(I18N.t('Print transcript'))}</a><a class="btn btn-ghost btn-sm" href="#/units">${icon('book')} Units</a></div></div>
    </div>
    ${groups.length ? groups.map(g => `<div class="card result-group">
      <div class="card-head"><div><h2>${esc(g.label)}</h2><p class="card-sub">${g.marks.length} unit${g.marks.length === 1 ? '' : 's'} · ${g.termCode === DB.data.meta.termCode ? 'Current term' : 'Previous term'}</p></div><span class="chip chip-soft">${esc(g.termCode)}</span></div>
      <div class="table-wrap"><table class="data-table results-table">
        <thead><tr><th>Unit</th><th>Credits</th><th>CAT 1</th><th>CAT 2</th><th>Exam</th><th>Total</th><th>Grade</th><th>Points</th></tr></thead>
        <tbody>${g.marks.map(m => { const u = DB.unit(m.unitCode); return `<tr><td><strong>${esc(m.unitCode)}</strong><small class="cell-sub">${esc(u ? u.title : '')}</small></td><td>${u ? u.credits : '—'}</td><td>${m.cat1}/20</td><td>${m.cat2}/20</td><td>${m.exam}/60</td><td><strong>${m.total}%</strong></td><td><span class="grade-pill grade-${m.grade}">${m.grade}</span></td><td>${m.points.toFixed(1)}</td></tr>`; }).join('')}</tbody>
      </table></div>
    </div>`).join('') : `<div class="card">${emptyState('chart', 'No published results', 'Your lecturers have not published results yet. Check back after assessments are marked.')}</div>`}
    <p class="page-note">${icon('info')} Results are provisional until confirmed by the Registrar. If a mark looks wrong, contact your lecturer or the academic office.</p>`;
  }
  return renderMarks(user);
}

function renderTranscript(user) {
  const marks = DB.marksForStudent(user.id, true);
  const groups = resultGroups(marks);
  const gpa = DB.gpa(marks);
  const prog = programmeFor(user.programme);
  return `${pageHead(I18N.t('Transcript'), 'Unofficial academic record generated from published results', `<button type="button" class="btn btn-primary btn-sm" data-action="print">${icon('print')} ${esc(I18N.t('Print transcript'))}</button>`)}
  <div class="transcript-sheet" id="transcript-sheet">
    <div class="transcript-head">
      <img src="assets/logo.jpeg" alt="TSMHST logo">
      <div class="transcript-school"><strong>Tricent School of Medical Health Science and Technology</strong><span>${esc(APP.address)} · ${esc(APP.domain)} · ${esc(APP.officeEmail)}</span><h2>ACADEMIC TRANSCRIPT</h2></div>
      <div class="transcript-stamp">UNOFFICIAL<br>PORTAL COPY</div>
    </div>
    <div class="transcript-student">
      ${detailRow('Student name', esc(user.name))}
      ${detailRow('Admission number', esc(user.admissionNo))}
      ${detailRow('Programme', esc(prog.name))}
      ${detailRow('Department', esc(prog.dept))}
      ${detailRow('Campus', esc(user.campus || '—'))}
      ${detailRow('Academic year', esc(DB.data.meta.academicYear))}
      ${detailRow('Examining body', esc(prog.examBody))}
      ${detailRow('Generated', esc(fmtDate(new Date().toISOString(), true)))}
    </div>
    ${groups.length ? groups.map(g => `<div class="transcript-term">
      <h3>${esc(g.label)} <span>${esc(g.termCode)}</span></h3>
      <div class="table-wrap"><table class="transcript-table"><thead><tr><th>Code</th><th>Unit</th><th>Credits</th><th>CAT 1</th><th>CAT 2</th><th>Exam</th><th>Total</th><th>Grade</th><th>Points</th></tr></thead>
      <tbody>${g.marks.map(m => { const u = DB.unit(m.unitCode); return `<tr><td>${esc(m.unitCode)}</td><td>${esc(u ? u.title : '')}</td><td>${u ? u.credits : ''}</td><td>${m.cat1}</td><td>${m.cat2}</td><td>${m.exam}</td><td>${m.total}</td><td><strong>${m.grade}</strong></td><td>${m.points.toFixed(1)}</td></tr>`; }).join('')}</tbody></table></div>
    </div>`).join('') : `<div class="transcript-empty">No published results are available for this student yet.</div>`}
    <div class="transcript-summary">
      <div><span>Cumulative GPA</span><strong>${gpa === null ? '—' : gpa.toFixed(2)}</strong></div>
      <div><span>Classification</span><strong>${esc(DB.classification(gpa))}</strong></div>
      <div><span>Units completed</span><strong>${marks.length}</strong></div>
      <div class="transcript-sign"><span>Registrar</span><strong>Signature &amp; stamp</strong></div>
    </div>
    <p class="transcript-foot">This document is generated from the TSMHST Portal and is not valid without the official signature and stamp of the Registrar. © ${new Date().getFullYear()} TSMHST.</p>
  </div>`;
}

/* ---------------- Fees & hostel ---------------- */

function feeAccountName(user) {
  return 'K-' + user.name;
}

function paybillCard(title, channel, account) {
  const till = channel.channel === 'buygoods';
  const number = channel.paybill;
  return `<div class="paybill-card">
    <span class="eyebrow">${esc(title)}</span>
    <div class="paybill-number">${esc(number)}<button type="button" class="icon-btn tiny" data-action="copy" data-copy="${esc(number)}" title="${esc(I18N.t('Copy'))}">${icon('copy')}</button></div>
    <div class="paybill-channel">M-Pesa ${till ? 'Buy Goods (Till)' : 'Paybill'}</div>
    <div class="paybill-account">
      <span>${till ? 'Account' : esc(I18N.t('Account number'))}</span>
      <strong>${till ? 'Not required for Buy Goods' : esc(account)}</strong>
      ${till ? '' : `<button type="button" class="icon-btn tiny" data-action="copy" data-copy="${esc(account)}" title="${esc(I18N.t('Copy'))}">${icon('copy')}</button>`}
    </div>
    ${channel.accountHint ? `<small>${esc(channel.accountHint)}</small>` : ''}
  </div>`;
}

function renderFees(user) {
  if (user.role !== 'student') return renderHome(user);
  const fees = DB.feeSummary(user.id);
  const invoice = DB.invoiceFor(user.id);
  const payments = DB.paymentsFor(user.id);
  const paybills = DB.data.meta.paybills;
  return `${pageHead(I18N.t('Fees'), `${esc(DB.data.meta.termLabel)} · ${esc(user.admissionNo)}`, `<button type="button" class="btn btn-primary btn-sm" data-action="pay-fees">${icon('wallet')} ${esc(I18N.t('Pay now'))}</button>`)}
  <div class="stats-grid">
    ${statCard(I18N.t('Total billed'), money(fees.billed), 'Current account statement', 'file', '')}
    ${statCard(I18N.t('Total paid'), money(fees.paid), 'Verified payments', 'checkCircle', 'green')}
    ${statCard(I18N.t('Outstanding'), money(fees.balance), fees.pending ? `${money(fees.pending)} pending` : 'Nothing pending', 'wallet', fees.balance > 0 ? 'amber' : 'green')}
    ${statCard(I18N.t('Paybill'), paybills.fees.paybill, paybills.fees.name, 'finance', 'maroon')}
  </div>
  ${fees.pending ? `<div class="alert-strip info">${icon('clock')}<span>You have ${money(fees.pending)} awaiting verification. It will reflect once finance confirms the M-Pesa reference.</span></div>` : ''}
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Fee statement'))}</h2><p class="card-sub">${invoice ? esc(invoice.termLabel) : 'No invoice for this term'}</p></div>${statusBadge(fees.balance > 0 ? 'unpaid' : 'paid')}</div>
      ${invoice ? `<div class="table-wrap"><table class="data-table fee-table"><thead><tr><th>${esc(I18N.t('Item'))}</th><th class="right">Amount</th></tr></thead>
        <tbody>${invoice.items.map(item => `<tr><td>${esc(item.label)}</td><td class="right">${money(item.amount)}</td></tr>`).join('')}
        <tr class="table-total"><td><strong>Total billed</strong></td><td class="right"><strong>${money(invoice.total)}</strong></td></tr>
        <tr><td>Total paid (verified)</td><td class="right">${money(fees.paid)}</td></tr>
        <tr class="table-total"><td><strong>Balance</strong></td><td class="right"><strong>${money(fees.balance)}</strong></td></tr></tbody></table></div>` : emptyState('wallet', 'No fee invoice', 'Your invoice will appear after registration is processed.')}
      <p class="page-note">${icon('info')} Fee structure is set by the finance office. Payments are only confirmed after the reference is verified.</p>
    </div>
    <div class="card">
      <div class="card-head"><div><h2>${esc(I18N.t('Pay now'))}</h2><p class="card-sub">M-Pesa paybill details</p></div>${icon('wallet')}</div>
      ${paybillCard(I18N.t('Fees paybill'), paybills.fees, feeAccountName(user))}
      <ol class="steps-list"><li>Go to M-Pesa → Lipa na M-Pesa → Pay Bill.</li><li>Enter business number <strong>${esc(paybills.fees.paybill)}</strong>.</li><li>Account number: <strong>${esc(feeAccountName(user))}</strong> (K- followed by your full name).</li><li>Enter the amount and confirm, then record the M-Pesa code here.</li></ol>
      <button type="button" class="btn btn-primary btn-block" data-action="pay-fees">${icon('wallet')} Record a payment</button>
      ${paybills.fees.demo ? `<p class="demo-note">${icon('alert')} Demo paybill. The finance office must replace it with the official school paybill in Admin → Finance.</p>` : ''}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>${esc(I18N.t('Payment history'))}</h2><p class="card-sub">${payments.length} transaction${payments.length === 1 ? '' : 's'}</p></div></div>
    ${payments.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Reference</th><th>Method</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>${payments.map(p => `<tr><td>${esc(fmtDate(p.createdAt, true))}</td><td><code>${esc(p.reference)}</code></td><td>${esc(p.method)}</td><td class="right">${money(p.amount)}</td><td>${statusBadge(p.status)}</td></tr>`).join('')}</tbody></table></div>` : emptyState('wallet', 'No payments yet', 'Your M-Pesa payments will appear here after you record them.')}
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Hostel accommodation</h2><p class="card-sub">Accommodation is paid separately through Buy Goods</p></div><a class="card-link" href="#/hostel">${esc(I18N.t('Book hostel'))} ${icon('chevron')}</a></div>
    ${paybillCard(I18N.t('Hostel Buy Goods'), paybills.hostel, '')}
  </div>`;
}

function renderHostel(user) {
  if (user.role !== 'student') return renderHome(user);
  const bookings = DB.hostelBookingsFor(user.id);
  const current = bookings.find(b => b.termCode === DB.data.meta.termCode);
  const paybills = DB.data.meta.paybills;
  return `${pageHead(I18N.t('Hostel'), `Accommodation options for ${esc(DB.data.meta.termLabel)}`, `<button type="button" class="btn btn-ghost btn-sm" data-action="pay-fees">${icon('wallet')} ${esc(I18N.t('Pay now'))}</button>`)}
  ${current ? `<div class="alert-strip ${current.status === 'approved' ? 'success' : 'info'}">${icon(current.status === 'approved' ? 'checkCircle' : 'clock')}<span>Your hostel booking is <strong>${esc(current.status)}</strong> for ${esc((HOSTELS.find(h => h.id === current.hostelId) || {}).room || '')}. ${current.status === 'approved' ? 'Pay the hostel fee using the details below.' : 'The accommodation office will review your request.'}</span><a href="#/fees">Fees</a></div>` : ''}
  <div class="unit-grid wide">
    ${HOSTELS.map(h => `<article class="unit-card hostel-card">
      <div class="hostel-visual">${icon('bed')}</div>
      <div class="unit-top"><span class="unit-code">${esc(h.id)}</span><span class="badge badge-info">${esc(h.room)}</span></div>
      <h3>${esc(h.name)}</h3>
      <p class="muted-text">${esc(h.description)}</p>
      <div class="hostel-price"><strong>${money(h.perTerm)}</strong> <small>${esc(I18N.t('Per term'))}</small></div>
      <button type="button" class="btn btn-primary btn-sm btn-block" data-action="hostel-book" data-hostel="${h.id}" ${current ? 'disabled' : ''}>${current ? esc(I18N.t('Submitted')) : esc(I18N.t('Request booking'))}</button>
    </article>`).join('')}
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Hostel Buy Goods'))}</h2><p class="card-sub">Accommodation payments</p></div>${icon('bed')}</div>
      ${paybillCard(I18N.t('Hostel Buy Goods'), paybills.hostel, '')}
      <ol class="steps-list"><li>Go to M-Pesa → Lipa na M-Pesa → Buy Goods and Services.</li><li>Enter till number <strong>${esc(paybills.hostel.paybill)}</strong>.</li><li>Enter the amount and confirm. No account number is required.</li><li>Record the M-Pesa code on the Fees page for verification.</li></ol>
      <p class="demo-note">${icon('info')} Booking requests are reviewed by the accommodation office. Approval does not confirm payment; use the hostel Buy Goods till.</p>
    </div>
    <div class="card"><div class="card-head"><div><h2>My bookings</h2><p class="card-sub">Requests this academic year</p></div></div>
      ${bookings.length ? `<div class="task-list">${bookings.map(b => { const h = HOSTELS.find(x => x.id === b.hostelId); return `<div class="task-row"><span class="task-icon">${icon('bed')}</span><span class="task-copy"><strong>${esc(h ? h.name : 'Hostel')}</strong><small>${esc(h ? h.room : '')} · ${esc(b.termCode)} · ${esc(relative(b.createdAt))}</small></span>${statusBadge(b.status)}</div>`; }).join('')}</div>` : emptyState('bed', 'No hostel bookings', 'Choose a room above to request accommodation.')}
    </div>
  </div>`;
}

/* ---------------- Attendance ---------------- */

function renderAttendance(user) {
  if (user.role === 'student') return renderStudentAttendance(user);
  return renderStaffAttendance(user);
}

function renderStudentAttendance(user) {
  const sessions = DB.openSessionsForStudent(user.id);
  const summary = DB.attendanceSummary(user.id);
  const overall = DB.overallAttendance(user.id);
  const regs = DB.registrationsFor(user.id, DB.data.meta.termCode);
  const unitCodes = regs.map(r => r.unitCode);
  const allSessions = DB.data.sessions.filter(s => unitCodes.includes(s.unitCode)).sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt)).slice(0, 18);
  return `${pageHead(I18N.t('Attendance'), 'Class sign-in and your attendance record', `<a class="btn btn-ghost btn-sm" href="#/units">${icon('book')} ${esc(I18N.t('My units'))}</a>`)}
  <div class="signin-banner ${sessions.length ? 'live' : ''}">
    <div class="signin-icon">${icon('check')}</div>
    <div class="signin-copy"><span class="eyebrow">${sessions.length ? 'Session live' : 'Class sign-in'}</span><h2>${sessions.length ? sessions.length + ' open session' + (sessions.length === 1 ? '' : 's') : 'No open sessions right now'}</h2><p>${sessions.length ? 'Enter the code displayed by your lecturer to sign in.' : 'When your lecturer opens a session, enter the 6-digit code here.'}</p>
      ${sessions.length ? `<div class="open-session-list">${sessions.map(s => `<span class="open-session">${esc(s.unitCode)} · closes ${esc(new Date(s.closesAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}</span>`).join('')}</div>` : ''}
    </div>
    <form class="signin-form" data-form="signin-code"><input name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit code" aria-label="Attendance code" required><button type="submit" class="btn btn-primary" ${sessions.length ? '' : 'disabled'}>${esc(I18N.t('Sign in'))}</button></form>
  </div>
  <div class="stats-grid three">
    ${statCard(I18N.t('Attendance percentage'), overall.percent + '%', 'across your registered units', 'check', overall.percent >= 75 ? 'green' : 'amber')}
    ${statCard(I18N.t('Sessions attended'), String(overall.attended), `${overall.held} sessions held`, 'checkCircle', '')}
    ${statCard('Eligibility', overall.percent >= 75 ? 'On track' : 'At risk', '75% minimum recommended', 'alert', overall.percent >= 75 ? 'green' : 'amber')}
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('My attendance'))}</h2><p class="card-sub">By registered unit</p></div></div>
      ${summary.length ? `<div class="attendance-list">${summary.map(s => `<div class="attendance-row"><div class="attendance-head"><strong>${esc(s.unitCode)} · ${esc(s.unit ? s.unit.title : '')}</strong><span>${s.attended}/${s.held} · <strong>${s.percent}%</strong></span></div>${progress(s.percent, s.percent < 75 ? 'warn' : '')}</div>`).join('')}</div>` : emptyState('check', 'No units registered', 'Register units to track attendance.')}
    </div>
    <div class="card"><div class="card-head"><div><h2>Recent sessions</h2><p class="card-sub">Your sign-in history</p></div></div>
      ${allSessions.length ? `<div class="task-list">${allSessions.map(s => { const present = DB.attendanceForSession(s.id).some(a => a.studentId === user.id); return `<div class="task-row"><span class="task-icon">${icon('calendar')}</span><span class="task-copy"><strong>${esc(s.unitCode)} · ${esc(fmtDate(s.openedAt))}</strong><small>${esc(new Date(s.openedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))} · ${s.status === 'open' ? 'Open now' : 'Closed'}</small></span>${statusBadge(present ? 'present' : 'absent')}</div>`; }).join('')}</div>` : emptyState('calendar', 'No sessions yet', 'Your attendance history will appear here.')}
    </div>
  </div>`;
}

function attendanceUnitsFor(user) {
  return user.role === 'admin' ? DB.data.units.filter(u => u.current) : DB.unitsForLecturer(user.id);
}

function renderStaffAttendance(user) {
  const units = attendanceUnitsFor(user);
  let selected = units.find(u => u.code === PORTAL_STATE.attendance.unitCode);
  if (!selected && units.length) { selected = units[0]; PORTAL_STATE.attendance.unitCode = selected.code; }
  const sessions = selected ? DB.sessionsForUnit(selected.code) : [];
  const open = sessions.filter(s => s.status === 'open');
  const students = selected ? DB.studentsForUnit(selected.code) : [];
  return `${pageHead(I18N.t('Attendance'), 'Open a sign-in session and monitor class attendance',
    `<select class="control" id="att-unit" aria-label="Select unit">${units.map(u => `<option value="${u.code}" ${selected && selected.code === u.code ? 'selected' : ''}>${esc(u.code)} · ${esc(u.title)}</option>`).join('')}</select>`)}
  ${!selected ? `<div class="card">${emptyState('check', 'No units assigned', 'You need a unit allocation before you can take attendance.')}</div>` : `
  <div class="dash-grid">
    <div class="card session-open-card">
      <div class="card-head"><div><h2>${esc(I18N.t('Open session'))}</h2><p class="card-sub">${esc(selected.title)} · ${students.length} students</p></div><span class="badge ${open.length ? 'badge-success' : 'badge-neutral'}">${open.length ? open.length + ' live' : 'None live'}</span></div>
      ${user.role === 'lecturer' ? `<form data-form="start-session" data-unit="${selected.code}" class="session-form">
        <label class="field"><span>${esc(I18N.t('Duration'))}</span><select name="minutes"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="60">60 minutes</option></select></label>
        <button type="submit" class="btn btn-primary">${icon('plus')} ${esc(I18N.t('Open session'))}</button>
      </form><p class="page-note">A unique 6-digit code is generated for each session. Students sign in from their portal.</p>`
      : `<p class="muted-text">Administrators can monitor and close live sessions. Lecturers open sessions from their own accounts.</p>`}
      ${open.length ? open.map(s => {
        const records = DB.attendanceForSession(s.id);
        return `<div class="live-session">
          <div class="live-code"><span>${esc(I18N.t('Session code'))}</span><strong>${esc(s.code)}</strong><small>Closes ${esc(new Date(s.closesAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}</small></div>
          <div class="live-stats"><div><strong>${records.length}</strong><span>signed in</span></div><div><strong>${Math.max(0, students.length - records.length)}</strong><span>not yet</span></div></div>
          <button type="button" class="btn btn-danger-ghost btn-sm" data-action="session-close" data-session="${s.id}">${esc(I18N.t('End session'))}</button>
        </div>
        <details class="roster-details"><summary>${esc(I18N.t('Roster'))} (${records.length}/${students.length})</summary>
          <div class="roster-grid">${students.map(st => { const at = records.find(r => r.studentId === st.id); return `<span class="roster-person ${at ? 'in' : ''}">${avatar(st, 'xs')} ${esc(st.name)} ${at ? icon('check') : ''}</span>`; }).join('')}</div>
        </details>`;
      }).join('') : ''}
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Session history</h2><p class="card-sub">${esc(selected.code)} · ${sessions.length} sessions</p></div></div>
      ${sessions.length ? `<div class="task-list scroll-list">${sessions.map(s => { const records = DB.attendanceForSession(s.id); return `<div class="task-row"><span class="task-icon">${icon('calendar')}</span><span class="task-copy"><strong>${esc(fmtDate(s.openedAt, true))}</strong><small>Code ${esc(s.code)} · ${records.length}/${students.length} signed in</small></span>${s.status === 'open' ? `<button type="button" class="btn btn-danger-ghost btn-xs" data-action="session-close" data-session="${s.id}">${esc(I18N.t('End session'))}</button>` : statusBadge('closed')}</div>`; }).join('')}</div>` : emptyState('calendar', 'No sessions yet', 'Open a session during class to start collecting attendance.')}
    </div>
  </div>
  <div class="card"><div class="card-head"><div><h2>Class attendance summary</h2><p class="card-sub">${esc(selected.code)} · counts across all sessions</p></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Admission no.</th><th>Sessions attended</th><th>Attendance</th></tr></thead><tbody>
      ${students.map(st => { const all = sessions.map(s => s.id); const count = DB.data.attendance.filter(a => a.studentId === st.id && all.includes(a.sessionId)).length; const pct = sessions.length ? Math.round(count / sessions.length * 100) : 0; return `<tr><td><span class="person-cell">${avatar(st, 'xs')} ${esc(st.name)}</span></td><td>${esc(st.admissionNo)}</td><td>${count}/${sessions.length}</td><td><div class="inline-progress">${progress(pct, pct < 75 ? 'warn' : '')}<span>${pct}%</span></div></td></tr>`; }).join('')}
    </tbody></table></div>
  </div>`}`;
}

/* ---------------- Team & notifications ---------------- */

function renderTeam(user) {
  const team = DB.team();
  const groups = [
    { role: 'admin', title: 'Administrators', list: team.filter(m => m.role === 'admin') },
    { role: 'council', title: 'Student Council', list: team.filter(m => m.role === 'council') },
    { role: 'lecturer', title: 'Lecturers', list: team.filter(m => m.role === 'lecturer') }
  ];
  return `${pageHead(I18N.t('Team & presence'), 'Live visibility of administrators, student council and lecturers', `<button type="button" class="btn btn-ghost btn-sm" data-action="refresh-team">${icon('refresh')} ${esc(I18N.t('Refresh'))}</button>`)}
  <div class="alert-strip info">${icon('users')}<span>${esc(I18N.t('Presence shows who is signed in right now.'))} A green dot means the person is currently using the portal in a browser tab.</span></div>
  ${groups.map(g => `<div class="card team-section">
    <div class="card-head"><div><h2>${esc(g.title)}</h2><p class="card-sub">${g.list.filter(m => m.presence.online).length} online · ${g.list.length} members</p></div><span class="chip chip-soft">${esc(g.role === 'council' ? 'Student leaders' : g.role === 'admin' ? 'Portal administration' : 'Teaching staff')}</span></div>
    <div class="team-grid">${g.list.map(m => `<div class="team-card ${m.id === user.id ? 'is-you' : ''}">
      <div class="team-avatar">${avatar(m)}<span class="presence-dot ${m.presence.online ? 'on' : ''}"></span></div>
      <div class="team-copy"><strong>${esc(m.name)}${m.id === user.id ? ' <span class="you-tag">You</span>' : ''}</strong><span>${esc(m.title || roleLabel(m.role))}</span>
        <small>${m.presence.online ? `<span class="online-text">Online now</span>` : `Last seen ${esc(m.presence.lastSeen ? relative(m.presence.lastSeen) : 'never')}`}</small></div>
      <div class="team-contact"><a href="mailto:${esc(m.email)}" title="${esc(m.email)}">${icon('mail')}</a>${m.phone ? `<a href="tel:${esc(m.phone)}" title="${esc(m.phone)}">${icon('phone')}</a>` : ''}</div>
    </div>`).join('')}</div>
  </div>`).join('')}
  <p class="page-note">${icon('shield')} Presence is visible to signed-in portal users. Contact details are provided for official academic and support matters only.</p>`;
}

function renderNotifications(user) {
  const notices = DB.noticesFor(user);
  return `${pageHead(I18N.t('Notifications'), 'Announcements and personal updates', `<button type="button" class="btn btn-ghost btn-sm" data-action="mark-read">${icon('check')} ${esc(I18N.t('Mark all read'))}</button>`)}
  ${notices.length ? `<div class="notification-list">${notices.map(n => `<article class="notification-card ${n.type === 'announcement' ? 'announcement' : ''}">
    <div class="notification-icon">${icon(n.type === 'announcement' ? 'megaphone' : 'bell')}</div>
    <div class="notification-copy"><div class="notification-top"><strong>${esc(n.title)}</strong>${n.pinned ? `<span class="pin-badge">${icon('pin')} ${esc(I18N.t('Pinned'))}</span>` : ''}</div><p>${esc(n.message)}</p><span class="notification-meta">${esc(fmtDate(n.createdAt, true))} · ${esc(n.type === 'announcement' ? 'Announcement' : 'Portal update')}${n.audience ? ' · ' + esc(n.audience === 'all' ? 'Everyone' : n.audience === 'students' ? 'Students' : n.audience === 'admins' ? 'Administrators' : 'Staff') : ''}</span></div>
  </article>`).join('')}</div>` : `<div class="card">${emptyState('bell', I18N.t('No notifications'), 'Announcements and personal updates will appear here.')}</div>`}`;
}
