/* TSMHST Portal — staff, administration, about and settings views */

function staffUnits(user) {
  if (!user) return [];
  if (user.role === 'lecturer') return DB.unitsForLecturer(user.id);
  return DB.data.units.filter(u => u.current);
}

function canManageMarks(user) {
  return !!user && (user.role === 'lecturer' || user.role === 'exam_officer');
}

function markFor(studentId, unitCode) {
  return DB.data.marks.find(m => m.studentId === studentId && m.unitCode === unitCode && m.termCode === DB.data.meta.termCode) || null;
}

function renderMarks(user) {
  if (!canManageMarks(user) && !isExecRole(user.role)) return renderHome(user);
  const readOnly = isExecRole(user.role);
  const units = staffUnits(user);
  let selected = units.find(u => u.code === PORTAL_STATE.marks.unitCode);
  if (!selected && units.length) { selected = units[0]; PORTAL_STATE.marks.unitCode = selected.code; }
  if (!selected) return `${pageHead(I18N.t('Marks studio'), 'Enter, randomise and publish results')} <div class="card">${emptyState('marks', 'No units available', 'You need a unit allocation before you can enter marks.')}</div>`;

  const students = DB.studentsForUnit(selected.code);
  const marks = DB.marksForUnit(selected.code, DB.data.meta.termCode);
  const markMap = {};
  marks.forEach(m => { markMap[m.studentId] = m; });
  let rows = students.slice();
  if (PORTAL_STATE.marks.sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
  else if (PORTAL_STATE.marks.sort === 'random' && PORTAL_STATE.marks.order) {
    rows.sort((a, b) => PORTAL_STATE.marks.order.indexOf(a.id) - PORTAL_STATE.marks.order.indexOf(b.id));
  } else rows.sort((a, b) => String(a.admissionNo || '').localeCompare(String(b.admissionNo || '')));
  const publishedCount = students.filter(s => { const m = markMap[s.id]; return m && m.published; }).length;
  const allPublished = students.length > 0 && publishedCount === students.length;
  const anyPublished = publishedCount > 0;
  const programme = programmeFor(selected.programme);

  return `${pageHead(I18N.t('Marks studio'), `${esc(selected.code)} · ${esc(selected.title)} · ${esc(programme.name)}`,
    readOnly
      ? `<span class="chip chip-soft">${icon('eye')} Directorate oversight · read only</span>`
      : `<button type="button" class="btn btn-ghost btn-sm" data-action="marks-randomize">${icon('sparkles')} ${esc(I18N.t('Randomize marks'))}</button>
     <button type="button" class="btn btn-primary btn-sm" data-action="marks-save">${icon('check')} ${esc(I18N.t('Save marks'))}</button>`)}
  <div class="status-banner ${allPublished ? 'open' : 'closed'}">
    <div class="status-banner-icon">${icon(allPublished ? 'checkCircle' : 'marks')}</div>
    <div><strong>${allPublished ? 'Results are published' : anyPublished ? 'Some results are published' : 'Marks are not published'}</strong><span>${students.length} students registered · ${publishedCount} results published · ${selected.credits} credits</span></div>
    <div class="inline-actions">
      ${readOnly ? '' : `<button type="button" class="btn btn-ghost btn-sm" data-action="marks-randomize-all">${icon('sparkles')} ${esc(I18N.t('Randomize all units'))}</button>
      <button type="button" class="btn ${allPublished ? 'btn-ghost' : 'btn-primary'} btn-sm" data-action="marks-publish" ${marks.length ? '' : 'disabled'}>${icon(allPublished ? 'eye' : 'checkCircle')} ${esc(allPublished ? I18N.t('Unpublish results') : I18N.t('Publish results'))}</button>`}
    </div>
  </div>
  <div class="toolbar">
    <label class="search-field">${icon('search')}<input id="marks-search" type="search" placeholder="${esc(I18N.t('Search') + ' by ' + I18N.t('Admission no.') + ' or name')}" aria-label="Search students"></label>
    <label class="inline-select"><span>${esc(I18N.t('Sort by'))}</span><select id="marks-sort" class="control">
      <option value="admission" ${PORTAL_STATE.marks.sort === 'admission' ? 'selected' : ''}>${esc(I18N.t('Admission no.'))}</option>
      <option value="name" ${PORTAL_STATE.marks.sort === 'name' ? 'selected' : ''}>${esc(I18N.t('Name'))}</option>
      <option value="random" ${PORTAL_STATE.marks.sort === 'random' ? 'selected' : ''}>${esc(I18N.t('Random order'))}</option>
    </select></label>
    <select id="marks-unit" class="control" aria-label="Select unit">${units.map(u => `<option value="${u.code}" ${u.code === selected.code ? 'selected' : ''}>${esc(u.code)} · ${esc(u.title)}</option>`).join('')}</select>
  </div>
  <div class="card table-card marks-card">
    <div class="card-head"><div><h2>${esc(selected.title)}</h2><p class="card-sub">Enter CAT 1 (30), CAT 2 (30) and Exam (70). The CAT average plus the exam gives the total out of 100.</p></div><span class="chip chip-soft">${students.length} students</span></div>
    ${students.length ? `<div class="table-wrap"><table class="data-table marks-table">
      <thead><tr><th>Student</th><th>Admission no.</th><th>CAT 1<br><small>/30</small></th><th>CAT 2<br><small>/30</small></th><th>Exam<br><small>/70</small></th><th>Total</th><th>Grade</th></tr></thead>
      <tbody>${rows.map(s => {
        const m = markMap[s.id] || {};
        return `<tr data-search-row data-search-text="${esc((s.name + ' ' + (s.admissionNo || '')).toLowerCase())}" data-student-row="${s.id}">
          <td><span class="person-cell">${avatar(s, 'xs')} <strong>${esc(s.name)}</strong></span></td>
          <td><code class="admission-code">${esc(s.admissionNo || '—')}</code></td>
          <td><input class="mark-input" type="number" min="0" max="30" inputmode="numeric" data-mark-field="cat1" data-student="${s.id}" value="${m.cat1 !== undefined ? m.cat1 : ''}" aria-label="CAT 1 for ${esc(s.name)}" ${readOnly ? 'disabled' : ''}></td>
          <td><input class="mark-input" type="number" min="0" max="30" inputmode="numeric" data-mark-field="cat2" data-student="${s.id}" value="${m.cat2 !== undefined ? m.cat2 : ''}" aria-label="CAT 2 for ${esc(s.name)}" ${readOnly ? 'disabled' : ''}></td>
          <td><input class="mark-input" type="number" min="0" max="70" inputmode="numeric" data-mark-field="exam" data-student="${s.id}" value="${m.exam !== undefined ? m.exam : ''}" aria-label="Exam for ${esc(s.name)}" ${readOnly ? 'disabled' : ''}></td>
          <td><strong class="row-total" data-row-total>${m.total !== undefined ? m.total : '—'}</strong></td>
          <td><span class="grade-pill grade-${m.grade || 'none'}" data-row-grade>${m.grade || '—'}</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>` : emptyState('users', 'No students registered', 'Students who register this unit will appear here for marks entry.')}
  </div>
  <div class="info-grid">
    <div class="info-card">${icon('sparkles')}<div><strong>Randomised marks</strong><p>“${esc(I18N.t('Randomize marks'))}” places a score against every registered student’s admission number or name for this unit. Use “${esc(I18N.t('Randomize all units'))}” to do it across every unit in the programme.</p></div></div>
    <div class="info-card">${icon('eye')}<div><strong>Publication control</strong><p>Students only see marks after you publish. You can unpublish, correct scores and publish again. Publishing sends a portal notification to each registered student.</p></div></div>
    <div class="info-card">${icon('shield')}<div><strong>Academic integrity</strong><p>Marks are provisional until confirmed by the Registrar. Always verify entered scores before publishing results or printing transcripts.</p></div></div>
  </div>`;
}

function renderAcademics(user) {
  if (user.role !== 'registrar' && !isExecRole(user.role) && user.role !== 'principal') return renderHome(user);
  const canEdit = user.role === 'registrar';
  const meta = DB.data.meta;
  const regs = DB.data.registrations.filter(r => r.termCode === meta.termCode);
  return `${pageHead(I18N.t('Academics'), canEdit ? 'Registrar’s office — term dates, unit registration window and curriculum' : 'Academic overview — curriculum and registration window',
    canEdit || isExecRole(user.role)
      ? `<a class="btn btn-ghost btn-sm" href="#/marks">${icon('marks')} ${esc(I18N.t('Marks studio'))}</a>`
      : `<span class="chip chip-soft">${icon('eye')} Read only · managed by the Registrar</span>`)}
  <div class="stats-grid">
    ${statCard('Registration window', meta.registrationOpen ? 'Open' : 'Closed', `Deadline ${fmtDate(meta.registrationDeadline)}`, 'calendar', meta.registrationOpen ? 'green' : 'amber')}
    ${statCard('Current units', String(DB.data.units.filter(u => u.current).length), 'Across all programmes', 'book', '')}
    ${statCard('Programmes', String(PORTAL_PROGRAMMES.length), 'With published curricula', 'academics', 'maroon')}
    ${statCard('Registrations', String(regs.length), 'Unit registrations this term', 'approvals', 'green')}
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>Unit registration window</h2><p class="card-sub">Changes apply immediately to all students</p></div>${statusBadge(meta.registrationOpen ? 'open' : 'closed')}</div>
      <form data-form="save-academic" class="form-grid two">
        <fieldset class="form-grid two form-span" ${canEdit ? '' : 'disabled'}>
        <label class="field"><span>Academic year</span><input name="academicYear" value="${esc(meta.academicYear)}" required></label>
        <label class="field"><span>Current term label</span><input name="termLabel" value="${esc(meta.termLabel)}" required></label>
        <label class="field"><span>Term code</span><input name="termCode" value="${esc(meta.termCode)}" required></label>
        <label class="field"><span>Registration deadline</span><input name="registrationDeadline" type="date" value="${esc(meta.registrationDeadline)}" required></label>
        <label class="checkline form-span"><input type="checkbox" name="registrationOpen" ${meta.registrationOpen ? 'checked' : ''}> <span>Allow students to register or drop units</span></label>
        <div class="form-span"><button type="submit" class="btn btn-primary" ${canEdit ? '' : 'disabled'}>${icon('check')} ${esc(I18N.t('Save settings'))}</button></div>
        </fieldset>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Programme overview</h2><p class="card-sub">Students and current units</p></div></div>
      <div class="table-wrap"><table class="data-table compact"><thead><tr><th>Programme</th><th>Units</th><th>Students</th></tr></thead>
        <tbody>${PORTAL_PROGRAMMES.map(p => { const st = DB.programmeStats(p.code); return `<tr><td><strong>${esc(p.code)}</strong><small class="cell-sub">${esc(p.short)}</small></td><td>${st.units}</td><td>${st.students}</td></tr>`; }).join('')}</tbody>
      </table></div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Current curriculum</h2><p class="card-sub">All published units · ${esc(meta.termLabel)}</p></div><span class="chip chip-soft">${DB.data.units.filter(u => u.current).length} units</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Unit</th><th>Programme</th><th>Lecturer</th><th>Schedule</th><th>Registered</th></tr></thead>
      <tbody>${DB.data.units.filter(u => u.current).map(u => { const lec = DB.user(u.lecturer); const count = DB.data.registrations.filter(r => r.unitCode === u.code && r.termCode === meta.termCode).length; return `<tr><td><code class="admission-code">${esc(u.code)}</code></td><td><strong>${esc(u.title)}</strong><small class="cell-sub">${u.credits} credits · ${esc(u.type)}</small></td><td>${esc(u.programme)}</td><td>${esc(lec ? lec.name : '—')}</td><td>${esc(u.day)} ${esc(u.time)}<small class="cell-sub">${esc(u.room)}</small></td><td>${count}</td></tr>`; }).join('')}</tbody>
    </table></div>
  </div>
  <p class="page-note">${icon('info')} New programmes or units can be added by extending the curriculum seed. In a production deployment, these forms would write to a secure academic database.</p>`;
}

/* ---------------- Role home workspaces ---------------- */

function officePendingCard(user, pending) {
  return `<div class="card">
    <div class="card-head"><div><h2>${esc(I18N.t('Pending registrations'))}</h2><p class="card-sub">Accounts awaiting your approval</p></div><a class="card-link" href="#/approvals">${esc(I18N.t('View all'))}</a></div>
    ${pending.length ? `<div class="task-list">${pending.slice(0, 4).map(u => `<div class="task-row">${avatar(u, 'sm')}<span class="task-copy"><strong>${esc(u.name)}</strong><small>${esc(roleLabel(u.role))} · ${esc(u.email)}</small></span><button type="button" class="btn btn-primary btn-xs" data-action="approval-approve" data-user="${u.id}">${esc(I18N.t('Approve'))}</button></div>`).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No registrations are waiting for your approval.</div>`}
  </div>`;
}

function renderOfficeHome(user) {
  if (user.role === 'owner') return renderSettings(user);
  const pending = DB.pendingUsersFor(user);
  const scopeLabel = isExecRole(user.role) ? ALL_CAMPUSES : (user.campus || 'Nairobi');
  const students = DB.usersForCampus(scopeLabel).filter(u => u.role === 'student' && u.status === 'active');
  const qa = DB.qualitySnapshot();

  if (isExecRole(user.role)) {
    return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${esc(user.title)} — oversight of all campuses`,
      `<a class="btn btn-primary btn-sm" href="#/campuses">${icon('academics')} Campus overview</a>`)}
    <div class="hero-card admin-hero">
      <div class="hero-copy">
        <span class="eyebrow light">Directorate</span>
        <h2>${esc(DB.data.meta.termLabel)}</h2>
        <p>${CAMPUSES.length} campuses · ${qa.students} active students · ${qa.staff} staff · ${DB.data.units.filter(u => u.current).length} units</p>
        <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/approvals">${icon('approvals')} Approvals${pending.length ? ` (${pending.length})` : ''}</a><a class="btn btn-outline-light btn-sm" href="#/quality">${icon('shield')} Service quality</a></div>
      </div>
      <div class="hero-metric"><span>Attendance across campuses</span><strong>${qa.attendance}%</strong>${progress(qa.attendance)}<small>${qa.held} sessions recorded</small></div>
    </div>
    <div class="stats-grid">
      ${statCard('Campuses', String(CAMPUSES.length), 'Under directorate oversight', 'academics', 'green')}
      ${statCard('Active students', String(qa.students), 'All campuses', 'graduation', '')}
      ${statCard('Awaiting your approval', String(pending.length), pending.length ? 'Deputy, general admin & staff' : 'All reviewed', 'approvals', pending.length ? 'amber' : '')}
      ${statCard('Results published', qa.published + '%', `${qa.publishedTotal} marks recorded`, 'chart', 'maroon')}
    </div>
    <div class="dash-grid">
      ${officePendingCard(user, pending)}
      <div class="card">
        <div class="card-head"><div><h2>Campuses</h2><p class="card-sub">Enrolment and attendance</p></div><a class="card-link" href="#/campuses">${esc(I18N.t('View all'))}</a></div>
        <div class="qa-list">${qa.campuses.map(c => `<div class="qa-row"><span>${esc(c.campus)}</span>${progress(c.attendance)}<strong>${c.students} std</strong></div>`).join('')}</div>
      </div>
    </div>
    <div class="dash-grid">
      <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
      <div class="card">
        <div class="card-head"><div><h2>Directorate tools</h2><p class="card-sub">Common tasks</p></div></div>
        <div class="stack-actions">
          <a class="list-action" href="#/campuses">${icon('academics')}<span><strong>Campus oversight</strong><small>Students, staff and attendance by campus</small></span>${icon('chevron')}</a>
          <a class="list-action" href="#/quality">${icon('shield')}<span><strong>Service quality</strong><small>Quality assurance indicators</small></span>${icon('chevron')}</a>
          <a class="list-action" href="#/marks">${icon('marks')}<span><strong>Marks oversight</strong><small>Read-only view of the marks studio</small></span>${icon('chevron')}</a>
          <a class="list-action" href="#/announcements">${icon('megaphone')}<span><strong>Post an announcement</strong><small>Reach staff, students or everyone</small></span>${icon('chevron')}</a>
        </div>
      </div>
    </div>`;
  }

  if (user.role === 'principal') {
    const payments = DB.paymentsForCampus(user.campus);
    const pendingPay = payments.filter(p => p.status === 'pending');
    const attendance = DB.attendancePercentFor(students);
    return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${user.campus} campus principal`,
      `<a class="btn btn-primary btn-sm" href="#/approvals">${icon('approvals')} Approvals${pending.length ? ` (${pending.length})` : ''}</a>`)}
    <div class="hero-card staff-hero">
      <div class="hero-copy">
        <span class="eyebrow light">Principal’s office</span>
        <h2>${esc(DB.data.meta.termLabel)}</h2>
        <p>${students.length} students · ${DB.usersForCampus(user.campus).filter(u => u.role === 'lecturer' && u.status === 'active').length} lecturers · ${pendingPay.length} payments awaiting verification</p>
        <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/payments">${icon('wallet')} Payments desk</a><a class="btn btn-outline-light btn-sm" href="#/users">${icon('users')} Campus users</a></div>
      </div>
      <div class="hero-metric"><span>Attendance</span><strong>${attendance.percent}%</strong>${progress(attendance.percent)}<small>${attendance.held} sessions</small></div>
    </div>
    <div class="stats-grid">
      ${statCard('Active students', String(students.length), user.campus + ' campus', 'graduation', 'green')}
      ${statCard('Awaiting your approval', String(pending.length), 'Lecturers & college admins', 'approvals', pending.length ? 'amber' : '')}
      ${statCard('Payments to verify', String(pendingPay.length), 'Confirmed by campus admin', 'wallet', pendingPay.length ? 'amber' : '')}
      ${statCard('Attendance', attendance.percent + '%', 'This term', 'check', 'maroon')}
    </div>
    <div class="dash-grid">
      ${officePendingCard(user, pending)}
      <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
    </div>`;
  }

  if (user.role === 'campus_admin') {
    const payments = DB.paymentsForCampus(user.campus);
    const pendingPay = payments.filter(p => p.status === 'pending');
    const bookings = DB.hostelBookingsForCampus(user.campus).filter(b => b.status === 'pending');
    return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${user.campus} campus administration`,
      `<a class="btn btn-primary btn-sm" href="#/payments">${icon('wallet')} Payments desk${pendingPay.length ? ` (${pendingPay.length})` : ''}</a>`)}
    <div class="hero-card staff-hero">
      <div class="hero-copy">
        <span class="eyebrow light">Campus administration</span>
        <h2>${esc(DB.data.meta.termLabel)}</h2>
        <p>${students.length} students · ${pending.length} student registrations to approve · ${bookings.length} hostel requests</p>
        <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/approvals">${icon('approvals')} Approve students</a><a class="btn btn-outline-light btn-sm" href="#/users">${icon('users')} Campus users</a></div>
      </div>
      <div class="hero-metric"><span>Payments to verify</span><strong class="smaller">${pendingPay.length}</strong><small>M-Pesa receipts at ${esc(user.campus)}</small></div>
    </div>
    <div class="stats-grid">
      ${statCard('Active students', String(students.length), user.campus + ' campus', 'graduation', 'green')}
      ${statCard('Student registrations', String(pending.length), pending.length ? 'Awaiting your approval' : 'All reviewed', 'approvals', pending.length ? 'amber' : '')}
      ${statCard('Payments to verify', String(pendingPay.length), 'Confirm each M-Pesa reference', 'wallet', pendingPay.length ? 'amber' : '')}
      ${statCard('Hostel requests', String(bookings.length), 'Pending review', 'bed', 'maroon')}
    </div>
    <div class="dash-grid">
      ${officePendingCard(user, pending)}
      <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
    </div>`;
  }

  if (user.role === 'registrar') {
    const regs = DB.data.registrations.filter(r => r.termCode === DB.data.meta.termCode);
    return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, 'Academic Registry — curriculum, registration window and records',
      `<a class="btn btn-primary btn-sm" href="#/academics">${icon('academics')} Manage academics</a>`)}
    <div class="hero-card admin-hero">
      <div class="hero-copy">
        <span class="eyebrow light">Academic Registry</span>
        <h2>${esc(DB.data.meta.termLabel)}</h2>
        <p>Registration ${DB.data.meta.registrationOpen ? 'open' : 'closed'} · deadline ${esc(fmtDate(DB.data.meta.registrationDeadline))} · ${regs.length} unit registrations</p>
        <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/academics">${icon('calendar')} Registration window</a><a class="btn btn-outline-light btn-sm" href="#/units">${icon('book')} Curriculum</a></div>
      </div>
      <div class="hero-metric"><span>Programmes</span><strong>${PORTAL_PROGRAMMES.length}</strong><small>${DB.data.units.filter(u => u.current).length} current units</small></div>
    </div>
    <div class="stats-grid">
      ${statCard('Registration window', DB.data.meta.registrationOpen ? 'Open' : 'Closed', 'Deadline ' + fmtDate(DB.data.meta.registrationDeadline), 'calendar', DB.data.meta.registrationOpen ? 'green' : 'amber')}
      ${statCard('Current units', String(DB.data.units.filter(u => u.current).length), 'Across all programmes', 'book', '')}
      ${statCard('Registrations', String(regs.length), 'Unit registrations this term', 'approvals', 'green')}
      ${statCard('Programmes', String(PORTAL_PROGRAMMES.length), 'Published curricula', 'academics', 'maroon')}
    </div>
    <div class="dash-grid">
      <div class="card"><div class="card-head"><div><h2>Programme overview</h2><p class="card-sub">Students and current units</p></div></div>
        <div class="table-wrap"><table class="data-table compact"><thead><tr><th>Programme</th><th>Units</th><th>Students</th></tr></thead>
          <tbody>${PORTAL_PROGRAMMES.slice(0, 8).map(p => { const st = DB.programmeStats(p.code); return `<tr><td><strong>${esc(p.code)}</strong><small class="cell-sub">${esc(p.short)}</small></td><td>${st.units}</td><td>${st.students}</td></tr>`; }).join('')}</tbody>
        </table></div>
      </div>
      <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
    </div>`;
  }

  if (user.role === 'exam_officer') {
    const units = DB.data.units.filter(u => u.current);
    const rows = units.map(u => {
      const marks = DB.marksForUnit(u.code, DB.data.meta.termCode);
      const published = marks.filter(m => m.published).length;
      return { u, total: marks.length, published };
    });
    const outstanding = rows.filter(r => r.total === 0).length;
    return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, 'Examinations Office — marks studio and result publication',
      `<a class="btn btn-primary btn-sm" href="#/marks">${icon('marks')} ${esc(I18N.t('Marks studio'))}</a>`)}
    <div class="hero-card staff-hero">
      <div class="hero-copy">
        <span class="eyebrow light">Examinations Office</span>
        <h2>${esc(DB.data.meta.termLabel)}</h2>
        <p>${units.length} units · CAT 1 &amp; 2 out of 30 · Main exam out of 70</p>
        <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/marks">${icon('marks')} Enter or publish marks</a><a class="btn btn-outline-light btn-sm" href="#/academics">${icon('academics')} Academic overview</a></div>
      </div>
      <div class="hero-metric"><span>Units without marks</span><strong>${outstanding}</strong><small>of ${units.length} current units</small></div>
    </div>
    <div class="stats-grid">
      ${statCard('Current units', String(units.length), 'All programmes', 'book', 'green')}
      ${statCard('Marks recorded', String(rows.reduce((a, r) => a + r.total, 0)), 'This term', 'marks', '')}
      ${statCard('Results published', String(rows.reduce((a, r) => a + r.published, 0)), 'Visible to students', 'eye', 'maroon')}
      ${statCard('Units without marks', String(outstanding), 'Needs lecturer follow-up', 'alert', outstanding ? 'amber' : 'green')}
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Publication status by unit</h2><p class="card-sub">Marks recorded and published this term</p></div><span class="chip chip-soft">${units.length} units</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Unit</th><th>Programme</th><th>Marks</th><th>Published</th><th></th></tr></thead>
        <tbody>${rows.map(r => `<tr><td><code class="admission-code">${esc(r.u.code)}</code></td><td><strong>${esc(r.u.title)}</strong></td><td>${esc(r.u.programme)}</td><td>${r.total}</td><td>${r.published}</td><td><button type="button" class="btn btn-ghost btn-xs" data-action="marks-unit-open" data-unit="${r.u.code}">${icon('marks')} Open</button></td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  }

  if (user.role === 'qa_officer') {
    return renderQuality(user);
  }

  if (user.role === 'accounts_clerk') {
    return renderFinance(user);
  }

  return `${pageHead(`${greeting()}, ${user.name.split(' ')[0]}`, `${esc(user.title)}`,
    `<button type="button" class="btn btn-primary btn-sm" data-action="new-announcement">${icon('megaphone')} ${esc(I18N.t('Create announcement'))}</button>`)}
  <div class="hero-card council-hero">
    <div class="hero-copy">
      <span class="eyebrow light">Administration</span>
      <h2>${esc(DB.data.meta.termLabel)}</h2>
      <p>Administration secretariat · ${esc(DB.data.meta.academicYear)} · ${DB.data.units.filter(u => u.current).length} units running</p>
      <div class="hero-actions"><a class="btn btn-light btn-sm" href="#/announcements">${icon('megaphone')} Announcements</a><a class="btn btn-outline-light btn-sm" href="#/team">${icon('users')} Team & presence</a></div>
    </div>
    <div class="hero-metric"><span>Term registrations</span><strong class="smaller">${DB.data.registrations.filter(r => r.termCode === DB.data.meta.termCode).length}</strong><small>unit registrations</small></div>
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>${esc(I18N.t('Announcements'))}</h2><p class="card-sub">Recent notices</p></div><a class="card-link" href="#/announcements">${esc(I18N.t('View all'))}</a></div>${announcementList(user, 3)}</div>
    ${leadershipCard(user)}
  </div>`;
}

/* ---------------- Approvals & users ---------------- */

function renderApprovals(user) {
  if (!user || user.role === 'student' || user.role === 'council') return renderHome(user);
  const pending = DB.pendingUsersFor(user);
  const role = user.role;
  const subtitle = role === 'owner' ? 'Directorate and principal accounts awaiting your approval'
    : role === 'director' ? 'Deputy director, general admin and staff accounts awaiting directorate approval'
    : role === 'principal' ? `Lecturer and college admin accounts for ${user.campus}`
    : role === 'campus_admin' ? `Student accounts for ${user.campus}`
    : 'Registrations in your office’s scope';
  const processed = DB.data.users.filter(u => u.approvedAt || u.rejectedAt).sort((a, b) => new Date(b.approvedAt || b.rejectedAt) - new Date(a.approvedAt || a.rejectedAt)).slice(0, 6);
  return `${pageHead(I18N.t('Approvals'), subtitle,
    `<a class="btn btn-ghost btn-sm" href="#/users">${icon('users')} ${esc(I18N.t('Users'))}</a>`)}
  <div class="stats-grid three">
    ${statCard('Awaiting your approval', String(pending.length), pending.length ? 'Waiting for review' : 'All reviewed', 'approvals', pending.length ? 'amber' : 'green')}
    ${statCard('Active accounts you can see', String(DB.usersForCampus(user.campus).filter(u => u.status === 'active').length), esc(user.campus), 'users', '')}
    ${statCard('Rejected', String(DB.usersForCampus(user.campus).filter(u => u.status === 'rejected').length), 'This academic year', 'alert', 'maroon')}
  </div>
  ${pending.length ? `<div class="approval-list">${pending.map(u => `<article class="approval-card">
    <div class="approval-head"><div class="approval-person">${avatar(u)}<div><strong>${esc(u.name)}</strong><span>${esc(roleLabel(u.role))} · registered ${esc(fmtDate(u.createdAt))}</span></div></div>${statusBadge('pending')}</div>
    <div class="approval-details">
      ${u.admissionNo ? detailRow('Admission number', esc(u.admissionNo)) : ''}
      ${u.staffNo ? detailRow('Staff number', esc(u.staffNo)) : ''}
      ${u.programme ? detailRow('Programme', esc(programmeFor(u.programme).name)) : ''}
      ${u.department ? detailRow('Department', esc(u.department)) : ''}
      ${u.campus ? detailRow('Campus', esc(u.campus)) : ''}
      ${detailRow('Email', `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>`)}
      ${detailRow('Phone', esc(u.phone || '—'))}
    </div>
    <div class="approval-actions">
      <button type="button" class="btn btn-danger-ghost btn-sm" data-action="approval-reject" data-user="${u.id}">${icon('x')} ${esc(I18N.t('Reject'))}</button>
      <button type="button" class="btn btn-primary btn-sm" data-action="approval-approve" data-user="${u.id}">${icon('check')} ${esc(I18N.t('Approve user'))}</button>
    </div>
  </article>`).join('')}</div>` : `<div class="card">${emptyState('approvals', 'All caught up', 'There are no registrations waiting for your approval. New requests will appear here.')}</div>`}
  <div class="card">
    <div class="card-head"><div><h2>Recently reviewed</h2><p class="card-sub">Latest account decisions</p></div></div>
    ${processed.length ? `<div class="task-list">${processed.map(u => `<div class="task-row">${avatar(u, 'sm')}<span class="task-copy"><strong>${esc(u.name)}</strong><small>${esc(roleLabel(u.role))} · ${esc(u.approvedAt ? 'approved ' + relative(u.approvedAt) : 'rejected ' + relative(u.rejectedAt))}</small></span>${u.status === 'active' ? statusBadge('approved') : statusBadge('rejected')}</div>`).join('')}</div>` : `<p class="muted-text">No accounts have been reviewed yet.</p>`}
  </div>`;
}

function canManageUser(actor, target) {
  if (!actor || !target || actor.id === target.id) return false;
  if (target.role === 'owner' || target.role === 'admin') return false;
  if (actor.role === 'campus_admin') return target.role === 'student' && target.campus === actor.campus;
  if (actor.role === 'principal') {
    return (target.role === 'lecturer' || (isAdminRole(target.role) && target.role !== 'principal')) && target.campus === actor.campus;
  }
  if (isExecRole(actor.role)) {
    return isStaffRole(target.role) && target.role !== 'principal' && target.role !== 'director' && target.role !== 'deputy_director' && target.role !== 'general_admin';
  }
  return false;
}

function renderUsers(user) {
  if (!user || user.role === 'student' || user.role === 'council' || user.role === 'owner') return renderHome(user);
  const scope = user.role === 'campus_admin' ? user.campus : (isExecRole(user.role) ? ALL_CAMPUSES : user.campus);
  const users = DB.usersForCampus(scope).slice().sort((a, b) => a.name.localeCompare(b.name));
  const counts = { all: users.length, student: 0, lecturer: 0, council: 0, admin: 0 };
  users.forEach(u => { if (u.role === 'student') counts.student++; else if (u.role === 'lecturer') counts.lecturer++; else if (u.role === 'council') counts.council++; else if (isAdminRole(u.role)) counts.admin++; });
  return `${pageHead(I18N.t('Users'), scope === ALL_CAMPUSES ? 'All portal accounts across every campus' : `Portal accounts at ${scope} campus`,
    `<a class="btn btn-ghost btn-sm" href="#/approvals">${icon('approvals')} ${esc(I18N.t('Approvals'))}</a>`)}
  <div class="toolbar">
    <label class="search-field">${icon('search')}<input id="users-search" type="search" placeholder="Search name, email or number" aria-label="Search users"></label>
    <div class="filter-row" data-user-filters>
      ${[['all', 'All'], ['student', 'Students'], ['lecturer', 'Lecturers'], ['council', 'Council'], ['admin', 'Administrators']].map(([key, label]) => `<button type="button" class="chip ${key === 'all' ? 'active' : ''}" data-action="user-filter" data-filter="${key}">${esc(label)} <span class="chip-count">${counts[key]}</span></button>`).join('')}
    </div>
  </div>
  <div class="card table-card"><div class="table-wrap"><table class="data-table users-table">
    <thead><tr><th>Name</th><th>Identifier</th><th>Role</th><th>Programme / department</th><th>Status</th><th>Last seen</th><th></th></tr></thead>
    <tbody>${users.map(u => {
      const presence = DB.presenceOf(u.id);
      const identifier = u.admissionNo || u.staffNo || u.email;
      return `<tr data-user-row data-role="${esc(u.role)}" data-search-text="${esc((u.name + ' ' + u.email + ' ' + identifier).toLowerCase())}">
        <td><span class="person-cell">${avatar(u, 'xs')} <strong>${esc(u.name)}</strong>${u.id === user.id ? '<span class="you-tag">You</span>' : ''}</span></td>
        <td><code class="admission-code">${esc(identifier)}</code></td>
        <td><span class="role-pill role-${esc(u.role)}">${esc(roleLabel(u.role))}</span></td>
        <td>${esc(u.programme ? programmeFor(u.programme).short : (u.department || '—'))}</td>
        <td>${statusBadge(u.status === 'active' ? 'active' : u.status)}</td>
        <td>${u.status === 'pending' ? '—' : presence.online ? `<span class="online-text">Online</span>` : (presence.lastSeen ? esc(relative(presence.lastSeen)) : '—')}</td>
        <td class="row-actions">${canManageUser(user, u) ? `<button type="button" class="btn ${u.status === 'active' ? 'btn-danger-ghost' : 'btn-primary'} btn-xs" data-action="user-toggle" data-user="${u.id}" data-status="${u.status === 'active' ? 'suspended' : 'active'}">${u.status === 'active' ? 'Suspend' : 'Activate'}</button>` : u.status === 'pending' ? `<a class="btn btn-ghost btn-xs" href="#/approvals">Review</a>` : ''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div></div>
  <p class="page-note">${icon('shield')} Suspending an account immediately prevents sign-in. You can only manage accounts within your office’s scope; owners and other administrators cannot be suspended from this screen.</p>`;
}

function renderFinance(user) {
  if (!user || user.role !== 'accounts_clerk') return renderHome(user);
  const finance = DB.financeSummary();
  const verified = DB.data.payments.filter(p => p.status === 'verified').sort((a, b) => new Date(b.verifiedAt || b.createdAt) - new Date(a.verifiedAt || a.createdAt)).slice(0, 14);
  const pending = DB.recentPendingPayments();
  const paybills = DB.data.meta.paybills;
  return `${pageHead(I18N.t('Finance'), 'Finance office — verified payments, cash awaiting verification and billed totals',
    `<a class="btn btn-ghost btn-sm" href="#/users">${icon('users')} Student accounts</a>`)}
  <div class="stats-grid">
    ${statCard('Verified payments', money(finance.verified), finance.verifiedCount + ' receipts confirmed', 'checkCircle', 'green')}
    ${statCard('Cash awaiting verification', money(finance.pending), finance.pendingCount + ' payments', 'clock', finance.pendingCount ? 'amber' : '')}
    ${statCard('Billed (all students)', money(finance.billed), 'Current invoices', 'file', 'maroon')}
    ${statCard('Collection rate', finance.billed ? Math.round(finance.verified / finance.billed * 100) + '%' : '—', 'Verified against billed', 'chart', '')}
  </div>
  <div class="dash-grid finance-dash">
    <div class="card">
      <div class="card-head"><div><h2>Cash awaiting verification</h2><p class="card-sub">Campus admins confirm these receipts</p></div><span class="badge badge-warn">${pending.length}</span></div>
      ${pending.length ? `<div class="payment-list">${pending.slice(0, 8).map(p => { const s = DB.user(p.studentId); return `<div class="payment-row">
        <div class="payment-person">${avatar(s, 'sm')}<div><strong>${esc(s ? s.name : 'Student')}</strong><small>${esc(s ? s.admissionNo : '')} · ${esc(relative(p.createdAt))}</small></div></div>
        <div class="payment-ref"><span>Reference</span><code>${esc(p.reference)}</code></div>
        <div class="payment-amount"><strong>${money(p.amount)}</strong><span>${esc(p.method)}</span></div>
      </div>`; }).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No cash is awaiting verification.</div>`}
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Payment channels</h2><p class="card-sub">Fees use a paybill; hostel uses Buy Goods</p></div>${icon('finance')}</div>
      <form data-form="save-paybills" class="form-grid">
        <label class="field form-span"><span>Fees paybill number</span><input name="feesPaybill" value="${esc(paybills.fees.paybill)}" required inputmode="numeric"></label>
        <label class="field"><span>Fees paybill name</span><input name="feesName" value="${esc(paybills.fees.name)}" required></label>
        <label class="field"><span>Fees account rule</span><input value="K- + student full name" disabled></label>
        <label class="field form-span"><span>Fees account hint</span><input name="feesHint" value="${esc(paybills.fees.accountHint)}"></label>
        <label class="field form-span"><span>Hostel Buy Goods (Till) number</span><input name="hostelPaybill" value="${esc(paybills.hostel.paybill)}" required inputmode="numeric"></label>
        <label class="field"><span>Hostel channel name</span><input name="hostelName" value="${esc(paybills.hostel.name)}" required></label>
        <label class="field"><span>Hostel account rule</span><input value="No account number required" disabled></label>
        <label class="field form-span"><span>Hostel payment hint</span><input name="hostelHint" value="${esc(paybills.hostel.accountHint)}"></label>
        <div class="form-span"><button type="submit" class="btn btn-primary">${icon('check')} ${esc(I18N.t('Save settings'))}</button></div>
      </form>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Verified payments</h2><p class="card-sub">Latest confirmed receipts across all campuses</p></div><span class="chip chip-soft">${verified.length} shown</span></div>
    ${verified.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Admission no.</th><th>Campus</th><th>Reference</th><th>Date</th><th class="right">Amount</th><th>Status</th></tr></thead>
      <tbody>${verified.map(p => { const s = DB.user(p.studentId); return `<tr><td><span class="person-cell">${avatar(s, 'xs')} ${esc(s ? s.name : '—')}</span></td><td>${esc(s ? s.admissionNo : '—')}</td><td>${esc(s ? s.campus || '—' : '—')}</td><td><code>${esc(p.reference)}</code></td><td>${esc(fmtDate(p.createdAt))}</td><td class="right">${money(p.amount)}</td><td>${statusBadge(p.status)}</td></tr>`; }).join('')}</tbody>
    </table></div>` : `<div class="inline-success">${icon('checkCircle')} No verified payments yet.</div>`}
  </div>
  <p class="page-note">${icon('lock')} Finance totals — verified, awaiting verification and billed — are visible to the Finance Office only. Campus admins verify individual student payments from the Payments desk.</p>`;
}

function renderPayments(user) {
  if (!user || (user.role !== 'campus_admin' && user.role !== 'principal')) return renderHome(user);
  const scope = user.campus;
  const canVerify = user.role === 'campus_admin';
  const payments = DB.paymentsForCampus(scope).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pending = payments.filter(p => p.status === 'pending');
  const bookings = DB.hostelBookingsForCampus(scope).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `${pageHead(I18N.t('Payments'), `${esc(scope)} campus — ${canVerify ? 'verify student M-Pesa payments and hostel bookings' : 'payment and hostel activity (verification handled by campus admins)'}`,
    `<a class="btn btn-ghost btn-sm" href="#/users">${icon('users')} Students</a>`)}
  <div class="stats-grid three">
    ${statCard('Awaiting verification', String(pending.length), pending.length ? 'Confirm each reference' : 'Queue is clear', 'clock', pending.length ? 'amber' : 'green')}
    ${statCard('Payments handled', String(payments.filter(p => p.status !== 'pending').length), 'Verified or rejected', 'checkCircle', '')}
    ${statCard('Hostel requests', String(bookings.filter(b => b.status === 'pending').length), 'Pending review', 'bed', '')}
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Payments to verify</h2><p class="card-sub">Confirm the M-Pesa reference against the student account before accepting</p></div><span class="badge badge-warn">${pending.length}</span></div>
    ${pending.length ? `<div class="payment-list">${pending.map(p => { const s = DB.user(p.studentId); return `<div class="payment-row">
      <div class="payment-person">${avatar(s, 'sm')}<div><strong>${esc(s ? s.name : 'Student')}</strong><small>${esc(s ? s.admissionNo : '')} · ${esc(relative(p.createdAt))}</small></div></div>
      <div class="payment-ref"><span>Reference</span><code>${esc(p.reference)}</code></div>
      <div class="payment-amount"><strong>${money(p.amount)}</strong><span>${esc(p.method)}</span></div>
      <div class="inline-actions">${canVerify ? `<button type="button" class="btn btn-primary btn-xs" data-action="payment-verify" data-payment="${p.id}">${icon('check')} ${esc(I18N.t('Verify'))}</button><button type="button" class="btn btn-danger-ghost btn-xs" data-action="payment-reject" data-payment="${p.id}">${esc(I18N.t('Reject'))}</button>` : statusBadge('pending')}</div>
    </div>`; }).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No payments are waiting for verification.</div>`}
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Hostel booking requests</h2><p class="card-sub">Approve when a room is available</p></div><span class="chip chip-soft">${bookings.length} requests</span></div>
    ${bookings.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Accommodation</th><th>Term</th><th>Requested</th><th>Status</th><th></th></tr></thead>
      <tbody>${bookings.map(b => { const s = DB.user(b.studentId); const h = HOSTELS.find(x => x.id === b.hostelId); return `<tr><td><span class="person-cell">${avatar(s, 'xs')} ${esc(s ? s.name : '—')}</span><small class="cell-sub">${esc(s ? s.admissionNo : '')}</small></td><td>${esc(h ? h.name + ' — ' + h.room : '—')}<small class="cell-sub">${money(h ? h.perTerm : 0)}</small></td><td>${esc(b.termCode)}</td><td>${esc(fmtDate(b.createdAt))}</td><td>${statusBadge(b.status)}</td><td><div class="inline-actions">${canVerify && b.status === 'pending' ? `<button type="button" class="btn btn-primary btn-xs" data-action="booking-status" data-booking="${b.id}" data-status="approved">${esc(I18N.t('Approve'))}</button><button type="button" class="btn btn-danger-ghost btn-xs" data-action="booking-status" data-booking="${b.id}" data-status="rejected">${esc(I18N.t('Reject'))}</button>` : ''}</div></td></tr>`; }).join('')}</tbody>
    </table></div>` : emptyState('bed', 'No hostel requests', 'Student booking requests will appear here.')}
  </div>
  <p class="page-note">${icon('shield')} The finance totals (verified totals, cash awaiting verification and billed amounts) are restricted to the Finance Office.</p>`;
}

function renderCampuses(user) {
  if (!user || !isExecRole(user.role)) return renderHome(user);
  const rows = DB.campusSummary();
  const totals = rows.reduce((a, r) => ({
    students: a.students + r.students, staff: a.staff + r.staff, pending: a.pending + r.pending,
    hostel: a.hostel + r.hostelRequests, pendingPayments: a.pendingPayments + r.pendingPayments
  }), { students: 0, staff: 0, pending: 0, hostel: 0, pendingPayments: 0 });
  return `${pageHead('Campuses', 'Directorate oversight across all six campuses',
    `<a class="btn btn-ghost btn-sm" href="#/users">${icon('users')} ${esc(I18N.t('Users'))}</a>`)}
  <div class="stats-grid">
    ${statCard('Students', String(totals.students), 'Active across all campuses', 'graduation', 'green')}
    ${statCard('Staff', String(totals.staff), 'Active lecturers & administrators', 'users', '')}
    ${statCard('Pending approvals', String(totals.pending), 'All campuses', 'approvals', totals.pending ? 'amber' : '')}
    ${statCard('Hostel requests', String(totals.hostel), 'Awaiting campus review', 'bed', 'maroon')}
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Campus performance</h2><p class="card-sub">Enrolment, staffing, attendance and pending work</p></div><span class="chip chip-soft">${rows.length} campuses</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Campus</th><th>Students</th><th>Staff</th><th>Attendance</th><th>Pending approvals</th><th>Hostel requests</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td><strong>${esc(r.campus)}</strong></td><td>${r.students}</td><td>${r.staff}</td><td>${r.attendance}%${progress(r.attendance)}</td><td>${r.pending}</td><td>${r.hostelRequests}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>
  <p class="page-note">${icon('info')} Directorate accounts oversee every campus. Finance totals stay with the Finance Office and payment verification stays with campus administrations.</p>`;
}

function renderQuality(user) {
  if (!user || (user.role !== 'qa_officer' && !isExecRole(user.role))) return renderHome(user);
  const qa = DB.qualitySnapshot();
  return `${pageHead('Service quality', 'Quality assurance — teaching, assessment, attendance and service standards',
    `<a class="btn btn-ghost btn-sm" href="#/campuses">${icon('academics')} Campuses</a>`)}
  <div class="stats-grid">
    ${statCard('Attendance rate', qa.attendance + '%', `${qa.held} sessions recorded`, 'check', qa.attendance >= 75 ? 'green' : 'amber')}
    ${statCard('Results published', qa.published + '%', `${qa.publishedTotal} marks recorded`, 'chart', qa.published >= 80 ? 'green' : 'maroon')}
    ${statCard('Pending approvals', String(qa.pendingApprovals), 'Portal-wide', 'approvals', qa.pendingApprovals ? 'amber' : '')}
    ${statCard('Submissions to grade', String(qa.ungraded), 'Across all units', 'clipboard', qa.ungraded ? 'amber' : 'green')}
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>Quality indicators</h2><p class="card-sub">Benchmarks for a healthy campus service</p></div><span class="chip chip-soft">${esc(DB.data.meta.termLabel)}</span></div>
      <div class="qa-list">
        ${[
          ['Attendance above 75%', qa.attendance, qa.attendance >= 75],
          ['Results published above 80%', qa.published, qa.published >= 80],
          ['No ungraded submissions', qa.ungraded === 0 ? 100 : Math.max(0, 100 - qa.ungraded * 5), qa.ungraded === 0],
          ['Approvals up to date', qa.pendingApprovals === 0 ? 100 : 40, qa.pendingApprovals === 0]
        ].map(([label, pct, ok]) => `<div class="qa-row"><span>${esc(label)}</span>${progress(pct, ok ? 'green' : 'amber')}<strong>${pct}%</strong></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Campus comparison</h2><p class="card-sub">Attendance by campus</p></div></div>
      <div class="qa-list">${qa.campuses.map(c => `<div class="qa-row"><span>${esc(c.campus)}</span>${progress(c.attendance)}<strong>${c.attendance}%</strong></div>`).join('')}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Quality assurance role</h2><p class="card-sub">What this office does in the portal</p></div>${icon('shield')}</div>
    <div class="info-grid">
      <div class="info-card">${icon('checkCircle')}<div><strong>Attendance standards</strong><p>Monitor class sign-in rates per campus and flag units falling below the 75% benchmark.</p></div></div>
      <div class="info-card">${icon('chart')}<div><strong>Assessment timeliness</strong><p>Track how quickly lecturers publish results and clear ungraded submissions.</p></div></div>
      <div class="info-card">${icon('users')}<div><strong>Service responsiveness</strong><p>Review pending registrations, payment verification queues and hostel requests.</p></div></div>
    </div>
  </div>`;
}

function renderAnnouncements(user) {
  if (!user || !(isStaffRole(user.role) || user.role === 'council')) return renderHome(user);
  const canDelete = isAdminRole(user.role) && user.role !== 'owner';
  const notices = DB.data.notices.filter(n => n.type === 'announcement').slice().sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return `${pageHead(I18N.t('Announcements'), 'Notices for students, staff and the whole portal community',
    `<button type="button" class="btn btn-primary btn-sm" data-action="new-announcement">${icon('plus')} ${esc(I18N.t('Create announcement'))}</button>`)}
  ${notices.length ? `<div class="announcement-admin-list">${notices.map(n => { const author = DB.user(n.createdBy); return `<article class="announcement-admin-card ${n.pinned ? 'pinned' : ''}">
    <div class="announcement-admin-head">
      <div class="notification-icon">${icon('megaphone')}</div>
      <div><h3>${esc(n.title)}</h3><span class="notification-meta">${esc(author ? author.name : 'Portal')} · ${esc(fmtDate(n.createdAt, true))} · ${esc(audienceLabel(n.audience))}</span></div>
      ${n.pinned ? `<span class="pin-badge">${icon('pin')} ${esc(I18N.t('Pinned'))}</span>` : ''}
    </div>
    <p>${esc(n.message)}</p>
    <div class="announcement-foot">${canDelete ? `<button type="button" class="btn btn-danger-ghost btn-xs" data-action="announcement-delete" data-notice="${n.id}">${icon('trash')} ${esc(I18N.t('Delete'))}</button>` : `<span class="muted-text">Posted by ${esc(author ? roleLabel(author.role) : 'portal')}</span>`}</div>
  </article>`; }).join('')}</div>` : `<div class="card">${emptyState('megaphone', 'No announcements', 'Publish the first announcement for the portal.', `<button type="button" class="btn btn-primary" data-action="new-announcement">${icon('plus')} ${esc(I18N.t('Create announcement'))}</button>`)}</div>`}`;
}

/* ---------------- About ---------------- */

function publicContentHTML() {
  return `<div class="about-public">
    <div class="about-public-head">${logo('about-logo')}<div><span class="eyebrow">Tricent School of Medical Health Science & Technology</span><h2>Our purpose, mission & objectives</h2></div></div>
    <div class="about-triple">
      <div class="about-pillar"><span>${icon('arrow')}</span><h3>Purpose</h3><p>${esc(CONTENT.purpose)}</p></div>
      <div class="about-pillar"><span>${icon('graduation')}</span><h3>Mission</h3><p>${esc(CONTENT.mission)}</p></div>
      <div class="about-pillar"><span>${icon('eye')}</span><h3>Vision</h3><p>${esc(CONTENT.vision)}</p></div>
    </div>
    <h3 class="about-subhead">Our objectives</h3>
    <ul class="objective-list">${CONTENT.objectives.map(o => `<li>${icon('checkCircle')}<span>${esc(o)}</span></li>`).join('')}</ul>
    <div class="about-contact-mini"><strong>Portal support</strong><a href="mailto:${APP.supportEmail}">${APP.supportEmail}</a><a href="https://wa.me/254118000614" target="_blank" rel="noopener">WhatsApp ${APP.supportPhoneDisplay}</a></div>
  </div>`;
}

function renderAbout(user) {
  const depts = DEPARTMENTS;
  return `${pageHead(I18N.t('About'), 'Tricent School of Medical Health Science and Technology',
    `<button type="button" class="btn btn-ghost btn-sm" data-action="show-terms">${icon('shield')} ${esc(I18N.t('Terms of use'))}</button>`)}
  <div class="about-hero">
    <div class="about-brand">${logo('about-hero-logo')}<div><span class="eyebrow">TSMHST · ${esc(APP.domain)}</span><h1>Tricent School of Medical Health Science &amp; Technology</h1><p>${esc(CONTENT.about)}</p></div></div>
    <div class="about-hero-meta"><span>${icon('pin')} ${esc(APP.address)}</span><span>${icon('mail')} ${esc(APP.officeEmail)}</span><span>${icon('phone')} ${esc(APP.officePhoneDisplay)}</span><span>${icon('arrow')} ${esc(APP.domain)}</span></div>
  </div>
  <div class="about-triple wide">
    <div class="about-pillar"><span>${icon('arrow')}</span><h3>Purpose</h3><p>${esc(CONTENT.purpose)}</p></div>
    <div class="about-pillar"><span>${icon('graduation')}</span><h3>Mission</h3><p>${esc(CONTENT.mission)}</p></div>
    <div class="about-pillar"><span>${icon('eye')}</span><h3>Vision</h3><p>${esc(CONTENT.vision)}</p></div>
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><div><h2>Our objectives</h2><p class="card-sub">What the institution is working to achieve</p></div></div>
      <ul class="objective-list">${CONTENT.objectives.map(o => `<li>${icon('checkCircle')}<span>${esc(o)}</span></li>`).join('')}</ul>
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Core values</h2><p class="card-sub">How we work together</p></div></div>
      <div class="values-grid">${CONTENT.values.map(v => `<div class="value-item"><strong>${esc(v.name)}</strong><p>${esc(v.text)}</p></div>`).join('')}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>What is in the portal</h2><p class="card-sub">Everything students need in one place</p></div><span class="chip chip-soft">v${APP.version}</span></div>
    <div class="portal-contents">
      <div>${icon('book')}<strong>Unit registration</strong><span>Register or drop units when a new term starts.</span></div>
      <div>${icon('clipboard')}<strong>Assignments</strong><span>Receive work, submit and read lecturer feedback.</span></div>
      <div>${icon('chart')}<strong>Results & transcript</strong><span>Published marks, GPA and printable academic record.</span></div>
      <div>${icon('check')}<strong>Attendance</strong><span>Sign in to class with a live session code.</span></div>
      <div>${icon('wallet')}<strong>Fees & paybills</strong><span>Statements, M-Pesa paybills and payment verification.</span></div>
      <div>${icon('bed')}<strong>Hostel</strong><span>Room options, booking requests and the hostel Buy Goods till.</span></div>
      <div>${icon('users')}<strong>Admin & council presence</strong><span>See who is online and how to reach them.</span></div>
      <div>${icon('settings')}<strong>Personal settings</strong><span>Theme, font, languages, notifications and permissions.</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h2>Programmes & courses</h2><p class="card-sub">All ${COURSES.length} courses in the prospectus · durations in terms unless stated</p></div></div>
    <div class="toolbar">
      <label class="search-field">${icon('search')}<input id="course-search" type="search" placeholder="Search courses, exam body or department" aria-label="Search courses"></label>
      <div class="filter-row" data-course-filters>
        <button type="button" class="chip active" data-action="course-filter" data-dept="all">All</button>
        ${depts.map(d => `<button type="button" class="chip" data-action="course-filter" data-dept="${esc(d)}">${esc(d.replace('Department of ', ''))}</button>`).join('')}
      </div>
    </div>
    ${depts.map(dept => {
      const rows = COURSES.filter(c => c.dept === dept);
      return `<details class="course-group" data-course-group="${esc(dept)}" open>
        <summary><span>${esc(dept)}</span><span class="chip chip-soft">${rows.length} courses</span></summary>
        <div class="table-wrap"><table class="data-table course-table"><thead><tr><th>Course</th><th>Duration</th><th>Min. grade</th><th>Exam body</th></tr></thead>
          <tbody>${rows.map(c => `<tr data-course-row data-course-dept="${esc(dept)}" data-course-name="${esc((c.name + ' ' + c.body + ' ' + dept).toLowerCase())}"><td><strong>${esc(c.name)}</strong></td><td>${esc(c.duration)}</td><td>${esc(c.grade)}</td><td><span class="tag">${esc(c.body)}</span></td></tr>`).join('')}</tbody>
        </table></div>
      </details>`;
    }).join('')}
    <p class="page-note">${icon('info')} Course information is taken from the school prospectus. Confirm current fees and intake details with admissions.</p>
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-head"><div><h2>Examining bodies</h2><p class="card-sub">Recognised national & international certification</p></div></div>
      <div class="exam-grid small">${EXAM_BODIES.map(([name, desc]) => `<div class="exam-item"><strong>${esc(name)}</strong><span>${esc(desc)}</span></div>`).join('')}</div>
    </div>
    <div class="card"><div class="card-head"><div><h2>Admissions & intakes</h2><p class="card-sub">Join the next cohort</p></div></div>
      <div class="admission-block"><strong>Intakes</strong><span>${esc(CONTENT.intakes)}</span></div>
      <div class="admission-block"><strong>Modes of study</strong><span>${CONTENT.modes.map(m => esc(m)).join(' · ')}</span></div>
      <div class="admission-block"><strong>Requirements</strong><ul class="plain-list">${CONTENT.requirements.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
      <div class="contact-lines"><a href="tel:${APP.officePhoneTel}">${icon('phone')} ${esc(APP.officePhoneDisplay)}</a><a href="mailto:${esc(APP.officeEmail)}">${icon('mail')} ${esc(APP.officeEmail)}</a><a href="${APP.websiteUrl}" target="_blank" rel="noopener">${icon('arrow')} ${esc(APP.domain)}</a></div>
    </div>
  </div>
  <div class="card contact-card">
    <div class="card-head"><div><h2>Contact the school</h2><p class="card-sub">Admissions, official records and general enquiries</p></div></div>
    <div class="contact-grid">
      <div><span>${icon('phone')}</span><strong>Customer care</strong><a href="tel:${APP.officePhoneTel}">${esc(APP.officePhoneDisplay)}</a><small>All campuses</small></div>
      <div><span>${icon('mail')}</span><strong>Email</strong><a href="mailto:${esc(APP.officeEmail)}">${esc(APP.officeEmail)}</a><small>Admissions & general enquiries</small></div>
      <div><span>${icon('arrow')}</span><strong>Website</strong><a href="${APP.websiteUrl}" target="_blank" rel="noopener">${esc(APP.domain)}</a><small>Official college website</small></div>
      <div><span>${icon('pin')}</span><strong>Postal address</strong><span>${esc(APP.address)}</span><small>Official correspondence</small></div>
      <div><span>${icon('chat')}</span><strong>Portal support</strong><a href="mailto:${esc(APP.supportEmail)}">${esc(APP.supportEmail)}</a><a href="https://wa.me/254118000614" target="_blank" rel="noopener">${esc(APP.supportPhoneDisplay)}</a></div>
    </div>
    <div class="campus-grid">${[['Nairobi', '+254 700 129 536'], ['Juja', '+254 700 000 760'], ['Thika', '+254 700 000 292'], ['Homabay', '+254 700 000 506'], ['Kisumu', '+254 700 000 272'], ['Migori Office', '+254 114 569 011']].map(([c, p]) => `<div class="campus-item"><strong>${c}</strong><a href="tel:${p.replace(/ /g, '')}">${p}</a></div>`).join('')}</div>
  </div>`;
}

/* ---------------- Settings ---------------- */

function permissionBadge(status) {
  const map = { granted: ['success', 'Granted'], denied: ['danger', 'Denied'], prompt: ['warn', 'Prompt'], off: ['neutral', 'Off'], unsupported: ['neutral', 'Unavailable'] };
  const item = map[status] || map.prompt;
  return `<span class="badge badge-${item[0]}">${esc(item[1])}</span>`;
}

function renderSettings(user) {
  const settings = DB.settings(user);
  const notificationsPermission = ('Notification' in window) ? Notification.permission : 'unsupported';
  const currentLanguage = LANGUAGES.find(l => l.code === settings.lang) || LANGUAGES.find(l => l.code === 'en');
  const coverage = I18N.coverage(settings.lang);
  const feedback = DB.feedbackFor(user.id);
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const permissionStatus = settings.permissionStatus || {};
  const ownerPending = user.role === 'owner' ? DB.pendingUsersFor(user) : [];
  return `${pageHead(I18N.t('Settings'), user.role === 'owner' ? 'System owner — application settings and account approvals' : 'Personalise the portal and manage your account')}
  ${user.role === 'owner' ? `<section class="card settings-card span-two owner-approvals">
    <div class="card-head"><div><h2>Accounts awaiting owner approval</h2><p class="card-sub">College principals and the director are approved here</p></div><span class="badge ${ownerPending.length ? 'badge-warn' : 'badge-success'}">${ownerPending.length}</span></div>
    ${ownerPending.length ? `<div class="approval-list">${ownerPending.map(u => `<article class="approval-card">
      <div class="approval-head"><div class="approval-person">${avatar(u)}<div><strong>${esc(u.name)}</strong><span>${esc(roleLabel(u.role))} · registered ${esc(fmtDate(u.createdAt))}</span></div></div>${statusBadge('pending')}</div>
      <div class="approval-details">
        ${u.staffNo ? detailRow('Staff number', esc(u.staffNo)) : ''}
        ${u.campus ? detailRow('Campus', esc(u.campus)) : ''}
        ${detailRow('Email', `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>`)}
        ${detailRow('Phone', esc(u.phone || '—'))}
      </div>
      <div class="approval-actions">
        <button type="button" class="btn btn-danger-ghost btn-sm" data-action="approval-reject" data-user="${u.id}">${icon('x')} ${esc(I18N.t('Reject'))}</button>
        <button type="button" class="btn btn-primary btn-sm" data-action="approval-approve" data-user="${u.id}">${icon('check')} ${esc(I18N.t('Approve user'))}</button>
      </div>
    </article>`).join('')}</div>` : `<div class="inline-success">${icon('checkCircle')} No principal or director accounts are waiting for approval.</div>`}
    <p class="setting-note">The owner account only manages application settings and approves principals and the director. Student, staff and academic data stay with the offices responsible for them.</p>
  </section>` : ''}
  <div class="settings-grid">
    <section class="card settings-card">
      <div class="card-head"><div><h2>${esc(I18N.t('Appearance'))}</h2><p class="card-sub">${esc(I18N.t('Theme and display'))}</p></div>${icon('sun')}</div>
      <div class="setting-block">
        <div class="setting-label"><strong>${esc(I18N.t('Theme'))}</strong><span>System default, light or dark mode</span></div>
        <div class="segmented three">
          <button type="button" class="segment ${settings.theme === 'system' ? 'active' : ''}" data-action="set-theme" data-theme="system">${icon('monitor')} ${esc(I18N.t('System default'))}</button>
          <button type="button" class="segment ${settings.theme === 'light' ? 'active' : ''}" data-action="set-theme" data-theme="light">${icon('sun')} ${esc(I18N.t('Light mode'))}</button>
          <button type="button" class="segment ${settings.theme === 'dark' ? 'active' : ''}" data-action="set-theme" data-theme="dark">${icon('moon')} ${esc(I18N.t('Dark mode'))}</button>
        </div>
      </div>
      <div class="setting-block">
        <div class="setting-label"><strong>${esc(I18N.t('Font size'))}</strong><span>Adjust text size across the portal</span></div>
        <div class="segmented three">
          <button type="button" class="segment ${settings.font === 'small' ? 'active' : ''}" data-action="set-font" data-font="small"><span class="font-sample small">A</span> ${esc(I18N.t('Small'))}</button>
          <button type="button" class="segment ${settings.font === 'medium' ? 'active' : ''}" data-action="set-font" data-font="medium"><span class="font-sample medium">A</span> ${esc(I18N.t('Medium'))}</button>
          <button type="button" class="segment ${settings.font === 'large' ? 'active' : ''}" data-action="set-font" data-font="large"><span class="font-sample large">A</span> ${esc(I18N.t('Large'))}</button>
        </div>
      </div>
      <div class="setting-block">
        <div class="setting-label"><strong>${esc(I18N.t('Language'))}</strong><span>${esc(currentLanguage.name)} (${esc(currentLanguage.native)}) · ${LANGUAGES.length} languages available</span></div>
        <button type="button" class="language-row" data-action="open-language">
          <span class="lang-code">${esc(settings.lang.toUpperCase())}</span>
          <span class="lang-copy"><strong>${esc(currentLanguage.native)}</strong><small>${esc(currentLanguage.name)} · ${esc(coverage === 'full' ? I18N.t('Full translation') : coverage === 'partial' ? I18N.t('Partial translation') : I18N.t('English fallback'))}</small></span>
          ${icon('chevron')}
        </button>
        <p class="setting-note">English and Kiswahili have hand-written interface translations. Every other ISO 639-1 language is available in the picker and falls back to English for strings that are not yet translated.</p>
      </div>
    </section>

    <section class="card settings-card">
      <div class="card-head"><div><h2>${esc(I18N.t('Notifications'))}</h2><p class="card-sub">Stay up to date</p></div>${icon('bell')}</div>
      <div class="setting-row">
        <div class="setting-label"><strong>Portal notifications</strong><span>Announcements, results, payment and hostel updates</span></div>
        <div class="setting-control">${permissionBadge(notificationsPermission === 'default' ? 'prompt' : notificationsPermission)}${switchControl('notifications', settings.notifications, `data-setting="notifications"`)}</div>
      </div>
      <div class="setting-row">
        <div class="setting-label"><strong>Browser alerts</strong><span>${notificationsPermission === 'granted' ? 'Allowed on this device' : notificationsPermission === 'denied' ? 'Blocked in browser settings' : 'Permission will be requested when enabled'}</span></div>
        <span class="muted-text">${notificationsPermission === 'unsupported' ? 'Not supported in this browser' : notificationsPermission}</span>
      </div>
      <div class="divider"></div>
      <div class="card-head compact-head"><div><h2>${esc(I18N.t('Permissions'))}</h2><p class="card-sub">Device access used by portal features</p></div>${icon('shield')}</div>
      ${[
        { key: 'location', title: I18N.t('Location'), desc: 'Campus check-in and location-aware notices', icon: 'pin' },
        { key: 'camera', title: I18N.t('Camera'), desc: 'Profile photo and evidence uploads', icon: 'camera' },
        { key: 'microphone', title: I18N.t('Microphone'), desc: 'Voice notes and online classes', icon: 'mic' }
      ].map(p => `<div class="setting-row">
        <div class="setting-label"><strong>${esc(p.title)}</strong><span>${esc(p.desc)}</span></div>
        <div class="setting-control">${permissionBadge(settings.permissions[p.key] ? (permissionStatus[p.key] || 'granted') : 'off')}${switchControl(p.key, !!settings.permissions[p.key], `data-permission="${p.key}"`)}</div>
      </div>`).join('')}
      <p class="setting-note">You can revoke browser-level permissions at any time in your device or browser settings. Turning a switch off stops the portal from using the feature but does not remove a permission already granted to the browser.</p>
    </section>

    <section class="card settings-card">
      <div class="card-head"><div><h2>${esc(I18N.t('About the app'))}</h2><p class="card-sub">TSMHST Portal</p></div>${icon('info')}</div>
      <div class="detail-list">
        ${detailRow(I18N.t('Version'), `v${APP.version}`)}
        ${detailRow('Build', esc(APP.build))}
        ${detailRow('Installation', installed ? `<span class="badge badge-success">${esc(I18N.t('Installed'))}</span>` : `<button type="button" class="btn btn-ghost btn-xs" data-action="install-app">${icon('download')} ${esc(I18N.t('Install app'))}</button>`)}
        ${detailRow('Platform', esc(navigator.platform || 'Web'))}
      </div>
      <div class="setting-actions">
        <button type="button" class="list-action" data-action="open-rating">${icon('star')}<span><strong>${esc(I18N.t('Rate this app'))}</strong><small>${feedback ? 'Your rating: ' + feedback.stars + '/5 — tap to update' : 'Tell us how the portal is working for you'}</small></span>${stars(feedback ? feedback.stars : 0)}</button>
        <a class="list-action" href="#/notifications">${icon('bell')}<span><strong>${esc(I18N.t('Notifications'))}</strong><small>Announcements and personal updates</small></span>${icon('chevron')}</a>
        <button type="button" class="list-action" data-action="show-terms">${icon('shield')}<span><strong>${esc(I18N.t('Terms of use'))}</strong><small>User agreement and data protection</small></span>${icon('chevron')}</button>
      </div>
    </section>

    <section class="card settings-card">
      <div class="card-head"><div><h2>${esc(I18N.t('Get help'))}</h2><p class="card-sub">We are here to support you</p></div>${icon('help')}</div>
      <div class="help-grid">
        <a class="help-card" href="mailto:${APP.supportEmail}">${icon('mail')}<span><strong>${esc(I18N.t('Email support'))}</strong><small>${esc(APP.supportEmail)}</small></span>${icon('chevron')}</a>
        <a class="help-card" href="https://wa.me/254118000614" target="_blank" rel="noopener">${icon('chat')}<span><strong>${esc(I18N.t('WhatsApp support'))}</strong><small>${esc(APP.supportPhoneDisplay)}</small></span>${icon('chevron')}</a>
        <a class="help-card" href="tel:+254118000614">${icon('phone')}<span><strong>${esc(I18N.t('Call support'))}</strong><small>${esc(APP.supportPhoneDisplay)}</small></span>${icon('chevron')}</a>
        <a class="help-card" href="mailto:${esc(APP.officeEmail)}">${icon('graduation')}<span><strong>Admissions office</strong><small>${esc(APP.officeEmail)}</small></span>${icon('chevron')}</a>
      </div>
      <p class="setting-note">College customer care: ${esc(APP.officePhoneDisplay)} · ${esc(APP.officeEmail)} · ${esc(APP.domain)} · ${esc(APP.address)}. Portal support: ${esc(APP.supportEmail)} · WhatsApp ${esc(APP.supportPhoneDisplay)}. For official academic records contact the Registrar.</p>
    </section>

    <section class="card settings-card span-two">
      <div class="card-head"><div><h2>${esc(I18N.t('Account'))}</h2><p class="card-sub">Your profile and sign-in details</p></div><button type="button" class="btn btn-ghost btn-sm" data-action="edit-profile">${icon('user')} Edit profile</button></div>
      <div class="account-strip">
        ${avatar(user)}
        <div class="account-copy"><strong>${esc(user.name)}</strong><span>${esc(roleLabel(user.role))} · ${esc(user.admissionNo || user.staffNo || user.email)}</span><small>${esc(user.email)}${user.phone ? ' · ' + esc(user.phone) : ''}</small></div>
        <div class="account-meta">${user.programme ? `<span>${esc(programmeFor(user.programme).name)}</span>` : user.department ? `<span>${esc(user.department)}</span>` : ''}<span>${esc(user.campus || '')}</span></div>
      </div>
      <div class="account-actions">
        <button type="button" class="btn btn-danger-ghost" data-action="logout">${icon('logout')} ${esc(I18N.t('Sign out of portal'))}</button>
        <span class="muted-text">Signed in on this browser tab only.</span>
      </div>
    </section>
  </div>
  <p class="version-footer">${esc(APP.name)} v${APP.version} · ${esc(APP.build)} · ${esc(APP.school)}</p>`;
}
