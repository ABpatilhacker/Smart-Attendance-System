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
