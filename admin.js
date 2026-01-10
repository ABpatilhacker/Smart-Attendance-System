function addStudent(subject) {
  const roll = document.getElementById("roll").value;
  const name = document.getElementById("name").value;

  firebase.database()
    .ref(`teachers/TEACHER_UID/subjects/${subject}/students/${roll}`)
    .set({ name });

  alert("Student added");
}

function addTeacher(uid, name) {
  firebase.database()
    .ref(`teachers/${uid}`)
    .set({
      name,
      subjects: {}
    });

  firebase.database()
    .ref(`users/${uid}`)
    .set({ role: "teacher" });

  alert("Teacher added");
}function logout(){
  firebase.auth().signOut();
  location.href = "index.html";
}