/* TSMHST Portal — institution content and seed reference data */
const APP = {
  name: 'TSMHST Portal',
  school: 'Tricent School of Medical Health Science and Technology',
  short: 'TSMHST',
  version: '1.5.0',
  build: '13 November 2026',
  domain: 'www.tsmhst.ac.ke',
  websiteUrl: 'https://www.tsmhst.ac.ke',
  supportEmail: 'SammieNyamsy@gmail.com',
  supportPhone: '+254118000614',
  supportPhoneDisplay: '+254 118 000 614',
  officeEmail: 'info@tsmhst.ac.ke',
  officePhone: '0112970334',
  officePhoneDisplay: '0112 970 334',
  officePhoneTel: '+254112970334',
  address: 'P.O. Box 3823-00200, Nairobi, Kenya'
};

const CONTENT = {
  about: 'Tricent School of Medical Health Science and Technology (TSMHST) is a specialist training institution dedicated to producing skilled health professionals, technologists and business specialists for Kenya and beyond. Programmes are examined by KNEC, TVET CDACC, ABMA (UK), NASCOP, KASNEB and ACCA.',
  purpose: 'To train competent, ethical and employable health and business professionals who improve lives in their communities, while widening access to practical, affordable and accredited education.',
  mission: 'To provide quality, accessible and practical education in medical, health, applied, social and business sciences through competent staff, modern learning resources, industry partnerships and a learner-centred environment.',
  vision: 'To be a leading centre of excellence in health sciences and applied training, recognised for producing skilled, compassionate and innovative professionals.',
  objectives: [
    'Deliver accredited, competency-based programmes in medical, health, applied, social and business sciences.',
    'Equip learners with practical skills through laboratories, workshops, clinical exposure and attachment.',
    'Promote research, innovation, digital literacy and lifelong learning among students and staff.',
    'Instil professional ethics, integrity and compassionate service in every graduate.',
    'Widen access to training through flexible study modes and a network of campuses.',
    'Work with examining bodies, employers and communities to keep training relevant and responsive.'
  ],
  values: [
    { name: 'Integrity', text: 'We uphold honesty, fairness and accountability in all that we do.' },
    { name: 'Excellence', text: 'We pursue high standards in teaching, assessment and service.' },
    { name: 'Compassion', text: 'We put the wellbeing of our learners and communities first.' },
    { name: 'Innovation', text: 'We embrace practical solutions, technology and continuous improvement.' },
    { name: 'Inclusivity', text: 'We create opportunities for learners from all backgrounds.' }
  ],
  intakes: 'January · May · September',
  modes: ['Full Time', 'Distance Learning', 'Online Learning'],
  requirements: ['Application letter', 'Copies of academic certificates', 'Registration fee: Ksh. 1,000'],
  terms: [
    { title: '1. Acceptance of terms', text: 'By creating an account or signing in to the TSMHST Portal you agree to these User Agreement Terms and to the policies of Tricent School of Medical Health Science and Technology. If you do not agree, do not use the portal.' },
    { title: '2. Accounts and eligibility', text: 'The portal is for registered students, lecturers, student council members and authorised administrators. New student and lecturer accounts are activated after review by the administration. You must provide accurate details, keep your password private and never share your account. You are responsible for activity carried out under your account.' },
    { title: '3. Acceptable use', text: 'Use the portal only for lawful academic and institutional purposes. You must not attempt to access another person’s records, disrupt the service, upload malicious content, impersonate any person, or use attendance codes on behalf of another student. Misuse may lead to suspension and disciplinary action.' },
    { title: '4. Academic records', text: 'Marks, results and transcripts are prepared by authorised academic staff. Published results are provisional until confirmed by the Registrar. Transcripts printed from the portal are unofficial unless signed and stamped by the institution. Queries about marks should be raised through the Registrar within the stated period.' },
    { title: '5. Fees and payments', text: 'Fee statements and balances shown in the portal are for guidance. Pay fees through the official M-Pesa Pay Bill 4018437, using K- followed by your full name as the account number (for example K-Alex Mwangi). Hostel accommodation is paid through the official M-Pesa Buy Goods till 5210783; no account number is required for Buy Goods. Always keep your M-Pesa confirmation code. A payment is only confirmed after the finance office verifies the transaction reference.' },
    { title: '6. Attendance', text: 'Class sign-in codes are issued by lecturers during a live session. Signing in for another student, sharing a code publicly or falsifying attendance is an academic offence. Lecturers may close a session at any time and correct attendance records.' },
    { title: '7. Privacy and data', text: 'The portal displays only the information needed for academic and administrative purposes. Personal data is handled in line with the institution’s data protection obligations. This demonstration copy stores data locally on your device; a production deployment must use a secure server, access controls and appropriate retention policies.' },
    { title: '8. Notifications and device permissions', text: 'You may enable or disable notifications, location, camera and microphone in Settings. The portal requests device permissions only when you enable the related feature. You can revoke browser-level permissions at any time in your device or browser settings.' },
    { title: '9. Intellectual property', text: 'Course materials, institutional branding, the portal design and its content remain the property of TSMHST or their respective owners. You may download your own academic records for personal use. Commercial copying or redistribution is not permitted.' },
    { title: '10. Availability and liability', text: 'The portal is provided on an “as available” basis. The institution aims for reliable service but does not guarantee uninterrupted access. To the extent permitted by law, TSMHST is not liable for loss arising from network failures, device problems or unauthorised access caused by poor password practice.' },
    { title: '11. Changes to these terms', text: 'These terms may be updated as the portal develops. Material changes will be announced in the portal. Continued use after an update means you accept the revised terms.' },
    { title: '12. Contact', text: 'For portal support contact ' + APP.supportEmail + ' or WhatsApp ' + APP.supportPhoneDisplay + '. For admissions and official academic matters contact ' + APP.officeEmail + ', call customer care on ' + APP.officePhone + ' or visit ' + APP.domain + '. Postal address: ' + APP.address + '.' }
  ]
};

