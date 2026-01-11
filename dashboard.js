document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      main.classList.toggle("shift");
    });
  }
});

function logout() {
  firebase.auth().signOut().then(() => {
    location.href = "index.html";
  });
}
