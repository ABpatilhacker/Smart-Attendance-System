function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");

  if (!sidebar) {
    alert("Sidebar not found ❌");
    return;
  }

  sidebar.classList.toggle("open");
}
