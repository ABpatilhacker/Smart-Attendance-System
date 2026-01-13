let teachers = [];
let classes = [];

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  toggleSidebar();
}

function addTeacher() {
  const input = document.getElementById("teacherName");
  if (!input.value) return;

  teachers.push(input.value);
  input.value = "";
  renderTeachers();
}

function renderTeachers() {
  const list = document.getElementById("teacherList");
  list.innerHTML = "";
  teachers.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    list.appendChild(li);
  });
  document.getElementById("teacherCount").textContent = teachers.length;
}

function addClass() {
  const input = document.getElementById("className");
  if (!input.value) return;

  classes.push(input.value);
  input.value = "";
  renderClasses();
}

function renderClasses() {
  const list = document.getElementById("classList");
  list.innerHTML = "";
  classes.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    list.appendChild(li);
  });
  document.getElementById("classCount").textContent = classes.length;
}