// LOGIN
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const role = document.getElementById("loginRole").value;

  if (!email || !password || !role) {
    alert("Please fill all fields");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      firebase.database().ref("users/" + uid).once("value")
        .then((snapshot) => {
          if (!snapshot.exists()) {
            alert("User data not found");
            return;
          }

          const userData = snapshot.val();

          // Role check
          if (userData.role !== role) {
            alert("Wrong role selected");
            return;
          }

          // Approved check (always true by default)
          if (userData.approved !== true) {
            alert("Your account is not approved");
            return;
          }

          // Redirect based on role
          if (role === "admin") {
            window.location.href = "admin.html";
          } else if (role === "teacher") {
            window.location.href = "teacher.html";
          } else {
            window.location.href = "student.html";
          }
        });
    })
    .catch((error) => {
      alert(error.message);
    });
}

// SIGNUP
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
        approved: true,   // 🔥 IMPORTANT: auto-approved
        createdAt: new Date().toISOString()
      });

      alert("Account created successfully");
      location.reload();
    })
    .catch((error) => {
      alert(error.message);
    });
}