const DEPARTMENTS = [
  'Department of Health Sciences',
  'Department of Social Sciences',
  'Department of Applied Science',
  'Department of Business & Information'
];

const COURSES = [
  { dept: 'Department of Health Sciences', name: 'Ophthalmic Technology', duration: '6', grade: 'C', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Orthopedic and Trauma Medicine', duration: '9', grade: 'C', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Perioperative Theater Technology Level 6', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Mortuary Science', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Nutrition and Dietetics', duration: '6', grade: 'C-', body: 'KNEC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Health Records & IT', duration: '9', grade: 'C', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Homecare Management', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Community Health Level 6', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Community Health Assistant Officer', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Community Health & HIV/AIDS Management', duration: '6', grade: 'C-', body: 'ABMA (UK)' },
  { dept: 'Department of Health Sciences', name: 'Diploma in Environmental Sciences', duration: '6', grade: 'C', body: 'KNEC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Orthopedic and Trauma Medicine', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Perioperative Theater Technology Level 5', duration: '3', grade: 'D+', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Nutrition and Dietetics', duration: '4', grade: 'D', body: 'KNEC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Mortuary Science', duration: '3', grade: 'D', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Health Services Supports', duration: '3', grade: 'D', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Caregiver Level 4', duration: '6 Months', grade: 'D-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Health Records & IT', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Community Health Level 5', duration: '3', grade: 'D', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Community Health Level 4', duration: '3', grade: 'D-', body: 'TVET CDACC' },
  { dept: 'Department of Health Sciences', name: 'Certificate in HIV Counseling & Testing', duration: '3 Weeks', grade: '—', body: 'NASCOP' },
  { dept: 'Department of Health Sciences', name: 'Certificate in Homecare Management', duration: '3', grade: 'D', body: 'TVET CDACC' },
  { dept: 'Department of Social Sciences', name: 'Diploma in Community Development & Social Work', duration: '3', grade: 'C-', body: 'KNEC' },
  { dept: 'Department of Social Sciences', name: 'Diploma in Counseling Psychology', duration: '6', grade: 'C-', body: 'TVET CDACC' },
  { dept: 'Department of Social Sciences', name: 'Diploma in Community Health Development', duration: '6', grade: 'C-', body: 'KNEC' },
  { dept: 'Department of Social Sciences', name: 'Certificate in Community Development & Social Work', duration: '3', grade: 'D', body: 'KNEC' },
  { dept: 'Department of Social Sciences', name: 'Certificate in Community Health and Development', duration: '3', grade: 'D', body: 'KNEC' },
  { dept: 'Department of Social Sciences', name: 'Certificate in Counseling Psychology', duration: '3', grade: 'D+', body: 'TVET CDACC' },
  { dept: 'Department of Applied Science', name: 'Diploma in Medical Engineering', duration: '9', grade: 'C / C', body: 'TVET CDACC / KNEC' },
  { dept: 'Department of Applied Science', name: 'Diploma in Applied Biology', duration: '6', grade: 'C-', body: 'KNEC' },
  { dept: 'Department of Applied Science', name: 'Certificate in Biomedical Engineering', duration: '6', grade: 'D+', body: 'TVET CDACC' },
  { dept: 'Department of Applied Science', name: 'Certificate in Science Laboratory', duration: '6', grade: 'D+', body: 'KNEC' },
  { dept: 'Department of Applied Science', name: 'Bridging per subject', duration: '3 Months', grade: 'C- / D+', body: 'KNEC' },
  { dept: 'Department of Business & Information', name: 'Diploma/Certificate in Disaster Management/Public Administration', duration: '6 / 3', grade: 'C / D-', body: 'KNEC' },
  { dept: 'Department of Business & Information', name: 'Diploma/Certificate in Project Management/Public Relations', duration: '6 / 3', grade: 'C- / D+', body: 'KNEC' },
  { dept: 'Department of Business & Information', name: 'Diploma in Business Management/Human Resource Management', duration: '6 / 3', grade: 'C- / D+', body: 'KNEC / ABMA (UK)' },
  { dept: 'Department of Business & Information', name: 'Diploma/Certificate in Information & Communication Technology', duration: '6 / 3', grade: 'C / D+', body: 'KNEC' },
  { dept: 'Department of Business & Information', name: 'Diploma/Certificate in Personnel Management/Purchasing & Supplies', duration: '6 / 3', grade: 'C- / D+', body: 'KNEC / ABMA' },
  { dept: 'Department of Business & Information', name: 'Diploma/Certificate in Computer Engineering, Information Systems', duration: '6 / 3', grade: 'C / D+', body: 'KNEC / ABMA (UK)' },
  { dept: 'Department of Business & Information', name: 'Accounts / Graphic Design', duration: '2 / 3', grade: 'D+', body: 'ACCA / KASNEB / KNEC' }
];

