(function(){
if(!window.storage){
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem('cr-att:'+key);
      if(v === null){ throw new Error('not found'); }
      return { key, value: v };
    },
    set: async (key, value) => {
      localStorage.setItem('cr-att:'+key, value);
      return { key, value };
    }
  };
}

const defaultStudents = [
  { roll: "12501068", name: "VARUN CHAWLA" },{ roll: "12501069", name: "SUHANI" },
  { roll: "12501070", name: "KESHAV KUMAR GARG" },{ roll: "12501071", name: "KAMALPREET SINGH" },
  { roll: "12501072", name: "SHALLU RANI" },{ roll: "12501073", name: "HARSH KUMAR" },
  { roll: "12501074", name: "SUKRITI" },{ roll: "12501076", name: "ARSHPREET KAUR" },
  { roll: "12501078", name: "ISHIKA GARG" },{ roll: "12501079", name: "YATIN TIWARI" },
  { roll: "12501080", name: "SIMRANPREET SINGH" },{ roll: "12501084", name: "SHIVANSH GUPTA" },
  { roll: "12501085", name: "ANSHIKA" },{ roll: "12501086", name: "DIVYANSHU" },
  { roll: "12501087", name: "MANMEET SINGH" },{ roll: "12501088", name: "YUVRAJ" },
  { roll: "12501090", name: "YOGESH" },{ roll: "12501092", name: "ABHINAV SHARMA" },
  { roll: "12501093", name: "RUKSANA" },{ roll: "12501094", name: "LOVEPREET SINGH" },
  { roll: "12501095", name: "KAMALPREET KAUR" },{ roll: "12501096", name: "BALJIT SINGH" },
  { roll: "12501097", name: "ANKITA DHIMAN" },{ roll: "12501099", name: "RAHUL KUMAR" },
  { roll: "12501101", name: "JASNOOR SINGH" },{ roll: "12501102", name: "HEAMANJIT GIRI" },
  { roll: "12501103", name: "HIMANI" },{ roll: "12501104", name: "ANSHPARTAP SINGH" },
  { roll: "12501105", name: "MAANINDER SINGH" },{ roll: "12501106", name: "GURPREET SINGH" },
  { roll: "12501107", name: "PAVNEET KAUR" },{ roll: "12501108", name: "SOURYAVIR SINGH" },
  { roll: "12501109", name: "GAZAL" },{ roll: "12501110", name: "NIMISH DHURIA" },
  { roll: "12501111", name: "RUPINDERPAL KAUR" },{ roll: "12501112", name: "JASHANPREET SINGH" },
  { roll: "12501113", name: "MONIKA RANI" },{ roll: "12501114", name: "KHWAISH AGGARWAL" },
  { roll: "12501115", name: "GURKIRAT SINGH" },{ roll: "12501118", name: "JASMEEN KAUR" },
  { roll: "12501119", name: "APURAVPREET SINGH BALI" },{ roll: "12501120", name: "ARMAANDEEP SINGH" },
  { roll: "12501122", name: "MAYANK ARORA" },{ roll: "12501123", name: "TANISHA CHAWLA" },
  { roll: "12501124", name: "NAVDEEP SINGH" },{ roll: "12501125", name: "SIMRANJEET KAUR" },
  { roll: "12501126", name: "RAJPREET SINGH" },{ roll: "12501128", name: "HARJOT SINGH" },
  { roll: "12501129", name: "NAVDISHA" },{ roll: "12501130", name: "AMRINDER SINGH" },
  { roll: "12501131", name: "RAVINDER SINGH" },{ roll: "12501132", name: "PALAK" },
  { roll: "12501133", name: "RATANDEEP KAUR" },{ roll: "12501134", name: "JASNOOR SINGH" },
  { roll: "12501135", name: "RIDAM" },{ roll: "12501136", name: "SEHAJPREET SINGH" }
];

let students = [];
let attendanceState = {};
let saveTimer = null;
let appInitialized = false;
let currentUser = null;
let selectedGroup = null;
const GROUP4_START_ROLL = 12501102;

