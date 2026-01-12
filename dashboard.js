// ================= FIREBASE =================
const auth = firebase.auth();
const database = firebase.database();

// ================= SIDEBAR TOGGLE =================
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

// Overlay click closes sidebar
overlay.addEventListener("click", closeSidebar);

// Handle menu click & auto-close sidebar
function handleMenu(type) {
  closeSidebar();
  switch(type){
    case "dashboard": showDashboard(); break;
    case "pending": showPending(); break;
    case "teachers": showTeachers(); break;
    case "classes": showClasses(); break;
  }
}

// ================= LOGOUT =================
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ================= DASHBOARD =================
function showDashboard() {
  document.getElementById("view").innerHTML = `
    <div class="card">
      <h2>📊 Dashboard Overview</h2>
      <div id="stats">
        <p>Total Teachers: <span id="total-teachers">0</span></p>
        <p>Total Students: <span id="total-students">0</span></p>
        <p>Total Classes: <span id="total-classes">0</span></p>
      </div>
    </div>
  `;

  // Fetch stats from database
  database.ref('teachers').once('value').then(snap => {
    document.getElementById("total-teachers").textContent = snap.numChildren();
  });
  database.ref('students').once('value').then(snap => {
    document.getElementById("total-students").textContent = snap.numChildren();
  });
  database.ref('teachers').once('value').then(snap => {
    let classCount = 0;
    snap.forEach(t => {
      const subjects = t.val().subjects || {};
      classCount += Object.keys(subjects).length;
    });
    document.getElementById("total-classes").textContent = classCount;
  });
}

// ================= PENDING APPROVAL =================
function showPending() {
  const view = document.getElementById("view");
  view.innerHTML = `<h2>⏳ Pending Approvals</h2><ul id="pending-list"></ul>`;
  const list = document.getElementById("pending-list");
  list.innerHTML = '';

  database.ref('users').orderByChild('status').equalTo('pending').once('value').then(snap => {
    if(!snap.exists()){
      list.innerHTML = '<li>No pending approvals</li>';
      return;
    }
    snap.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.val().name} (${user.val().role})`;

      const approveBtn = document.createElement('button');
      approveBtn.textContent = 'Approve';
      approveBtn.classList.add('btn', 'primary');
      approveBtn.onclick = () => {
        database.ref('users/' + user.key).update({ status: 'approved' });
        alert('User approved!');
        showPending();
      };

      li.appendChild(approveBtn);
      list.appendChild(li);
    });
  });
}

// ================= TEACHERS =================
function showTeachers() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <h2>👨‍🏫 Teachers</h2>
    <input id="tname" placeholder="Name">
    <input id="temail" placeholder="Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacher-list"></ul>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = document.getElementById("tname").value.trim();
  const email = document.getElementById("temail").value.trim();
  if(!name || !email) return alert("Fill all fields");

  const newTeacherRef = database.ref('teachers').push();
  newTeacherRef.set({ name: name, email: email, subjects: {} });
  database.ref('users/' + newTeacherRef.key).set({ name, email, role: 'teacher', status: 'approved' });
  alert('Teacher added!');
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById("teacher-list");
  list.innerHTML = '';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const li = document.createElement('li');
      li.textContent = t.val().name + ' ('+t.val().email+')';
      list.appendChild(li);
    });
  });
}

// ================= CLASSES & SUBJECTS =================
function showClasses() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <h2>🏫 Classes & Subjects</h2>
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
  const select = document.getElementById("teacher-select");
  select.innerHTML = '<option value="">Select Teacher</option>';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const option = document.createElement('option');
      option.value = t.key;
      option.textContent = t.val().name;
      select.appendChild(option);
    });
  });
}

function addClassSubject() {
  const classname = document.getElementById("classname").value.trim();
  const subjectname = document.getElementById("subjectname").value.trim();
  const teacherId = document.getElementById("teacher-select").value;
  if(!classname || !subjectname || !teacherId) return alert('Fill all fields');

  database.ref('teachers/'+teacherId+'/subjects/'+classname).set({ subject: subjectname, students: {} });
  alert('Class & Subject assigned!');
  loadClasses();
}

function loadClasses() {
  const list = document.getElementById("class-list");
  list.innerHTML = '';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const teacher = t.val();
      const subjects = teacher.subjects || {};
      Object.keys(subjects).forEach(cls=>{
        const li = document.createElement('li');
        li.textContent = `${teacher.name}: ${cls} (${subjects[cls].subject})`;
        list.appendChild(li);
      });
    });
  });
}

// ================= INIT =================
showDashboard();