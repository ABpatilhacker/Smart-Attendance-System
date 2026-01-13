function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

function handleMenu(type) {
  closeSidebar();

  if (type === "dashboard") showDashboard();
  if (type === "pending") showPending();
  if (type === "classes") showClasses();
  if (type === "teachers") showTeachers();
  if (type === "students") showStudents();
  if (type === "assign") showAssign();
}

/* DASHBOARD */
function showDashboard() {
  view.innerHTML = `
    <h2>📊 Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card"><h3>Teachers</h3><p>12</p></div>
      <div class="stat-card"><h3>Students</h3><p>240</p></div>
      <div class="stat-card"><h3>Classes</h3><p>8</p></div>
      <div class="stat-card"><h3>Pending</h3><p>3</p></div>
    </div>
  `;
}

/* PENDING */
function showPending() {
  view.innerHTML = `
    <h2>⏳ Pending Approvals</h2>
    <div class="card">
      teacher@gmail.com <br><br>
      <button class="primary">Approve</button>
    </div>
  `;
}

/* CLASSES */
function showClasses() {
  view.innerHTML = `
    <h2>🏫 Classes</h2>
    <div class="card">
      BCA FY<br>BCA SY<br>BCA TY<br>BSc CS
    </div>
  `;
}

/* TEACHERS */
function showTeachers() {
  view.innerHTML = `
    <h2>👨‍🏫 Teachers</h2>

    <div class="card">
      <b>Add Teacher</b><br><br>
      <input placeholder="Teacher Name"><br><br>
      <input placeholder="Email"><br><br>
      <button class="primary">Add</button>
    </div>

    <div class="card">
      <b>Teachers List</b>
      <ul>
        <li>Mr. Sharma</li>
        <li>Ms. Patil</li>
      </ul>
    </div>
  `;
}

/* STUDENTS */
function showStudents() {
  view.innerHTML = `
    <h2>👨‍🎓 Students</h2>

    <div class="card">
      <b>Students List</b>
      <ul>
        <li>Rahul (BCA FY)</li>
        <li>Aditi (BCA SY)</li>
      </ul>
    </div>
  `;
}

/* ASSIGN CLASSES */
function showAssign() {
  view.innerHTML = `
    <h2>🏫 Assign Classes</h2>

    <div class="card">
      <select>
        <option>Select Teacher</option>
        <option>Mr. Sharma</option>
        <option>Ms. Patil</option>
      </select><br><br>

      <select>
        <option>Select Class</option>
        <option>BCA FY</option>
        <option>BCA SY</option>
      </select><br><br>

      <button class="primary">Assign</button>
    </div>
  `;
}

/* LOGOUT */
function logout() {
  alert("Logged out");
  location.href = "login.html";
}

showDashboard();
