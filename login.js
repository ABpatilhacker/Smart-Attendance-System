function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(result => {
      const uid = result.user.uid;

      return firebase.database().ref("users/" + uid).once("value");
    })
    .then(snapshot => {
      if (!snapshot.exists()) {
        alert("User record not found in database");
        firebase.auth().signOut();
        return;
      }

      const role = snapshot.val().role;

      if (role === "admin") {
        location.href = "admin.html";
      } 
      else if (role === "teacher") {
        location.href = "teacher.html";
      } 
      else if (role === "student") {
        location.href = "student.html";
      } 
      else {
        alert("Invalid role");
        firebase.auth().signOut();
      }
    })
    .catch(error => {
      alert(error.message);
    });
}