const EXAM_BODIES = [
  ['KNEC', 'Kenya National Examinations Council'],
  ['TVET CDACC', 'TVET Curriculum Development, Assessment & Certification Council'],
  ['ABMA (UK)', 'ABMA Education, United Kingdom'],
  ['NASCOP', 'National AIDS & STIs Control Programme'],
  ['KASNEB', 'Kenya Accountants and Secretaries National Examinations Board'],
  ['ACCA', 'Association of Chartered Certified Accountants']
];

function programmeFee(tuition, examination) {
  return { tuition, examination, library: 700, activity: 800 };
}

const PORTAL_PROGRAMMES = [
  // Department of Health Sciences
  { code: 'OPT6', name: 'Ophthalmic Technology', short: 'Ophthalmic Technology', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(18000, 2500) },
  { code: 'DOT9', name: 'Diploma in Orthopedic and Trauma Medicine', short: 'Orthopedic & Trauma Medicine', dept: 'Department of Health Sciences', duration: '9 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(20000, 2500) },
  { code: 'DPT6', name: 'Diploma in Perioperative Theater Technology Level 6', short: 'Perioperative Theater Technology', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(21000, 2500) },
  { code: 'DMS6', name: 'Diploma in Mortuary Science', short: 'Mortuary Science', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(19000, 2500) },
  { code: 'DND6', name: 'Diploma in Nutrition and Dietetics', short: 'Nutrition & Dietetics', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'KNEC', level: 'Diploma', fee: programmeFee(20000, 2500) },
  { code: 'DHR9', name: 'Diploma in Health Records & IT', short: 'Health Records & IT', dept: 'Department of Health Sciences', duration: '9 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(19000, 2500) },
  { code: 'DHM6', name: 'Diploma in Homecare Management', short: 'Homecare Management', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(18000, 2500) },
  { code: 'DCH6', name: 'Diploma in Community Health Level 6', short: 'Community Health', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(18000, 2500) },
  { code: 'DCA6', name: 'Diploma in Community Health Assistant Officer', short: 'Community Health Assistant', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(18000, 2500) },
  { code: 'DHA6', name: 'Diploma in Community Health & HIV/AIDS Management', short: 'Community Health & HIV/AIDS', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'ABMA (UK)', level: 'Diploma', fee: programmeFee(18000, 2500) },
  { code: 'DES6', name: 'Diploma in Environmental Sciences', short: 'Environmental Sciences', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'KNEC', level: 'Diploma', fee: programmeFee(20000, 2500) },
  { code: 'COT6', name: 'Certificate in Orthopedic and Trauma Medicine', short: 'Orthopedic & Trauma Medicine', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(15000, 2000) },
  { code: 'CPT5', name: 'Certificate in Perioperative Theater Technology Level 5', short: 'Perioperative Theater Technology', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(14000, 2000) },
  { code: 'CND4', name: 'Certificate in Nutrition and Dietetics', short: 'Nutrition & Dietetics', dept: 'Department of Health Sciences', duration: '4 terms', examBody: 'KNEC', level: 'Certificate', fee: programmeFee(14000, 2000) },
  { code: 'CMS3', name: 'Certificate in Mortuary Science', short: 'Mortuary Science', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(14000, 2000) },
  { code: 'CHS3', name: 'Certificate in Health Services Supports', short: 'Health Services Supports', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(13000, 2000) },
  { code: 'CGV4', name: 'Caregiver Level 4', short: 'Caregiver', dept: 'Department of Health Sciences', duration: '6 months', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(12000, 2000) },
  { code: 'CHR6', name: 'Certificate in Health Records & IT', short: 'Health Records & IT', dept: 'Department of Health Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(15000, 2000) },
  { code: 'CCH5', name: 'Certificate in Community Health Level 5', short: 'Community Health Level 5', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(14000, 2000) },
  { code: 'CCH4', name: 'Certificate in Community Health Level 4', short: 'Community Health Level 4', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(13000, 2000) },
  { code: 'CHT3W', name: 'Certificate in HIV Counseling & Testing', short: 'HIV Counseling & Testing', dept: 'Department of Health Sciences', duration: '3 weeks', examBody: 'NASCOP', level: 'Certificate', fee: programmeFee(9000, 1500) },
  { code: 'CHM3', name: 'Certificate in Homecare Management', short: 'Homecare Management', dept: 'Department of Health Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(13000, 2000) },
  // Department of Social Sciences
  { code: 'DCD3', name: 'Diploma in Community Development & Social Work', short: 'Community Development & Social Work', dept: 'Department of Social Sciences', duration: '3 terms', examBody: 'KNEC', level: 'Diploma', fee: programmeFee(17000, 2000) },
  { code: 'DCP6', name: 'Diploma in Counseling Psychology', short: 'Counseling Psychology', dept: 'Department of Social Sciences', duration: '6 terms', examBody: 'TVET CDACC', level: 'Diploma', fee: programmeFee(17000, 2000) },
  { code: 'DHD6', name: 'Diploma in Community Health Development', short: 'Community Health Development', dept: 'Department of Social Sciences', duration: '6 terms', examBody: 'KNEC', level: 'Diploma', fee: programmeFee(17000, 2000) },
  { code: 'CCD3', name: 'Certificate in Community Development & Social Work', short: 'Community Development & Social Work', dept: 'Department of Social Sciences', duration: '3 terms', examBody: 'KNEC', level: 'Certificate', fee: programmeFee(12000, 1500) },
  { code: 'CHD3', name: 'Certificate in Community Health and Development', short: 'Community Health & Development', dept: 'Department of Social Sciences', duration: '3 terms', examBody: 'KNEC', level: 'Certificate', fee: programmeFee(12000, 1500) },
  { code: 'CCP3', name: 'Certificate in Counseling Psychology', short: 'Counseling Psychology', dept: 'Department of Social Sciences', duration: '3 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(12000, 1500) },
  // Department of Applied Science
  { code: 'DME9', name: 'Diploma in Medical Engineering', short: 'Medical Engineering', dept: 'Department of Applied Science', duration: '9 terms', examBody: 'TVET CDACC / KNEC', level: 'Diploma', fee: programmeFee(24000, 3000) },
  { code: 'DAB6', name: 'Diploma in Applied Biology', short: 'Applied Biology', dept: 'Department of Applied Science', duration: '6 terms', examBody: 'KNEC', level: 'Diploma', fee: programmeFee(20000, 2500) },
  { code: 'CBE6', name: 'Certificate in Biomedical Engineering', short: 'Biomedical Engineering', dept: 'Department of Applied Science', duration: '6 terms', examBody: 'TVET CDACC', level: 'Certificate', fee: programmeFee(16000, 2500) },
  { code: 'CSL6', name: 'Certificate in Science Laboratory', short: 'Science Laboratory', dept: 'Department of Applied Science', duration: '6 terms', examBody: 'KNEC', level: 'Certificate', fee: programmeFee(15000, 2000) },
  { code: 'BRG3', name: 'Bridging per subject', short: 'Bridging per subject', dept: 'Department of Applied Science', duration: '3 months', examBody: 'KNEC', level: 'Bridging', fee: programmeFee(8000, 1500) },
  // Department of Business & Information
  { code: 'DCM6', name: 'Diploma/Certificate in Disaster Management/Public Administration', short: 'Disaster Management/Public Administration', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC', level: 'Diploma / Certificate', fee: programmeFee(17000, 2000) },
  { code: 'DPM6', name: 'Diploma/Certificate in Project Management/Public Relations', short: 'Project Management/Public Relations', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC', level: 'Diploma / Certificate', fee: programmeFee(17000, 2000) },
  { code: 'DBM6', name: 'Diploma in Business Management/Human Resource Management', short: 'Business Management & HRM', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC / ABMA (UK)', level: 'Diploma', fee: programmeFee(16000, 2000) },
  { code: 'DICT6', name: 'Diploma/Certificate in Information & Communication Technology', short: 'Information & Communication Technology', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC', level: 'Diploma / Certificate', fee: programmeFee(18000, 2000) },
  { code: 'DPS6', name: 'Diploma/Certificate in Personnel Management/Purchasing & Supplies', short: 'Personnel Management/Purchasing & Supplies', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC / ABMA', level: 'Diploma / Certificate', fee: programmeFee(16000, 2000) },
  { code: 'DCE2', name: 'Diploma/Certificate in Computer Engineering, Information Systems', short: 'Computer Engineering & Information Systems', dept: 'Department of Business & Information', duration: '6 / 3 terms', examBody: 'KNEC / ABMA (UK)', level: 'Diploma / Certificate', fee: programmeFee(19000, 2000) },
  { code: 'AGD3', name: 'Accounts / Graphic Design', short: 'Accounts / Graphic Design', dept: 'Department of Business & Information', duration: '2 / 3 terms', examBody: 'ACCA / KASNEB / KNEC', level: 'Diploma / Certificate', fee: programmeFee(14000, 2000) }
];

const UNIT_DEFS = [
  // Community Health — current
  { code: 'CHT101', title: 'Community Health Practice I', credits: 12, programme: 'DCH6', year: 1, lecturer: 'u_lec1', type: 'Core', day: 'Mon', time: '08:00 - 10:00', room: 'LH 1' },
  { code: 'ANA102', title: 'Anatomy & Physiology', credits: 10, programme: 'DCH6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Tue', time: '10:00 - 12:00', room: 'Science Lab 2' },
  { code: 'PHN103', title: 'Public Health & Epidemiology', credits: 10, programme: 'DCH6', year: 1, lecturer: 'u_lec1', type: 'Core', day: 'Wed', time: '08:00 - 10:00', room: 'LH 2' },
  { code: 'COM104', title: 'Communication Skills & Professional Ethics', credits: 6, programme: 'DCH6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Thu', time: '14:00 - 16:00', room: 'LH 1' },
  { code: 'ICT105', title: 'Health Informatics', credits: 8, programme: 'DCH6', year: 1, lecturer: 'u_lec1', type: 'Core', day: 'Fri', time: '08:00 - 10:00', room: 'ICT Lab' },
  // Nutrition
  { code: 'NUT201', title: 'Nutrition Science', credits: 10, programme: 'DND6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Mon', time: '10:00 - 12:00', room: 'Nutrition Lab' },
  { code: 'FDS202', title: 'Food Service Systems', credits: 8, programme: 'DND6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Wed', time: '14:00 - 16:00', room: 'Kitchen Lab' },
  { code: 'BIO203', title: 'Biochemistry', credits: 10, programme: 'DND6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Tue', time: '08:00 - 10:00', room: 'Science Lab 1' },
  { code: 'DIE204', title: 'Dietetics Practice', credits: 8, programme: 'DND6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Thu', time: '10:00 - 12:00', room: 'Nutrition Lab' },
  // Mortuary
  { code: 'MOR301', title: 'Mortuary Practice I', credits: 12, programme: 'DMS6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Mon', time: '14:00 - 16:00', room: 'Mortuary Lab' },
  { code: 'ANA302', title: 'Applied Anatomy', credits: 10, programme: 'DMS6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Tue', time: '08:00 - 10:00', room: 'Science Lab 2' },
  { code: 'EMB303', title: 'Embalming Science', credits: 8, programme: 'DMS6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Wed', time: '10:00 - 12:00', room: 'Mortuary Lab' },
  { code: 'OSH304', title: 'Occupational Safety & Ethics', credits: 6, programme: 'DMS6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Fri', time: '10:00 - 12:00', room: 'LH 3' },
  // Perioperative
  { code: 'PER401', title: 'Perioperative Practice I', credits: 12, programme: 'DPT6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Mon', time: '08:00 - 10:00', room: 'Theatre Lab' },
  { code: 'ASE402', title: 'Aseptic Technique', credits: 8, programme: 'DPT6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Tue', time: '14:00 - 16:00', room: 'Theatre Lab' },
  { code: 'SUR403', title: 'Surgical Anatomy', credits: 10, programme: 'DPT6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Thu', time: '08:00 - 10:00', room: 'Science Lab 1' },
  { code: 'CSS404', title: 'Central Sterile Services', credits: 8, programme: 'DPT6', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Fri', time: '10:00 - 12:00', room: 'CSSD Lab' },
  // Counseling
  { code: 'PSY501', title: 'Counseling Theories', credits: 10, programme: 'DCP6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Mon', time: '10:00 - 12:00', room: 'LH 4' },
  { code: 'DEV502', title: 'Human Growth & Development', credits: 8, programme: 'DCP6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Wed', time: '08:00 - 10:00', room: 'LH 4' },
  { code: 'ETH503', title: 'Professional Ethics in Counseling', credits: 6, programme: 'DCP6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Thu', time: '14:00 - 16:00', room: 'LH 2' },
  { code: 'PRA504', title: 'Counseling Practicum I', credits: 12, programme: 'DCP6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Fri', time: '08:00 - 12:00', room: 'Clinic' },
  // ICT
  { code: 'ICT601', title: 'Programming Fundamentals', credits: 10, programme: 'DICT6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Mon', time: '08:00 - 10:00', room: 'ICT Lab' },
  { code: 'NET602', title: 'Networking Essentials', credits: 8, programme: 'DICT6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Tue', time: '10:00 - 12:00', room: 'Network Lab' },
  { code: 'DB603', title: 'Database Systems', credits: 8, programme: 'DICT6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Thu', time: '08:00 - 10:00', room: 'ICT Lab' },
  { code: 'WEB604', title: 'Web Development', credits: 10, programme: 'DICT6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Fri', time: '14:00 - 16:00', room: 'ICT Lab' },
  // Business
  { code: 'BUS701', title: 'Business Management', credits: 10, programme: 'DBM6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Mon', time: '14:00 - 16:00', room: 'LH 5' },
  { code: 'ACC702', title: 'Accounting Principles', credits: 10, programme: 'DBM6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Tue', time: '08:00 - 10:00', room: 'LH 5' },
  { code: 'HRM703', title: 'Human Resource Management', credits: 8, programme: 'DBM6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Wed', time: '10:00 - 12:00', room: 'LH 2' },
  { code: 'MKT704', title: 'Marketing & Customer Care', credits: 8, programme: 'DBM6', year: 1, lecturer: 'u_lec3', type: 'Core', day: 'Fri', time: '08:00 - 10:00', room: 'LH 3' },
  // Medical engineering
  { code: 'MED801', title: 'Medical Electronics', credits: 12, programme: 'DME9', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Mon', time: '08:00 - 10:00', room: 'Engineering Lab' },
  { code: 'BME802', title: 'Biomedical Equipment', credits: 10, programme: 'DME9', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Wed', time: '10:00 - 12:00', room: 'Engineering Lab' },
  { code: 'MAT803', title: 'Engineering Materials', credits: 8, programme: 'DME9', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Thu', time: '08:00 - 10:00', room: 'Workshop' },
  { code: 'WKS804', title: 'Workshop Practice', credits: 10, programme: 'DME9', year: 1, lecturer: 'u_lec2', type: 'Core', day: 'Fri', time: '10:00 - 14:00', room: 'Workshop' },
  // Archived community health units (for transcripts)
  { code: 'CHT011', title: 'Foundations of Community Health', credits: 10, programme: 'DCH6', year: 1, lecturer: 'u_lec1', type: 'Core', current: false, termCode: '2026-T2', termLabel: 'January – April 2026' },
  { code: 'BIO012', title: 'Human Biology', credits: 10, programme: 'DCH6', year: 1, lecturer: 'u_lec2', type: 'Core', current: false, termCode: '2026-T2', termLabel: 'January – April 2026' },
  { code: 'COM013', title: 'Study Skills & Communication', credits: 6, programme: 'DCH6', year: 1, lecturer: 'u_lec3', type: 'Core', current: false, termCode: '2026-T2', termLabel: 'January – April 2026' },
  { code: 'PHC014', title: 'Primary Health Care', credits: 8, programme: 'DCH6', year: 1, lecturer: 'u_lec1', type: 'Core', current: false, termCode: '2026-T2', termLabel: 'January – April 2026' }
];

const UNITS = UNIT_DEFS.map(u => Object.assign({ current: true, termCode: '2026-T3', termLabel: 'September – December 2026' }, u));

/* End-of-term examination calendar. Papers are generated from the current unit
   allocation so the schedule always matches what is taught this term. No
   programme sits two papers in one session and no venue is double-booked. */
const EXAM_SESSIONS = [
  { start: '09:00', end: '11:00' },
  { start: '11:30', end: '13:30' },
  { start: '14:00', end: '16:00' }
];
const EXAM_VENUES = ['Main Hall', 'LH 1', 'LH 2', 'LH 3', 'Science Lab 1'];
const EXAM_WINDOW = { start: '2026-12-07', end: '2026-12-10', label: '7 – 10 December 2026' };

const EXAM_CALENDAR = (function buildExamCalendar() {
  const days = [];
  const cursor = new Date('2026-12-07T00:00:00');
  while (days.length < 4) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push({
        date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const queue = UNITS.filter(u => u.current).map(u => u.code);
  const calendar = [];
  const maxPapersPerSession = 3;
  let slot = 0;
  while (queue.length) {
    const session = EXAM_SESSIONS[slot % EXAM_SESSIONS.length];
    const day = days[Math.floor(slot / EXAM_SESSIONS.length) % days.length];
    const seated = new Set();
    let venue = 0;
    for (let i = 0; i < queue.length && seated.size < maxPapersPerSession;) {
      const unit = UNITS.find(u => u.code === queue[i]);
      if (seated.has(unit.programme)) { i++; continue; }
      queue.splice(i, 1);
      seated.add(unit.programme);
      calendar.push({
        unitCode: unit.code, programme: unit.programme, date: day.date,
        start: session.start, end: session.end,
        venue: EXAM_VENUES[venue++ % EXAM_VENUES.length], type: 'Main exam'
      });
    }
    slot++;
  }
  return calendar;
})();

const HOSTELS = [
  { id: 'HST', name: 'TSMHST Hostel', room: 'Shared room', perTerm: 16000, description: 'Shared room with study desk, Wi-Fi and shared washrooms. Meals optional.' }
];

const CAMPUSES = ['Nairobi', 'Juja', 'Thika', 'Homabay', 'Kisumu', 'Migori'];
const ALL_CAMPUSES = 'All campuses';

/* Role model: every account has one role. Campus roles are scoped to one campus;
   executive roles oversee every campus; the owner only reaches app settings. */
const ADMIN_ROLE_OPTIONS = [
  { code: 'principal', label: 'College Principal', office: 'Principal’s Office' },
  { code: 'accounts_clerk', label: 'Accounts Clerk', office: 'Finance Office' },
  { code: 'campus_admin', label: 'Campus Admin', office: 'Campus Administration' },
  { code: 'registrar', label: 'Registrar', office: 'Academic Registry' },
  { code: 'qa_officer', label: 'Quality Assurance Officer', office: 'Quality Assurance' },
  { code: 'exam_officer', label: 'Examination Officer', office: 'Examinations Office' },
  { code: 'secretary', label: 'Secretary', office: 'Administration' }
];
const EXEC_ROLE_OPTIONS = [
  { code: 'director', label: 'Director', office: 'Directorate' },
  { code: 'deputy_director', label: 'Deputy Director', office: 'Directorate' },
  { code: 'general_admin', label: 'General Admin', office: 'Central Administration' }
];
const ADMIN_ROLES = ['owner', 'director', 'deputy_director', 'general_admin', 'principal', 'campus_admin', 'registrar', 'exam_officer', 'qa_officer', 'accounts_clerk', 'secretary'];
const EXEC_ROLES = ['director', 'deputy_director', 'general_admin'];
const STAFF_ROLES = ['lecturer'].concat(ADMIN_ROLES);

/* Who approves which registration. Principal signs off campus staff,
   campus admin signs off students, director signs off executive members,
   and the owner signs off principals and the director. */
const APPROVER_BY_ROLE = {
  student: 'campus_admin',
  lecturer: 'principal',
  campus_admin: 'principal',
  registrar: 'principal',
  exam_officer: 'principal',
  qa_officer: 'principal',
  accounts_clerk: 'principal',
  secretary: 'principal',
  deputy_director: 'director',
  general_admin: 'director',
  principal: 'owner',
  director: 'owner'
};
const ROLE_RANK = {
  owner: 100, director: 90, deputy_director: 80, general_admin: 75, principal: 70,
  registrar: 60, exam_officer: 60, qa_officer: 60, accounts_clerk: 60, campus_admin: 60, secretary: 60,
  lecturer: 40, council: 30, student: 20
};
const ROLE_LABELS = {
  owner: 'System Owner', director: 'Director', deputy_director: 'Deputy Director', general_admin: 'General Admin',
  principal: 'College Principal', campus_admin: 'Campus Admin', registrar: 'Registrar',
  exam_officer: 'Examination Officer', qa_officer: 'Quality Assurance Officer',
  accounts_clerk: 'Accounts Clerk', secretary: 'Secretary', lecturer: 'Lecturer', student: 'Student', council: 'Student Council'
};

function isAdminRole(role) { return ADMIN_ROLES.indexOf(role) !== -1; }
function isExecRole(role) { return EXEC_ROLES.indexOf(role) !== -1; }
function isStaffRole(role) { return role === 'lecturer' || isAdminRole(role); }
function isCampusRole(role) { return role === 'principal' || role === 'campus_admin' || role === 'registrar' || role === 'exam_officer' || role === 'qa_officer' || role === 'accounts_clerk' || role === 'secretary'; }
function roleCodeFromLabel(label) {
  const all = ADMIN_ROLE_OPTIONS.concat(EXEC_ROLE_OPTIONS);
  const found = all.find(r => r.label === label || r.code === label);
  return found ? found.code : null;
}
function roleOffice(role) {
  const found = ADMIN_ROLE_OPTIONS.concat(EXEC_ROLE_OPTIONS).find(r => r.code === role);
  return found ? found.office : 'Administration';
}

const DEFAULT_PAYBILLS = {
  fees: {
    channel: 'paybill',
    paybill: '4018437',
    name: 'TSMHST Fees Collection',
    accountMode: 'student-name-k',
    accountHint: 'Account: K- followed by the student’s full name.',
    demo: false
  },
  hostel: {
    channel: 'buygoods',
    paybill: '5210783',
    name: 'TSMHST Hostel Buy Goods',
    accountMode: 'none',
    accountHint: 'No account number is needed for Buy Goods.',
    demo: false
  }
};

const STAFF_MEMBERS = [
  { id: 'u_owner', name: 'Office of the Proprietor', role: 'owner', title: 'System Owner', email: 'owner@tsmhst.co.ke', phone: '+254112970334', department: 'Ownership', campus: ALL_CAMPUSES },
  { id: 'u_director', name: 'Dr. Joseph Mwangi', role: 'director', title: 'College Director', email: 'director@tsmhst.co.ke', phone: '+254700129536', department: 'Directorate', campus: ALL_CAMPUSES },
  { id: 'u_deputy', name: 'Mrs. Alice Njoroge', role: 'deputy_director', title: 'Deputy Director', email: 'deputy@tsmhst.co.ke', phone: '+254700000760', department: 'Directorate', campus: ALL_CAMPUSES },
  { id: 'u_admin2', name: 'Samuel Kariuki', role: 'general_admin', title: 'General Administrator', email: 'ict@tsmhst.co.ke', phone: '+254700129536', department: 'Central Administration', campus: ALL_CAMPUSES },
  { id: 'u_principal', name: 'Mr. Patrick Ouma', role: 'principal', title: 'College Principal — Nairobi Campus', email: 'principal@tsmhst.co.ke', phone: '+254700000292', department: 'Principal’s Office', campus: 'Nairobi' },
  { id: 'u_campus', name: 'Ms. Lucy Wairimu', role: 'campus_admin', title: 'Campus Administrator — Nairobi', email: 'campus@tsmhst.co.ke', phone: '+254700000506', department: 'Campus Administration', campus: 'Nairobi' },
  { id: 'u_admin', name: 'Dr. Mary Wambui', role: 'registrar', title: 'Registrar', email: 'admin@tsmhst.co.ke', phone: '+254112970334', department: 'Academic Registry', campus: 'Nairobi' },
  { id: 'u_exams', name: 'Mr. George Otieno', role: 'exam_officer', title: 'Examination Officer', email: 'exams@tsmhst.co.ke', phone: '+254700000272', department: 'Examinations Office', campus: 'Nairobi' },
  { id: 'u_qa', name: 'Ms. Beatrice Achieng', role: 'qa_officer', title: 'Quality Assurance Officer', email: 'quality@tsmhst.co.ke', phone: '+254114569011', department: 'Quality Assurance', campus: ALL_CAMPUSES },
  { id: 'u_accounts', name: 'Mrs. Esther Kamau', role: 'accounts_clerk', title: 'Accounts Clerk', email: 'accounts@tsmhst.co.ke', phone: '+254700129537', department: 'Finance Office', campus: 'Nairobi' },
  { id: 'u_secretary', name: 'Ms. Diana Chepkoech', role: 'secretary', title: 'Secretary', email: 'secretary@tsmhst.co.ke', phone: '+254700129538', department: 'Administration', campus: 'Nairobi' },
  { id: 'u_council', name: 'Brian Otieno', role: 'council', title: 'Student Council President', email: 'council@tsmhst.co.ke', phone: '+254700000760', department: 'Student Council', campus: 'Nairobi' },
  { id: 'u_council2', name: 'Faith Wanjiku', role: 'council', title: 'Student Council — Academic Affairs', email: 'academics.council@tsmhst.co.ke', phone: '+254700000292', department: 'Student Council', campus: 'Nairobi' },
  { id: 'u_lec1', name: 'Ms. Jane Ochieng', role: 'lecturer', title: 'Lecturer, Community Health', email: 'j.ochieng@tsmhst.co.ke', phone: '+254700000506', department: 'Department of Health Sciences', campus: 'Nairobi', staffNo: 'TSM/LEC/001' },
  { id: 'u_lec2', name: 'Dr. Peter Kamau', role: 'lecturer', title: 'Senior Lecturer, Applied Health Sciences', email: 'p.kamau@tsmhst.co.ke', phone: '+254700000272', department: 'Department of Health Sciences', campus: 'Juja', staffNo: 'TSM/LEC/002' },
  { id: 'u_lec3', name: 'Ms. Grace Achieng', role: 'lecturer', title: 'Lecturer, Business & Communication', email: 'g.achieng@tsmhst.co.ke', phone: '+254114569011', department: 'Department of Business & Information', campus: 'Thika', staffNo: 'TSM/LEC/003' }
];

const STUDENT_NAMES = [
  ['Alex Mwangi', 'TSMHST/CH/2026/001'],
  ['Mercy Wanjiru', 'TSMHST/CH/2026/002'],
  ['Kevin Odhiambo', 'TSMHST/CH/2026/003'],
  ['Faith Njeri', 'TSMHST/CH/2026/004'],
  ['Daniel Kiptoo', 'TSMHST/CH/2026/005'],
  ['Sharon Akinyi', 'TSMHST/CH/2026/006'],
  ['Brian Mutua', 'TSMHST/CH/2026/007'],
  ['Cynthia Chebet', 'TSMHST/CH/2026/008'],
  ['Victor Omondi', 'TSMHST/CH/2026/009'],
  ['Esther Nyambura', 'TSMHST/CH/2026/010'],
  ['Joshua Kilonzo', 'TSMHST/CH/2026/011'],
  ['Lydia Atieno', 'TSMHST/CH/2026/012']
];

const DEMO_ACCOUNTS = [
  { role: 'student', label: 'Student', identifier: 'TSMHST/CH/2026/001', password: 'Student@2026' },
  { role: 'lecturer', label: 'Lecturer', identifier: 'j.ochieng@tsmhst.co.ke', password: 'Lecturer@2026' },
  { role: 'owner', label: 'Owner', identifier: 'owner@tsmhst.co.ke', password: 'Owner@2026' },
  { role: 'director', label: 'Director', identifier: 'director@tsmhst.co.ke', password: 'Director@2026' },
  { role: 'principal', label: 'Principal', identifier: 'principal@tsmhst.co.ke', password: 'Principal@2026' },
  { role: 'campus_admin', label: 'Campus Admin', identifier: 'campus@tsmhst.co.ke', password: 'Campus@2026' },
  { role: 'registrar', label: 'Registrar', identifier: 'admin@tsmhst.co.ke', password: 'Admin@2026' },
  { role: 'exam_officer', label: 'Exam Officer', identifier: 'exams@tsmhst.co.ke', password: 'Exams@2026' },
  { role: 'accounts_clerk', label: 'Accounts', identifier: 'accounts@tsmhst.co.ke', password: 'Accounts@2026' },
  { role: 'council', label: 'Student Council', identifier: 'council@tsmhst.co.ke', password: 'Council@2026' }
];
