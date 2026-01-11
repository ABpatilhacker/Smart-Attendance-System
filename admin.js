const auth = firebase.auth();
const database = firebase.database();

// ===== Logout =====
function logout() {
  auth.signOut().then(() => location.href='index.html');
}

// ===== Dashboard Home =====
function showDashboard() {
  document.getElementById('content').innerHTML = `
    <h2>Dashboard</h2>
    <p>Welcome Admin! Use the sidebar to manage users and classes.</p>
  `;
}

// ===== Pending Approval =====
function showPending() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>Pending Users</h2><ul id="pending-list"></ul>`;
  const list = document.getElementById('pending-list');
  list.innerHTML = '';

  database.ref('users').orderByChild('status').equalTo('pending').once('value').then(snap => {
    snap.forEach(userSnap => {
      const user = userSnap.val();
      const li = document.createElement('li');
      li.textContent = `${user.name} (${user.role})`;

      const approveBtn = document.createElement('button');
      approveBtn.textContent = 'Approve';
      approveBtn.classList.add('btn', 'primary');
      approveBtn.onclick = () => {
        database.ref('users/' + userSnap.key + '/status').set('approved');
        alert(`${user.name} approved!`);
        showPending();
      };

      li.appendChild(approveBtn);
      list.appendChild(li);
    });
  });
}

// ===== Teachers Management =====
function showTeachers() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>Teachers</h2>
    <input id="tname" placeholder="Name">
    <input id="temail" placeholder="Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacher-list"></ul>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = document.getElementById('tname').value.trim();
  const email = document.getElementById('temail').value.trim();
  if(!name || !email) return alert('Fill all fields');

  const newRef = database.ref('users').push();
  newRef.set({name, email, role:'teacher', status:'approved'});
  database.ref('teachers/'+newRef.key).set({name, subjects:{}});
  alert('Teacher Added!');
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById('teacher-list');
  list.innerHTML = '';
  database.ref('teachers').once('value').then(snap => {
    snap.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t.val().name + ' (' + t.key + ')';
      list.appendChild(li);
    });
  });
}

// ===== Students Management =====
function showStudents() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>Students</h2>
    <input id="sname" placeholder="Name">
    <input id="semail" placeholder="Email">
    <button class="btn primary" onclick="addStudent()">Add Student</button>
    <ul id="student-list"></ul>
  `;
  loadStudents();
}

function addStudent() {
  const name = document.getElementById('sname').value.trim();
  const email = document.getElementById('semail').value.trim();
  if(!name || !email) return alert('Fill all fields');

  const newRef = database.ref('users').push();
  newRef.set({name, email, role:'student', status:'approved'});
  database.ref('students/'+newRef.key).set({name, attendance:{}});
  alert('Student Added!');
  loadStudents();
}

function loadStudents() {
  const list = document.getElementById('student-list');
  list.innerHTML = '';
  database.ref('students').once('value').then(snap => {
    snap.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.val().name + ' (' + s.key + ')';
      list.appendChild(li);
    });
  });
}

// ===== Classes & Subjects Assignment =====
function showClasses() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>Classes & Subjects</h2>
    <input id="classname" placeholder="Class Name">
    <input id="subjectname" placeholder="Subject Name">
    <select id="teacher-select"><option value="">Select Teacher</option></select>
    <button class="btn primary" onclick="addClassSubject()">Add</button>
    <ul id="class-list"></ul>
  `;
  loadTeachersDropdown();
  loadClasses();
}

function loadTeachersDropdown() {
  const select = document.getElementById('teacher-select');
  select.innerHTML = '<option value="">Select Teacher</option>';
  database.ref('teachers').once('value').then(snap => {
    snap.forEach(t => {
      const option = document.createElement('option');
      option.value = t.key;
      option.textContent = t.val().name;
      select.appendChild(option);
    });
  });
}

function addClassSubject() {
  const classname = document.getElementById('classname').value.trim();
  const subjectname = document.getElementById('subjectname').value.trim();
  const teacherId = document.getElementById('teacher-select').value;

  if(!classname || !subjectname || !teacherId) return alert('Fill all fields');

  // Save subject under teacher
  database.ref('teachers/'+teacherId+'/subjects/'+classname).set({subject:subjectname, students:{}});
  alert('Class & Subject assigned!');
  loadClasses();
}

function loadClasses() {
  const list = document.getElementById('class-list');
  list.innerHTML = '';
  database.ref('teachers').once('value').then(snap => {
    snap.forEach(t => {
      const teacher = t.val();
      const li = document.createElement('li');
      li.textContent = teacher.name + ': ';
      const subjects = teacher.subjects || {};
      const text = Object.keys(subjects).map(cls => cls + ' (' + subjects[cls].subject + ')').join(', ');
      li.textContent += text;
      list.appendChild(li);
    });
  });
                                            }