function getGroupFilteredStudents(){
  if(selectedGroup === 'group3'){
    return students.filter(s => parseInt(s.roll, 10) < GROUP4_START_ROLL);
  }
  if(selectedGroup === 'group4'){
    return students.filter(s => parseInt(s.roll, 10) >= GROUP4_START_ROLL);
  }
  return students;
}

function groupLabel(){
  if(selectedGroup === 'group3') return '3rd Group';
  if(selectedGroup === 'group4') return '4th Group';
  return 'Whole Class';
}

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function formatDateForReport(isoDate){
  const parts = (isoDate || '').split('-');
  if(parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = monthNames[monthIdx] || month;
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

function getSubjectValue(){
  const sel = document.getElementById('subjectName').value;
  if(sel === '__other__'){
    return document.getElementById('otherSubject').value.trim() || 'Other Subject';
  }
  return sel;
}

function recordKey(){
  const className = (document.getElementById('className').value || 'group').trim().toLowerCase().replace(/\s+/g,'-');
  const subject = (getSubjectValue() || 'class').trim().toLowerCase().replace(/\s+/g,'-');
  const date = document.getElementById('attDate').value || todayStr();
  return 'attendance:'+date+':'+className+':'+subject;
}

async function loadRoster(){
  try{
    const r = await window.storage.get('roster');
    students = r ? JSON.parse(r.value) : null;
  }catch(e){ students = null; }
  if(!students || students.length===0){
    students = defaultStudents;
    try{ await window.storage.set('roster', JSON.stringify(students)); }catch(e){}
  }
  students.sort((a,b)=> a.roll.localeCompare(b.roll, undefined, {numeric:true}));
}

async function loadAttendanceForKey(){
  try{
    const r = await window.storage.get(recordKey());
    attendanceState = r ? JSON.parse(r.value) : {};
  }catch(e){ attendanceState = {}; }
  students.forEach(s=>{ if(!attendanceState[s.roll]) attendanceState[s.roll] = 'P'; });
}

function queueSave(){
  clearTimeout(saveTimer);
  const msg = document.getElementById('saveMsg');
  msg.textContent = 'Saving...';
  saveTimer = setTimeout(async ()=>{
    try{
      await window.storage.set(recordKey(), JSON.stringify(attendanceState));
      msg.textContent = 'Saved ✓';
      setTimeout(()=>{ if(msg.textContent==='Saved ✓') msg.textContent=''; }, 2000);
    }catch(e){
      msg.style.color = 'var(--absent)';
      msg.textContent = 'Could not save';
    }
  }, 400);
}

function toggleStatus(roll){
  const current = attendanceState[roll] || 'P';
  attendanceState[roll] = current==='P' ? 'A' : 'P';
  renderList();
  queueSave();
}

function markAll(status){
  const list = getGroupFilteredStudents();
  list.forEach(s=> attendanceState[s.roll] = status);
  renderList();
  queueSave();
}

function renderList(){
  const query = document.getElementById('searchBox').value.trim().toLowerCase();
  const container = document.getElementById('studentContainer');
  container.innerHTML = '';

  const groupStudents = getGroupFilteredStudents();

  const filtered = groupStudents
    .filter(s=> s.name.toLowerCase().includes(query) || s.roll.toLowerCase().includes(query))
    .sort((a,b)=> a.roll.localeCompare(b.roll, undefined, {numeric:true}));

  filtered.forEach(s=>{
    const status = attendanceState[s.roll] || 'P';
    const el = document.createElement('div');
    el.className = 'student-item';
    el.onclick = () => toggleStatus(s.roll);
    el.innerHTML = `
      <div class="student-info">
        <span class="roll-no">${s.roll}</span>
        <span class="student-name">${s.name}</span>
      </div>
      <span class="badge-btn badge-${status}">${status==='P'?'Present':'Absent'}</span>
    `;
    container.appendChild(el);
  });

  let totalP=0, totalA=0;
  groupStudents.forEach(s=>{
    const st = attendanceState[s.roll] || 'P';
    if(st==='P') totalP++; else totalA++;
  });

  document.getElementById('totalCount').textContent = groupStudents.length;
  document.getElementById('presentCount').textContent = totalP;
  document.getElementById('absentCount').textContent = totalA;
}

function buildSummary(){
  const className = document.getElementById('className').value || 'N/A';
  const subject = document.getElementById('subjectName').value || 'Class Attendance';
  const date = document.getElementById('attDate').value || todayStr();
  const groupStudents = getGroupFilteredStudents();
  const presentRolls = [];
  const absentRolls = [];

  groupStudents.forEach(s=>{
    const st = attendanceState[s.roll] || 'P';
    if(st==='A') absentRolls.push(`${s.roll} - ${s.name}`);
    else presentRolls.push(`${s.roll} - ${s.name}`);
  });

  let report = `ATTENDANCE REPORT\n`;
  report += `Class: ${className}\n`;
  report += `Group: ${groupLabel()}\n`;
  report += `Subject: ${subject}\n`;
  report += `Date: ${formatDateForReport(date)}\n`;
  report += `Total students: ${groupStudents.length}\n`;
  report += `Present: ${presentRolls.length}\n`;
  report += `Absent: ${absentRolls.length}\n`;
  report += `------------------------------------\n`;

  if(presentRolls.length>0){
    report += `Present students (${presentRolls.length}):\n` + presentRolls.map(r=>`- ${r}`).join('\n') + '\n\n';
  } else {
    report += `Present: None\n\n`;
  }

  if(absentRolls.length>0){
    report += `Absent students (${absentRolls.length}):\n` + absentRolls.map(r=>`- ${r}`).join('\n') + '\n\n';
  } else {
    report += `Absent: None — all ${groupStudents.length} present\n\n`;
  }

  report += `Submitted by CR of ${className}`;
  return report;
}

function openSummary(){
  const container = document.getElementById('summaryText');
  container.innerHTML = '';
  buildSummary().split('\n').forEach(line=>{
    const lineEl = document.createElement('div');
    lineEl.className = 'report-line';
    lineEl.textContent = line.length ? line : '\u00A0';
    container.appendChild(lineEl);
  });
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeSummary(){
  document.getElementById('modalOverlay').style.display = 'none';
}

async function saveRosterOnly(){
  try{ await window.storage.set('roster', JSON.stringify(students)); }catch(e){}
}

function openRoster(){
  document.getElementById('rosterAddMsg').textContent = '';
  document.getElementById('undoBanner').style.display = 'none';
  clearTimeout(undoTimer);
  lastRemoved = null;
  renderRosterList();
  document.getElementById('rosterModalOverlay').style.display = 'flex';
}

function closeRoster(){
  document.getElementById('rosterModalOverlay').style.display = 'none';
}

function renderRosterList(){
  const list = document.getElementById('rosterList');
  const sorted = [...students].sort((a,b)=> a.roll.localeCompare(b.roll));
  if(sorted.length===0){
    list.innerHTML = '<p style="color:#666;font-size:0.85rem;">No students yet.</p>';
    return;
  }
  list.innerHTML = sorted.map(s=>`
    <div class="roster-row">
      <div class="r-info"><span class="r-roll">${s.roll}</span><span class="r-name">${s.name}</span></div>
      <button onclick="removeStudent('${s.roll}')">Remove</button>
    </div>
  `).join('');
}

async function addStudentFromForm(){
  const rollInput = document.getElementById('newRoll');
  const nameInput = document.getElementById('newName');
  const msg = document.getElementById('rosterAddMsg');
  const roll = rollInput.value.trim();
  const name = nameInput.value.trim();
  msg.textContent = '';
  rollInput.style.borderColor = '';

  if(!roll || !name){
    msg.textContent = 'Enter both roll number and name.';
    if(!roll) rollInput.style.borderColor = 'var(--absent)';
    return;
  }
  if(students.some(s=> s.roll.toLowerCase() === roll.toLowerCase())){
    msg.textContent = `Roll number ${roll} already exists in the roster.`;
    rollInput.style.borderColor = 'var(--absent)';
    rollInput.focus();
    return;
  }

  students.push({ roll, name });
  students.sort((a,b)=> a.roll.localeCompare(b.roll, undefined, {numeric:true}));
  attendanceState[roll] = 'P';
  await saveRosterOnly();
  queueSave();
  rollInput.value = '';
  nameInput.value = '';
  renderRosterList();
  renderList();
}

let lastRemoved = null;
let undoTimer = null;

async function removeStudent(roll){
  const student = students.find(s=> s.roll===roll);
  if(!student) return;
  const status = attendanceState[roll] || 'P';

  students = students.filter(s=> s.roll!==roll);
  delete attendanceState[roll];
  await saveRosterOnly();
  queueSave();
  renderRosterList();
  renderList();

  lastRemoved = { student, status };
  clearTimeout(undoTimer);
  const banner = document.getElementById('undoBanner');
  document.getElementById('undoText').textContent = `Removed ${student.roll} - ${student.name}`;
  banner.style.display = 'flex';
  undoTimer = setTimeout(()=>{ banner.style.display = 'none'; lastRemoved = null; }, 8000);
}

async function undoRemove(){
  if(!lastRemoved) return;
  clearTimeout(undoTimer);
  students.push(lastRemoved.student);
  students.sort((a,b)=> a.roll.localeCompare(b.roll, undefined, {numeric:true}));
  attendanceState[lastRemoved.student.roll] = lastRemoved.status;
  await saveRosterOnly();
  queueSave();
  renderRosterList();
  renderList();
  document.getElementById('undoBanner').style.display = 'none';
  lastRemoved = null;
}

function showToast(text){
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.style.display = 'block';
  setTimeout(()=> toast.style.display='none', 2200);
}

function copySummary(){
  const text = buildSummary();
  navigator.clipboard.writeText(text).then(()=> showToast('Copied — paste it anywhere'));
}

const IMAGE_PART_MAX_HEIGHT = 2600;

async function downloadImage(){
  const modalBox = document.querySelector('#modalOverlay .modal-box');
  const summaryPre = document.getElementById('summaryText');
  const actions = modalBox.querySelector('.modal-actions');
  const date = document.getElementById('attDate').value || todayStr();
  const subject = (document.getElementById('subjectName').value || 'class').trim().replace(/\s+/g,'_');
  const baseName = `attendance_${subject}_${date}`;

  if(typeof html2canvas === 'undefined'){
    showToast('Image export unavailable (library not found)');
    return;
  }

  const prevBoxMaxHeight = modalBox.style.maxHeight;
  const prevBoxOverflow = modalBox.style.overflow;
  const prevPreMaxHeight = summaryPre.style.maxHeight;
  const prevPreOverflow = summaryPre.style.overflow;
  modalBox.style.maxHeight = 'none';
  modalBox.style.overflow = 'visible';
  summaryPre.style.maxHeight = 'none';
  summaryPre.style.overflow = 'visible';
  actions.style.display = 'none';

  try{
    const scale = 2;
    const fullCanvas = await html2canvas(modalBox, { backgroundColor: '#ffffff', scale });

    const boxTop = modalBox.getBoundingClientRect().top;
    const lineTops = Array.from(summaryPre.querySelectorAll('.report-line')).map(el=>
      Math.round((el.getBoundingClientRect().top - boxTop) * scale)
    );

    let parts = [];
    if(fullCanvas.height <= IMAGE_PART_MAX_HEIGHT || lineTops.length === 0){
      parts = [{ canvas: fullCanvas, filename: `${baseName}.png` }];
    } else {
      const cutPoints = [0];
      let target = IMAGE_PART_MAX_HEIGHT;
      for(const top of lineTops){
        if(top >= target){
          cutPoints.push(top);
          target = top + IMAGE_PART_MAX_HEIGHT;
        }
      }
      cutPoints.push(fullCanvas.height);

      for(let i=0;i<cutPoints.length-1;i++){
        const startY = cutPoints[i];
        const endY = cutPoints[i+1];
        const partHeight = endY - startY;
        if(partHeight <= 0) continue;
        const partCanvas = document.createElement('canvas');
        partCanvas.width = fullCanvas.width;
        partCanvas.height = partHeight;
        const ctx = partCanvas.getContext('2d');
        ctx.drawImage(fullCanvas, 0, startY, fullCanvas.width, partHeight, 0, 0, fullCanvas.width, partHeight);
        parts.push({ canvas: partCanvas, filename: `${baseName}_part${parts.length+1}of${cutPoints.length-1}.png` });
      }
    }

    const files = [];
    for(const p of parts){
      const blob = await new Promise(resolve => p.canvas.toBlob(resolve, 'image/png'));
      if(blob) files.push(new File([blob], p.filename, { type: 'image/png' }));
    }

    if(files.length === 0){
      showToast('Could not create image');
      return;
    }

    if(navigator.canShare && navigator.canShare({ files })){
      try{
        await navigator.share({ files, title: files[0].name });
        showToast(files.length > 1 ? `Choose "Save Image" for all ${files.length} parts` : 'Choose "Save Image" to store it on your device');
        return;
      }catch(shareErr){}
    }

    files.forEach(file=>{
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(()=> URL.revokeObjectURL(url), 5000);
    });
    showToast(files.length > 1 ? `Report split into ${files.length} images — check Downloads` : 'Image downloaded — check your Downloads folder');
  }catch(e){
    showToast('Could not create image');
  }finally{
    modalBox.style.maxHeight = prevBoxMaxHeight;
    modalBox.style.overflow = prevBoxOverflow;
    summaryPre.style.maxHeight = prevPreMaxHeight;
    summaryPre.style.overflow = prevPreOverflow;
    actions.style.display = '';
  }
}

function downloadSummary(){
  const text = buildSummary();
  const date = document.getElementById('attDate').value || todayStr();
  const subject = (document.getElementById('subjectName').value || 'class').trim().replace(/\s+/g,'_');
  const blob = new Blob([text], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `attendance_${subject}_${date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(){
  const date = document.getElementById('attDate').value || todayStr();
  const subject = (document.getElementById('subjectName').value || 'class').trim().replace(/\s+/g,'_');
  let csv = 'Roll,Name,Status\n';
  getGroupFilteredStudents().forEach(s=>{
    const st = attendanceState[s.roll] || 'P';
    const label = st==='P'?'Present':'Absent';
    csv += `${s.roll},${s.name},${label}\n`;
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `attendance_${subject}_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MASTER_PASSWORD = '8529875072';
let verifyPurpose = null;

function simpleHash(str){
  let hash = 0;
  for(let i=0;i<str.length;i++){
    hash = ((hash<<5)-hash)+str.charCodeAt(i);
    hash |= 0;
  }
  return 'h'+hash;
}

async function getAccounts(){
  try{
    const r = await window.storage.get('auth:accounts');
    return r && r.value ? JSON.parse(r.value) : [];
  }catch(e){
    try{
      const old = await window.storage.get('auth:credentials');
      if(old && old.value){
        const creds = JSON.parse(old.value);
        if(creds && creds.username){
          const accounts = [{ username: creds.username, passHash: creds.passHash }];
          await saveAccounts(accounts);
          return accounts;
        }
      }
    }catch(e2){}
    return [];
  }
}

async function saveAccounts(accounts){
  try{ await window.storage.set('auth:accounts', JSON.stringify(accounts)); }catch(e){}
}

function togglePassVisibility(inputId, btn){
  const input = document.getElementById(inputId);
  if(input.type === 'password'){
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

function hideAllLoginViews(){
  document.getElementById('loginViewLogin').style.display = 'none';
  document.getElementById('loginViewVerify').style.display = 'none';
  document.getElementById('loginViewSetNew').style.display = 'none';
}

function resetPassField(inputId){
  const input = document.getElementById(inputId);
  input.type = 'password';
  const btn = input.parentElement.querySelector('.pass-toggle');
  if(btn) btn.textContent = 'Show';
}

function showLoginView(){
  hideAllLoginViews();
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  resetPassField('loginPass');
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginViewLogin').style.display = 'block';
  document.getElementById('loginUser').focus();
}

function showVerifyView(purpose){
  verifyPurpose = purpose;
  hideAllLoginViews();
  document.getElementById('masterPass').value = '';
  resetPassField('masterPass');
  document.getElementById('verifyError').textContent = '';
  document.getElementById('verifySubtitle').textContent = purpose === 'reset'
    ? 'Enter the special password to reset your password'
    : 'Enter the special password to create a new account';
  document.getElementById('loginViewVerify').style.display = 'block';
  document.getElementById('masterPass').focus();
}

async function handleVerifyMaster(){
  const val = document.getElementById('masterPass').value;
  const err = document.getElementById('verifyError');
  if(val !== MASTER_PASSWORD){
    err.textContent = 'Incorrect special password.';
    return;
  }
  err.textContent = '';
  hideAllLoginViews();
  document.getElementById('newLoginUser').value = '';
  document.getElementById('newLoginPass').value = '';
  resetPassField('newLoginPass');
  document.getElementById('setNewError').textContent = '';
  if(verifyPurpose === 'new'){
    document.getElementById('setNewTitle').textContent = 'Create your account';
    document.getElementById('newLoginUser').placeholder = 'Choose a username';
    document.getElementById('newLoginPass').placeholder = 'Choose a password (min 4 chars)';
  } else {
    document.getElementById('setNewTitle').textContent = 'Reset your password';
    document.getElementById('newLoginUser').placeholder = 'Your existing username';
    document.getElementById('newLoginPass').placeholder = 'New password (min 4 chars)';
  }
  document.getElementById('loginViewSetNew').style.display = 'block';
  document.getElementById('newLoginUser').focus();
}

async function handleSaveNewCredentials(){
  const user = document.getElementById('newLoginUser').value.trim();
  const pass = document.getElementById('newLoginPass').value;
  const err = document.getElementById('setNewError');
  if(!user || !pass){
    err.textContent = 'Enter a username and password.';
    return;
  }
  if(pass.length < 4){
    err.textContent = 'Password should be at least 4 characters.';
    return;
  }
  const accounts = await getAccounts();
  if(verifyPurpose === 'new'){
    if(accounts.some(a=> a.username.toLowerCase() === user.toLowerCase())){
      err.textContent = 'That username is already taken — try "Forgot password?" if it\'s yours.';
      return;
    }
    accounts.push({ username: user, passHash: simpleHash(pass) });
    await saveAccounts(accounts);
    err.textContent = '';
    currentUser = user;
    await enterApp();
  } else {
    const idx = accounts.findIndex(a=> a.username.toLowerCase() === user.toLowerCase());
    if(idx === -1){
      err.textContent = 'No account found with that username — use "New user?" instead.';
      return;
    }
    accounts[idx].passHash = simpleHash(pass);
    await saveAccounts(accounts);
    err.textContent = '';
    currentUser = accounts[idx].username;
    await enterApp();
  }
}

async function showLoginScreen(){
  const accounts = await getAccounts();
  if(accounts.length === 0){
    showVerifyView('new');
  } else {
    showLoginView();
  }
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

async function handleLogin(){
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  if(!user || !pass){
    err.textContent = 'Enter your username and password.';
    return;
  }
  const accounts = await getAccounts();
  const match = accounts.find(a=> a.username.toLowerCase() === user.toLowerCase() && a.passHash === simpleHash(pass));
  if(!match){
    err.textContent = 'Incorrect username or password.';
    return;
  }
  err.textContent = '';
  currentUser = match.username;
  await enterApp();
}

function logout(){
  currentUser = null;
  selectedGroup = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('groupScreen').style.display = 'none';
  showLoginScreen();
}

async function enterApp(){
  document.getElementById('loginScreen').style.display = 'none';
  showGroupScreen();
}

function showGroupScreen(){
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('groupScreen').style.display = 'flex';
}

async function selectGroup(group){
  selectedGroup = group;
  document.getElementById('groupScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';

  const classNameInput = document.getElementById('className');
  if(group === 'group3'){
    classNameInput.value = '2nd Year 3rd Group';
  } else if(group === 'group4'){
    classNameInput.value = '2nd Year 4rd Group';
  } else {
    classNameInput.value = '2nd Year 3-4 Group';
  }

  const label = document.getElementById('loggedInAs');
  if(label){
    const who = currentUser ? ('Logged in as ' + currentUser) : '';
    label.textContent = who ? (who + ' • ' + groupLabel()) : groupLabel();
  }
  if(!appInitialized){
    await init();
    appInitialized = true;
  } else {
    renderList();
  }
}

window.logout = logout;
window.showGroupScreen = showGroupScreen;
window.selectGroup = selectGroup;
window.togglePassVisibility = togglePassVisibility;
window.showLoginView = showLoginView;
window.showVerifyView = showVerifyView;
window.handleVerifyMaster = handleVerifyMaster;
window.handleSaveNewCredentials = handleSaveNewCredentials;
window.handleLogin = handleLogin;
window.markAll = markAll;
window.openSummary = openSummary;
window.closeSummary = closeSummary;
window.copySummary = copySummary;
window.downloadImage = downloadImage;
window.downloadSummary = downloadSummary;
window.downloadCSV = downloadCSV;
window.renderList = renderList;
window.openRoster = openRoster;
window.closeRoster = closeRoster;
window.addStudentFromForm = addStudentFromForm;
window.removeStudent = removeStudent;
window.undoRemove = undoRemove;

async function init(){
  document.getElementById('attDate').value = todayStr();
  await loadRoster();
  await loadAttendanceForKey();
  renderList();

  document.getElementById('attDate').addEventListener('change', async ()=>{
    await loadAttendanceForKey();
    renderList();
  });
  document.getElementById('subjectName').addEventListener('change', async ()=>{
    const isOther = document.getElementById('subjectName').value === '__other__';
    document.getElementById('otherSubjectWrap').style.display = isOther ? 'block' : 'none';
    if(isOther){
      document.getElementById('otherSubject').focus();
    } else {
      await loadAttendanceForKey();
      renderList();
    }
  });
  document.getElementById('otherSubject').addEventListener('change', async ()=>{
    await loadAttendanceForKey();
    renderList();
  });
  document.getElementById('className').addEventListener('change', async ()=>{
    await loadAttendanceForKey();
    renderList();
  });
  document.getElementById('modalOverlay').addEventListener('click', (e)=>{
    if(e.target.id==='modalOverlay') closeSummary();
  });
  document.getElementById('rosterModalOverlay').addEventListener('click', (e)=>{
    if(e.target.id==='rosterModalOverlay') closeRoster();
  });
  document.getElementById('newName').addEventListener('keydown', (e)=>{
    if(e.key==='Enter') addStudentFromForm();
  });
  document.getElementById('newRoll').addEventListener('input', ()=>{
    document.getElementById('newRoll').style.borderColor = '';
    document.getElementById('rosterAddMsg').textContent = '';
  });
}

document.getElementById('loginPass').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') handleLogin();
});
document.getElementById('loginUser').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') document.getElementById('loginPass').focus();
});
document.getElementById('masterPass').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') handleVerifyMaster();
});
document.getElementById('newLoginPass').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') handleSaveNewCredentials();
});
document.getElementById('newLoginUser').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') document.getElementById('newLoginPass').focus();
});

showLoginScreen();
})();