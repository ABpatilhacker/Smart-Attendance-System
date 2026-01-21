/***********************
 🔥 FIREBASE CONFIG
************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let teacherId;
let attendanceData = {};

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  else {
    teacherId = user.uid;
    loadWelcome();
    loadClasses();
    loadProfile();
    loadChart();
  }
});

/***********************
 SIDEBAR TOGGLE
************************/
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.style.transform = sb.style.transform === 'translateX(0px)' ? 'translateX(-100%)' : 'translateX(0px)';
}
document.addEventListener('click', e => {
  const sb = document.getElementById('sidebar');
  if (!sb.contains(e.target) && window.innerWidth < 992) sb.style.transform = 'translateX(-100%)';
});

/***********************
 SECTIONS
************************/
function openSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/***********************
 WELCOME CARD
************************/
function loadWelcome() {
  db.ref('users/' + teacherId).once('value').then(snap => {
    const t = snap.val();
    document.getElementById('welcomeCard').innerText = `Welcome, ${t.name}`;
  });
}

/***********************
 CLASSES & SUBJECTS
************************/
function loadClasses() {
  const container = document.getElementById('classListContainer');
  container.innerHTML = '';
  const subjectSelect = document.getElementById('subjectSelect');
  if (subjectSelect) subjectSelect.innerHTML = '';

  db.ref('classes').once('value').then(snap => {
    snap.forEach(cSnap => {
      const c = cSnap.val();
      const classId = cSnap.key;
      if (c.subjects) {
        Object.keys(c.subjects).forEach(subId => {
          const sub = c.subjects[subId];
          if (sub.teacherId === teacherId) {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerText = `${c.name} - ${sub.name}`;
            div.onclick = () => {
              openSection('attendance');
              loadAttendanceTable(classId, subId);
            };
            container.appendChild(div);

            // populate subject dropdown
            const opt = document.createElement('option');
            opt.value = `${classId}|${subId}`;
            opt.textContent = `${c.name} - ${sub.name}`;
            subjectSelect.appendChild(opt);
          }
        });
      }
    });
  });
}

/***********************
 ATTENDANCE TABLE
************************/
function loadAttendanceTable(classId, subjectId) {
  const val = document.getElementById('subjectSelect').value;
  if (!val && (!classId || !subjectId)) return;
  if (!classId || !subjectId) [classId, subjectId] = val.split('|');

  const tbody = document.getElementById('attendanceBody');
  tbody.innerHTML = '';
  attendanceData = {};

  db.ref(`classes/${classId}/students`).once('value').then(snap => {
    let students = [];
    snap.forEach(s => {
      students.push({ roll: s.val().roll, name: s.val().name, id: s.key });
    });
    students.sort((a,b) => a.roll - b.roll);

    students.forEach(s => {
      attendanceData[s.id] = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td class="attendance-buttons">
          <button class="present" onclick="markAttendance('${s.id}','Present', this)">Present</button>
          <button class="absent" onclick="markAttendance('${s.id}','Absent', this)">Absent</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function markAttendance(id,status,btn) {
  attendanceData[id] = status;
  const parent = btn.parentElement;
  Array.from(parent.children).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

/***********************
 SAVE ATTENDANCE
************************/
function saveAttendance() {
  const val = document.getElementById('subjectSelect').value;
  if (!val) return toast("Select a class and subject ⚠️");
  const [classId, subjectId] = val.split('|');
  const today = new Date().toISOString().slice(0,10);

  db.ref(`attendance/${classId}/${subjectId}/${today}`).set(attendanceData)
    .then(() => toast("Attendance Saved ✅"));
}

/***********************
 PROFILE
************************/
function loadProfile() {
  db.ref('users/' + teacherId).once('value').then(snap => {
    const t = snap.val();
    document.getElementById('profileName').value = t.name;
    document.getElementById('profileEmail').value = t.email;
  });
}

function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  if(!name) return toast("Enter name ⚠️");
  db.ref('users/' + teacherId).update({name}).then(()=> toast("Profile Saved ✅"));
}

/***********************
 TOAST
************************/
function toast(msg){
  const t = document.createElement('div');
  t.className='toast';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add('show'),100);
  setTimeout(()=> t.classList.remove('show'),3000);
  setTimeout(()=> t.remove(),3500);
    }
