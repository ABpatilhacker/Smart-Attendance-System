// PAGE SWITCH
function showSection(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  document.getElementById(id).classList.add("active-page");
}

// LOGOUT
function logout() {
  firebase.auth().signOut().then(() => location.href = "login.html");
}

// LOAD USERS
firebase.database().ref("users").on("value", snap => {
  let teachers = 0, students = 0, pending = 0;

  document.getElementById("approvalList").innerHTML = "";
  document.getElementById("userList").innerHTML = "";

  snap.forEach(user => {
    const u = user.val();

    if (u.role === "teacher") teachers++;
    if (u.role === "student") students++;
    if (u.status === "pending") pending++;

    // Pending approvals
    if (u.status === "pending") {
      document.getElementById("approvalList").innerHTML += `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>
            <button onclick="approveUser('${user.key}')">Approve</button>
          </td>
        </tr>`;
    }

    // All users
    document.getElementById("userList").innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.status}</td>
      </tr>`;
  });

  totalTeachers.textContent = teachers;
  totalStudents.textContent = students;
  pendingUsers.textContent = pending;
});

// APPROVE USER
function approveUser(uid) {
  firebase.database().ref("users/" + uid).update({
    status: "approved"
  });
}

// CREATE CLASS
function createClass() {
  const name = className.value.trim();
  if (!name) return alert("Enter class name");

  firebase.database().ref("classes").push({ name });
  alert("Class created");
  className.value = "";
}

// ASSIGN SUBJECT
function assignSubject() {
  const tid = teacherId.value.trim();
  const subject = subjectName.value.trim();
  if (!tid || !subject) return alert("Fill all fields");

  firebase.database().ref("subjects/" + tid).push({ subject });
  alert("Subject assigned");
}
