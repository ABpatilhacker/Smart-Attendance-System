const auth = firebase.auth();
const database = firebase.database();

// LOGOUT
function logout() {
  auth.signOut().then(()=>location.href='index.html');
}

// SIDEBAR TOGGLE
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// DASHBOARD
function showDashboard() {
  document.getElementById('content').innerHTML = `
    <h2>Dashboard</h2>
    <p>Welcome Admin! Use the sidebar to manage users and classes.</p>
  `;
}

// PENDING APPROVAL
function showPending() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>Pending Users</h2><ul id="pending-list"></ul>`;
  const list = document.getElementById('pending-list');
  list.innerHTML='';
  database.ref('users').orderByChild('status').equalTo('pending').once('value').then(snap=>{
    snap.forEach(p=>{
      const li=document.createElement('li');
      li.textContent = `${p.val().name} (${p.val().role})`;
      const approveBtn=document.createElement('button');
      approveBtn.textContent='Approve';
      approveBtn.classList.add('btn','primary');
      approveBtn.onclick=()=>{
        database.ref('users/'+p.key+'/status').set('approved');
        alert('User approved!');
        showPending();
      };
      li.appendChild(approveBtn);
      list.appendChild(li);
    });
  });
}

// TEACHERS
function showTeachers() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>Teachers</h2>
    <input id="tname" placeholder="Name">
    <input id="temail" placeholder="Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacher-list"></ul>`;
  loadTeachers();
}

function addTeacher() {
  const name = document.getElementById('tname').value;
  const email = document.getElementById('temail').value;
  if(!name || !email) return alert('Fill all fields');
  const newTeacherRef = database.ref('users').push();
  newTeacherRef.set({name:name,email:email,role:'teacher',status:'approved'});
  database.ref('teachers/'+newTeacherRef.key).set({name:name,subjects:{}});
  alert('Teacher Added!');
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById('teacher-list');
  list.innerHTML='';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const li = document.createElement('li');
      li.textContent = t.val().name + ' ('+t.key+')';
      list.appendChild(li);
    });
  });
}

// CLASSES & SUBJECTS
function showClasses() {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>Classes & Subjects</h2>
    <input id="classname" placeholder="Class Name">
    <input id="subjectname" placeholder="Subject Name">
    <select id="teacher-select"><option value="">Select Teacher</option></select>
    <button class="btn primary" onclick="addClassSubject()">Add</button>
    <ul id="class-list"></ul>`;
  loadTeachersDropdown();
  loadClasses();
}

function loadTeachersDropdown() {
  const select = document.getElementById('teacher-select');
  select.innerHTML='<option value="">Select Teacher</option>';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const option=document.createElement('option');
      option.value=t.key;
      option.textContent=t.val().name;
      select.appendChild(option);
    });
  });
}

function addClassSubject() {
  const classname = document.getElementById('classname').value;
  const subjectname = document.getElementById('subjectname').value;
  const teacherId = document.getElementById('teacher-select').value;
  if(!classname || !subjectname || !teacherId) return alert('Fill all fields');
  database.ref('teachers/'+teacherId+'/subjects/'+classname).set({subject:subjectname,students:{}});
  alert('Class & Subject assigned!');
  loadClasses();
}

function loadClasses() {
  const list=document.getElementById('class-list');
  list.innerHTML='';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const teacher = t.val();
      const li = document.createElement('li');
      li.textContent = teacher.name + ': ';
      const subjects = teacher.subjects || {};
      const text = Object.keys(subjects).map(cls=>cls + ' ('+subjects[cls].subject+')').join(', ');
      li.textContent += text;
      list.appendChild(li);
    });
  });
}
