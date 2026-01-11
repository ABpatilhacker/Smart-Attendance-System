function logout() {
  firebase.auth().signOut().then(() => {
    location.href = "index.html";
  });
}

/* ---------------- CLASSES ---------------- */

function showClasses() {
  const c = document.getElementById("content");
  c.innerHTML = `
    <h2>Manage Classes</h2>
    <input id="className" placeholder="Class Name (FYBCA)">
    <button class="btn primary" onclick="addClass()">Add Class</button>
    <ul id="classList"></ul>
  `;
  loadClasses();
}

function addClass() {
  const name = document.getElementById("className").value;
  if (!name) return alert("Enter class name");

  firebase.database().ref("classes/" + name).set({
    name: name
  });

  loadClasses();
}

function loadClasses() {
  const ul = document.getElementById("classList");
  if (!ul) return;
  ul.innerHTML = "";

  firebase.database().ref("classes").once("value", snap => {
    snap.forEach(cls => {
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${cls.key}</b>
        <button onclick="addSubject('${cls.key}')">➕ Subject</button>
      `;
      ul.appendChild(li);
    });
  });
}

function addSubject(className) {
  const subject = prompt("Enter subject name");
  if (!subject) return;

  firebase.database()
    .ref(`classes/${className}/subjects/${subject}`)
    .set(true);

  alert("Subject added");
}

/* ---------------- TEACHERS ---------------- */

function showTeachers() {
  const c = document.getElementById("content");
  c.innerHTML = `
    <h2>Manage Teachers</h2>

    <input id="tname" placeholder="Teacher Name">
    <input id="temail" placeholder="Teacher Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>

    <ul id="teacherList"></ul>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = tname.value;
  const email = temail.value;

  if (!name || !email) return alert("Fill all fields");

  const ref = firebase.database().ref("teachers").push();
  ref.set({
    name: name,
    email: email,
    assignedClasses: {},
    subjects: {}
  });

  alert("Teacher Added");
  loadTeachers();
}

function loadTeachers() {
  const ul = document.getElementById("teacherList");
  if (!ul) return;
  ul.innerHTML = "";

  firebase.database().ref("teachers").once("value", snap => {
    snap.forEach(t => {
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${t.val().name}</b>
        <button onclick="assign('${t.key}')">Assign</button>
      `;
      ul.appendChild(li);
    });
  });
}

/* ---------------- ASSIGN CLASS + SUBJECT ---------------- */

function assign(teacherId) {
  firebase.database().ref("classes").once("value", snap => {
    let html = "Select class:\n";
    snap.forEach(c => html += c.key + "\n");

    const cls = prompt(html);
    if (!cls) return;

    firebase.database()
      .ref(`teachers/${teacherId}/assignedClasses/${cls}`)
      .set(true);

    firebase.database()
      .ref(`classes/${cls}/subjects`)
      .once("value", s => {
        let subs = "Select subject:\n";
        s.forEach(x => subs += x.key + "\n");

        const subject = prompt(subs);
        if (!subject) return;

        firebase.database()
          .ref(`teachers/${teacherId}/subjects/${subject}`)
          .set(true);

        alert("Assigned Successfully");
      });
  });
}
