const auth = firebase.auth();
const database = firebase.database();

// ===== Toggle Sidebar =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== Logout =====
function logout() {
  auth.signOut().then(() => location.href='index.html');
}

// ===== Dashboard =====
function showDashboard() {
  document.getElementById('content').innerHTML = `
    <h2>Dashboard</h2>
    <p>Welcome Teacher! Use the sidebar to view classes and mark attendance.</p>
  `;
}

// ===== Classes View =====
function showClasses() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>My Classes</h2><div id="classes-list"></div>`;
  loadTeacherClasses();
}

function loadTeacherClasses() {
  const uid = auth.currentUser.uid;
  const list = document.getElementById('classes-list');
  list.innerHTML = '';

  database.ref('teachers/' + uid + '/subjects').once('value').then(snap => {
    if(!snap.exists()) return list.innerHTML = '<p>No classes assigned yet.</p>';
    snap.forEach(clsSnap => {
      const cls = clsSnap.key;
      const subject = clsSnap.val().subject;
      const students = clsSnap.val().students || {};

      const div = document.createElement('div');
      div.classList.add('card');
      div.innerHTML = `<h3>${cls} (${subject})</h3>
        <ul id="students-${cls}"></ul>`;
      
      list.appendChild(div);

      const ul = div.querySelector('ul');
      if(Object.keys(students).length === 0) {
        ul.innerHTML = '<li>No students added yet.</li>';
      } else {
        Object.keys(students).forEach(sid => {
          const li = document.createElement('li');
          li.textContent = students[sid].name;

          const presentBtn = document.createElement('button');
          presentBtn.textContent = 'Present';
          presentBtn.classList.add('present');
          presentBtn.onclick = () => markAttendance(cls, sid, 'present', presentBtn, absentBtn);

          const absentBtn = document.createElement('button');
          absentBtn.textContent = 'Absent';
          absentBtn.classList.add('absent');
          absentBtn.onclick = () => markAttendance(cls, sid, 'absent', presentBtn, absentBtn);

          const btnDiv = document.createElement('div');
          btnDiv.classList.add('attendance-btns');
          btnDiv.appendChild(presentBtn);
          btnDiv.appendChild(absentBtn);

          li.appendChild(btnDiv);
          ul.appendChild(li);
        });
      }
    });
  });
}

// ===== Mark Attendance =====
function markAttendance(cls, studentId, status, presentBtn, absentBtn) {
  const today = new Date().toISOString().slice(0,10);
  const uid = auth.currentUser.uid;

  database.ref(`teachers/${uid}/subjects/${cls}/students/${studentId}/attendance/${today}`).set(status)
    .then(() => {
      if(status === 'present') {
        presentBtn.classList.add('active');
        absentBtn.classList.remove('active');
      } else {
        absentBtn.classList.add('active');
        presentBtn.classList.remove('active');
      }
    });
}

// ===== Check Auth =====
auth.onAuthStateChanged(user => {
  if(!user) location.href='index.html';
});
