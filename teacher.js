const subject = "Maths";
const today = new Date().toISOString().split("T")[0];

firebase.database()
  .ref(`teachers/TEACHER_UID/subjects/${subject}/students`)
  .once("value", snap => {
    const ul = document.getElementById("studentList");
    ul.innerHTML = "";

    snap.forEach(s => {
      ul.innerHTML += `
        <li>
          <span>${s.val().name} (${s.key})</span>
          <div class="attendance-btns">
            <button class="btn present" onclick="mark('${s.key}','present',this)">P</button>
            <button class="btn absent" onclick="mark('${s.key}','absent',this)">A</button>
          </div>
        </li>`;
    });
  });

function mark(roll, status, btn) {
  firebase.database()
    .ref(`attendance/${subject}/${today}/${roll}`)
    .set(status);

  btn.classList.add("active");
}function logout(){
  firebase.auth().signOut();
  location.href = "index.html";
}