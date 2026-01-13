// Sidebar logic
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// Menu handler
function handleMenu(type) {
  closeSidebar();

  if (type === "dashboard") showDashboard();
  if (type === "pending") showPending();
  if (type === "classes") showClasses();
}

// Dashboard view
function showDashboard() {
  document.getElementById("view").innerHTML = `
    <h2>📊 Dashboard</h2>
    <p class="subtitle">System overview</p>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Teachers</h3>
        <p>12</p>
      </div>
      <div class="stat-card">
        <h3>Total Students</h3>
        <p>240</p>
      </div>
      <div class="stat-card">
        <h3>Classes</h3>
        <p>8</p>
      </div>
      <div class="stat-card">
        <h3>Pending Approvals</h3>
        <p>3</p>
      </div>
    </div>
  `;
}

// Pending approvals
function showPending() {
  document.getElementById("view").innerHTML = `
    <h2>⏳ Pending Approvals</h2>

    <div class="card">
      <b>teacher1@gmail.com</b> (Teacher)
      <br><br>
      <button class="primary">Approve</button>
    </div>

    <div class="card">
      <b>student1@gmail.com</b> (Student)
      <br><br>
      <button class="primary">Approve</button>
    </div>
  `;
}

// Classes
function showClasses() {
  document.getElementById("view").innerHTML = `
    <h2>🏫 Classes</h2>

    <div class="card">
      <ul>
        <li>BCA FY</li>
        <li>BCA SY</li>
        <li>BCA TY</li>
        <li>BSc CS FY</li>
      </ul>
    </div>
  `;
}

// Logout
function logout() {
  alert("Logged out successfully");
  window.location.href = "login.html";
}

// Load default view
showDashboard();
