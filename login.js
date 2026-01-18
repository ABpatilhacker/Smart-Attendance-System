// ---------- LOGIN ----------
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      firebase.database().ref("users/" + uid).once("value")
        .then((snapshot) => {
          if (!snapshot.exists()) {
            alert("User data not found");
            firebase.auth().signOut();
            return;
          }

          const user = snapshot.val();

          // Approved check
          if (user.approved !== true) {
            alert("Your account is not approved");
            firebase.auth().signOut();
            return;
          }

          // Auto redirect by role
          if (user.role === "admin") {
            window.location.href = "admin.html";
          } 
          else if (user.role === "teacher") {
            window.location.href = "teacher.html";
          } 
          else if (user.role === "student") {
            window.location.href = "student.html";
          } 
          else {
            alert("Invalid role");
            firebase.auth().signOut();
          }
        });
    })
    .catch((error) => {
      alert(error.message);
    });
}

// ---------- SIGNUP ----------
function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;

  if (!name || !email || !password || !role) {
    alert("Please fill all fields");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      firebase.database().ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        approved: true, // ✅ auto-approved
        createdAt: new Date().toISOString()
      });

      alert("Signup successful! Please login.");
      location.reload();
    })
    .catch((error) => {
      alert(error.message);
    });
}
