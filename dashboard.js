function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}

function showSection(sectionId) {
  // hide all sections
  document.querySelectorAll(".section").forEach(sec => {
    sec.style.display = "none";
  });

  // show selected section
  document.getElementById(sectionId).style.display = "block";

  // close sidebar after click (MOBILE FIX ✅)
  document.getElementById("sidebar").classList.remove("open");
}
