// Get elements
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const view = document.getElementById("view");

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

// Close sidebar
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

// Close sidebar when clicking overlay
overlay.addEventListener("click", closeSidebar);

// Menu handler
function handleMenu(type) {
  closeSidebar();

  if (type === "dashboard") showDashboard();
  if (type === "pending") showPending();
  if (type === "classes") showClasses();
}

// Dashboard view
function showDashboard() {
  view.innerHTML = `
    <div class="card">
      <h2>📊 Dashboard Overview</h2>
      <p><b>Total Teachers:</b> 12</p>
      <p><b>Total Students:</b> 240</p>
      <p><b>Classes:</b> 8</p>
    </div>
  `;
}

// Pending approvals view
function showPending() {
  view.innerHTML = `
    <div class="card">
      <h2>⏳ Pending Approvals</h2>
      <p>No pending approvals right now.</p>
    </div>
  `;
}

// Classes view
function showClasses() {
  view.innerHTML = `
    <div class="card">
      <h2>🏫 Classes</h2>
      <ul>
        <li>BCA FY</li>
        <li>BCA SY</li>
        <li>BCA TY</li>
      </ul>
    </div>
  `;
}

// Logout
function logout() {
  window.location.href = "login.html";
}

// Load dashboard by default
showDashboard();
