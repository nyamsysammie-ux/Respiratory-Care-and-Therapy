/* TSMHST Portal — shared UI helpers */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 12h.01"/><path d="M3 7v10a2 2 0 0 0 2 2h15"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/><path d="M6 12h6a2 2 0 0 1 2 2v3"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13A4 4 0 0 1 19 7a4 4 0 0 1-3 3.87"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  approvals: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  academics: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
  finance: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  marks: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 19v3M8 22h8"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  wifiOff: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.5"/><path d="M22 8.8a15 15 0 0 0-9.2-2.7"/><path d="M5 12.6a10 10 0 0 1 3.2-1.6"/><path d="M18.8 12.4a10 10 0 0 0-2.8-1.2"/><path d="M12 20h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bookOpen: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
  graduation: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
  filter: '<path d="M4 4h16l-6 8v6l-4 2v-8Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/>'
};

function icon(name, cls) {
  const body = ICONS[name] || ICONS.info;
  return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

function avatar(user, size) {
  const role = user && user.role ? user.role : 'student';
  return `<span class="avatar avatar-${role} ${size || ''}" title="${esc(user ? user.name : '')}">${esc(initials(user ? user.name : '?'))}</span>`;
}

function money(n) {
  return 'Ksh. ' + Number(n || 0).toLocaleString('en-KE');
}

function fmtDate(value, withTime) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return esc(value);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('en-GB', opts);
}

function fmtShort(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function relative(value) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'Just now';
  if (mins > 0) {
    if (mins < 60) return mins + ' min ago';
    if (mins < 1440) return Math.round(mins / 60) + ' h ago';
    return Math.round(mins / 1440) + ' d ago';
  }
  const ahead = Math.abs(mins);
  if (ahead < 60) return 'in ' + ahead + ' min';
  if (ahead < 1440) return 'in ' + Math.round(ahead / 60) + ' h';
  return 'in ' + Math.round(ahead / 1440) + ' d';
}

function dueInfo(dueAt) {
  const diff = new Date(dueAt).getTime() - Date.now();
  const days = Math.ceil(diff / DAY);
  if (diff < 0) return { overdue: true, label: 'Overdue by ' + Math.abs(days) + ' day' + (Math.abs(days) === 1 ? '' : 's') };
  if (days <= 1) return { overdue: false, label: 'Due ' + (days === 0 ? 'today' : 'tomorrow') };
  return { overdue: false, label: 'Due in ' + days + ' days' };
}

function statusBadge(status) {
  const map = {
    active: ['success', 'Active'], pending: ['warn', 'Pending'], rejected: ['danger', 'Rejected'], suspended: ['danger', 'Suspended'],
    verified: ['success', 'Verified'], paid: ['success', 'Paid'], approved: ['success', 'Approved'], published: ['success', 'Published'],
    open: ['success', 'Open'], closed: ['neutral', 'Closed'], graded: ['info', 'Graded'], submitted: ['info', 'Submitted'],
    due: ['warn', 'Due'], overdue: ['danger', 'Overdue'], unpaid: ['warn', 'Unpaid'], unpaid_balance: ['warn', 'Unpaid'],
    draft: ['neutral', 'Draft'], unpublish: ['neutral', 'Unpublished'], unpublished: ['neutral', 'Unpublished'],
    present: ['success', 'Present'], absent: ['danger', 'Absent'], online: ['success', 'Online'], offline: ['neutral', 'Offline']
  };
  const item = map[status] || ['neutral', status];
  return `<span class="badge badge-${item[0]}">${esc(I18N.t(item[1]))}</span>`;
}

function statCard(label, value, hint, iconName, tone) {
  return `<div class="stat-card ${tone || ''}">
    <div class="stat-icon">${icon(iconName || 'chart')}</div>
    <div class="stat-copy"><span class="stat-label">${esc(label)}</span><strong class="stat-value">${value}</strong>${hint ? `<span class="stat-hint">${hint}</span>` : ''}</div>
  </div>`;
}

function pageHead(title, subtitle, actions) {
  return `<div class="page-head">
    <div><h1>${esc(title)}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </div>`;
}

function emptyState(iconName, title, text, action) {
  return `<div class="empty-state">
    <div class="empty-icon">${icon(iconName || 'info')}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text || '')}</p>
    ${action || ''}
  </div>`;
}

function progress(value, tone) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="progress ${tone || ''}"><span style="width:${pct}%"></span></div>`;
}

function stars(value, interactive) {
  const filled = Math.round(Number(value) || 0);
  return `<span class="stars ${interactive ? 'interactive' : ''}">${[1, 2, 3, 4, 5].map(i =>
    interactive
      ? `<button type="button" class="star ${i <= filled ? 'on' : ''}" data-star="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">${icon('star')}</button>`
      : `<span class="star ${i <= filled ? 'on' : ''}" aria-hidden="true">${icon('star')}</span>`
  ).join('')}</span>`;
}

function modal(title, body, opts) {
  opts = opts || {};
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop">
    <div class="modal ${opts.size || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="modal-body">${body}</div>
    </div>
  </div>`;
  document.body.classList.add('modal-open');
  root.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));
  const backdrop = root.querySelector('.modal-backdrop');
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', escClose);
  setTimeout(() => {
    const input = root.querySelector('input, textarea, select, button:not([data-close])');
    if (input) input.focus({ preventScroll: true });
  }, 50);
}

function escClose(e) { if (e.key === 'Escape') closeModal(); }

function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', escClose);
}

function toast(message, type) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'success');
  el.innerHTML = `<span class="toast-icon">${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle')}</span><span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => el.classList.add('show'), 20);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 3800);
}

function confirmDialog(opts) {
  return new Promise(resolve => {
    modal(opts.title || 'Please confirm', `<p class="confirm-text">${esc(opts.message || '')}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-confirm-cancel>${esc(opts.cancelText || I18N.t('Cancel'))}</button>
        <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-confirm-ok>${esc(opts.confirmText || I18N.t('Approve'))}</button>
      </div>`);
    const root = document.getElementById('modal-root');
    root.querySelector('[data-confirm-cancel]').addEventListener('click', () => { closeModal(); resolve(false); });
    root.querySelector('[data-confirm-ok]').addEventListener('click', () => { closeModal(); resolve(true); });
  });
}

function copyText(text) {
  const done = () => toast(I18N.t('Copied') + ': ' + text, 'info');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy. Please select the text manually.', 'error'); }
  ta.remove();
}

function roleLabel(role) {
  return I18N.t(role === 'admin' ? 'Administrator' : role === 'council' ? 'Student Council' : role === 'lecturer' ? 'Lecturer' : 'Student');
}

function logo(size) {
  return `<img class="brand-logo ${size || ''}" src="assets/logo.jpeg" alt="TSMHST logo">`;
}

function switchControl(name, checked, attrs) {
  return `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} ${attrs || ''}><span class="switch-track"><span class="switch-thumb"></span></span></label>`;
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${esc(label)}</span><strong>${value}</strong></div>`;
}
