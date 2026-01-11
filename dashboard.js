document.addEventListener("DOMContentLoaded", function () {
  window.toggleSidebar = function () {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
      console.error("Sidebar not found");
      return;
    }
    sidebar.classList.toggle("open");
  };

  window.logout = function () {
    location.href = "index.html";
  };
});
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}
document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebar");
  const btn = document.querySelector(".menu-btn");

  if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});
