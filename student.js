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
    <p>Welcome Student! Check your attendance using the sidebar.</p>
  `;
}

// ===== Show Attendance =====
function showAttendance() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>My Attendance</h2><div id="attendance-list"></div>`;
  loadAttendance();
}

function loadAttendance() {
  const uid = auth.currentUser.uid;
  const list = document.getElementById('attendance-list');
  list.innerHTML = '';

  database.ref('teachers').once('value').then(snap => {
    snap.forEach(tSnap => {
      const subjects = tSnap.val().subjects || {};
      Object.keys(subjects).forEach(cls => {
        const students = subjects[cls].students || {};
        if(students[uid]) {
          const div = document.createElement('div');
          div.classList.add('card');
          div.innerHTML = `<h3>${cls} (${subjects[cls].subject})</h3>`;
          
          const ul = document.createElement('ul');
          const attendance = students[uid].attendance || {};
          if(Object.keys(attendance).length === 0) {
            ul.innerHTML = '<li>No attendance marked yet</li>';
          } else {
            Object.keys(attendance).forEach(date => {
              const li = document.createElement('li');
              li.textContent = `${date}: ${attendance[date].toUpperCase()}`;
              ul.appendChild(li);
            });
          }
          div.appendChild(ul);
          list.appendChild(div);
        }
      });
    });
  });
}

// ===== Check Auth =====
auth.onAuthStateChanged(user => {
  if(!user) location.href='index.html';
});
